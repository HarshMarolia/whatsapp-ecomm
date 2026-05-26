import os
import uuid
import cv2
import numpy as np
from pyzbar.pyzbar import decode

from app.schemas.customer import CustomerCreateRequest
from app.schemas.whatsapp import WebhookMessage
from app.services.base import BaseService
from app.services.customer_service import CustomerService
from app.services.product_service import ProductService
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.exceptions import ProductNotFoundError
from app.utils import whatsapp_client


class WebhookService(BaseService):
    def __init__(
        self, customer_service: CustomerService, product_service: ProductService
    ) -> None:
        self.customer_service = customer_service
        self.product_service = product_service

    async def handle_message(
        self, sender_number: str, sender_name: str | None, message: WebhookMessage
    ) -> None:
        customer, _ = await self.customer_service.get_or_create(
            CustomerCreateRequest(whatsapp_number=sender_number, name=sender_name)
        )

        import re

        # Handle text message that matches the wa.me pre-filled text or directly typing the ID
        if message.type == "text" and message.text:
            text_body = message.text.body
            match = re.search(r'\[ID:\s*([A-Z0-9]+)\]', text_body)
            if match:
                fallback_id = match.group(1)
                product = await self.product_service.product_repo.get_by_fallback_id(fallback_id)
                if not product:
                    await whatsapp_client.send_text_message(to=sender_number, text="Sorry, we couldn't find a product matching this code.")
                    return
                
                if not product.is_active:
                    await whatsapp_client.send_text_message(to=sender_number, text="Sorry, this product is unavailable for now.")
                    return
                
                variant_info = f"\n🏷️ Variant: {product.variant}" if product.variant else ""
                stock_line = "📦 Available: In Stock" if product.inventory > 0 else "📦 Not Available: Out of Stock"
                message_text = (
                    f"📦 *Product Found: {product.name}*\n"
                    f"💰 Price: ₹{product.price}{variant_info}\n"
                    f"{stock_line}"
                )
                
                if product.inventory > 0:
                    buttons = [{"id": f"add_to_cart_{product.id}", "title": "Add to Cart"}]
                    await whatsapp_client.send_interactive_buttons(to=sender_number, text=message_text, buttons=buttons)
                else:
                    await whatsapp_client.send_text_message(to=sender_number, text=message_text)
                return

        if message.type == "text" and message.text and customer.conversation_state == "AWAITING_ADDRESS":
            address_text = message.text.body
            
            import re
            if not re.search(r'\b\d{6}\b', address_text) or len(address_text) < 15:
                await whatsapp_client.send_text_message(
                    to=sender_number, 
                    text="⚠️ Your address seems incomplete. Please reply with your full delivery address, ensuring you include your City, State, and a 6-digit Pincode."
                )
                return

            await self.customer_service.update_delivery_address_text(customer.id, address_text)
            await self.customer_service.update_conversation_state(customer.id, None)
            
            order = await OrderService.checkout(customer.id)
            if order:
                await whatsapp_client.send_text_message(
                    to=sender_number, 
                    text=f"🎉 Order Placed Successfully!\n\nYour Order ID is {order.id}.\nTotal Amount: ₹{order.total_amount}\nPayment Method: Cash on Delivery (COD).\nShipping to: {address_text}\n\nThank you for shopping with us!"
                )
            else:
                await whatsapp_client.send_text_message(to=sender_number, text="Your cart is empty. Please add items before checking out.")
            return

        if message.type == "interactive" and message.interactive and message.interactive.button_reply:
            payload = message.interactive.button_reply.id
            if payload.startswith("add_to_cart_"):
                product_id_str = payload.replace("add_to_cart_", "")
                try:
                    product_id = uuid.UUID(product_id_str)
                    await CartService.add_to_cart(customer.id, product_id)
                    text = "✅ Item added to your cart!"
                    buttons = [
                        {"id": "view_cart", "title": "View Cart"},
                        {"id": "checkout", "title": "Checkout"},
                        {"id": "add_more_items", "title": "Add More Items"}
                    ]
                    await whatsapp_client.send_interactive_buttons(to=sender_number, text=text, buttons=buttons)
                except Exception as e:
                    print(f"Error adding to cart: {e}")
                    await whatsapp_client.send_text_message(to=sender_number, text="Sorry, there was an issue adding this item to your cart.")
                return
            elif payload == "add_more_items":
                await whatsapp_client.send_text_message(to=sender_number, text="📸 Please scan or upload another product's QR code to add it to your cart.")
                return
            elif payload == "view_cart":
                summary = await CartService.get_cart_summary(customer.id)
                buttons = [
                    {"id": "checkout", "title": "Checkout"},
                    {"id": "add_more_items", "title": "Add More Items"}
                ]
                if "empty" in summary.lower():
                    await whatsapp_client.send_text_message(to=sender_number, text=summary)
                else:
                    await whatsapp_client.send_interactive_buttons(to=sender_number, text=summary, buttons=buttons)
                return
            elif payload == "checkout":
                if not customer.delivery_address:
                    await self.customer_service.update_conversation_state(customer.id, "AWAITING_ADDRESS")
                    await whatsapp_client.send_text_message(to=sender_number, text="📍 Please type your delivery address to proceed with the checkout.")
                    return
                
                saved_address = customer.delivery_address.get("text", "Saved Address")
                text = f"Would you like to use your last saved address for delivery?\n\n📍 Saved Address:\n{saved_address}"
                buttons = [
                    {"id": "use_saved_address", "title": "Use this address"},
                    {"id": "change_address", "title": "Change address"}
                ]
                await whatsapp_client.send_interactive_buttons(to=sender_number, text=text, buttons=buttons)
                return

            elif payload == "use_saved_address":
                order = await OrderService.checkout(customer.id)
                if order:
                    address = customer.delivery_address.get("text", "Saved Address") if customer.delivery_address else ""
                    await whatsapp_client.send_text_message(
                        to=sender_number, 
                        text=f"🎉 Order Placed Successfully!\n\nYour Order ID is {order.id}.\nTotal Amount: ₹{order.total_amount}\nPayment Method: Cash on Delivery (COD).\nShipping to: {address}\n\nThank you for shopping with us!"
                    )
                else:
                    await whatsapp_client.send_text_message(to=sender_number, text="Your cart is empty. Please add items before checking out.")
                return

            elif payload == "change_address":
                await self.customer_service.update_conversation_state(customer.id, "AWAITING_ADDRESS")
                await whatsapp_client.send_text_message(to=sender_number, text="📍 Please type your new delivery address to proceed with the checkout.")
                return

        if message.type == "image" and message.image:
            image_url = message.image.url
            if image_url:
                try:
                    image_data = await whatsapp_client.download_media(image_url)
                except Exception as e:
                    print(f"Failed to download image: {e}")
                    await whatsapp_client.send_text_message(to=sender_number, text="Sorry, we couldn't download the image right now.")
                    return
                
                # Convert bytes to numpy array
                nparr = np.frombuffer(image_data, np.uint8)
                
                # Decode into an OpenCV image matrix
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is not None:
                    # Try decoding the original image first
                    decoded_objects = decode(img)
                    if not decoded_objects:
                        # Fallback to grayscale if original fails
                        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                        decoded_objects = decode(gray)
                    
                    decoded_qr = None
                    for obj in decoded_objects:
                        decoded_qr = obj.data.decode("utf-8")
                        break
                    
                    if decoded_qr:
                        print(f"Decoded QR Code: {decoded_qr}")
                        import urllib.parse
                        decoded_str = urllib.parse.unquote(decoded_qr)
                        match = re.search(r'\[ID:\s*([A-Z0-9]+)\]', decoded_str)
                        
                        if match:
                            fallback_id = match.group(1)
                            product = await self.product_service.product_repo.get_by_fallback_id(fallback_id)
                            
                            if not product:
                                print(f"Product not found for fallback ID: {fallback_id}")
                                await whatsapp_client.send_text_message(
                                    to=sender_number, 
                                    text="Sorry, we couldn't find a product matching this QR code."
                                )
                                return
                            
                            if not product.is_active:
                                await whatsapp_client.send_text_message(
                                    to=sender_number, 
                                    text="Sorry, this product is unavailable for now."
                                )
                                return
                                
                            # Send product details back
                            variant_info = f"\n🏷️ Variant: {product.variant}" if product.variant else ""
                            stock_line = "📦 Available: In Stock" if product.inventory > 0 else "📦 Not Available: Out of Stock"
                            message_text = (
                                f"📦 *Product Found: {product.name}*\n"
                                f"💰 Price: ₹{product.price}{variant_info}\n"
                                f"{stock_line}"
                            )
                            
                            if product.inventory > 0:
                                buttons = [{"id": f"add_to_cart_{product.id}", "title": "Add to Cart"}]
                                await whatsapp_client.send_interactive_buttons(to=sender_number, text=message_text, buttons=buttons)
                            else:
                                await whatsapp_client.send_text_message(to=sender_number, text=message_text)
                            return
                        else:
                            print(f"Could not find ID in QR: {decoded_qr}")
                            await whatsapp_client.send_text_message(
                                to=sender_number, 
                                text="We found a QR code, but it doesn't seem to be a valid product code."
                            )
                            return
                    else:
                        print("No QR code found or decoded in the image.")
                else:
                    print("Error: Could not decode image data from WhatsApp.")

        # Default response (can be conditional)
        await whatsapp_client.send_template_message(to=sender_number)

