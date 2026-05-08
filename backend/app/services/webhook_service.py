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
        await self.customer_service.get_or_create(
            CustomerCreateRequest(whatsapp_number=sender_number, name=sender_name)
        )

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
                    # Preprocessing for better QR detection
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    blur = cv2.GaussianBlur(gray, (5, 5), 0)
                    
                    decoded_objects = decode(blur)
                    
                    decoded_qr = None
                    for obj in decoded_objects:
                        decoded_qr = obj.data.decode("utf-8")
                        break
                    
                    if decoded_qr:
                        print(f"Decoded QR Code: {decoded_qr}")
                        try:
                            product_id = uuid.UUID(decoded_qr)
                            product = await self.product_service.get_product(product_id)
                            
                            # Send product details back
                            variant_info = f"\n🏷️ Variant: {product.variant}" if product.variant else ""
                            message_text = (
                                f"📦 *Product Found: {product.name}*\n"
                                f"💰 Price: ₹{product.price}{variant_info}\n"
                                f"📦 Available: {product.inventory} in stock"
                            )
                            await whatsapp_client.send_text_message(to=sender_number, text=message_text)
                            return  # Exit after sending the product response
                            
                        except ValueError:
                            print(f"Invalid UUID from QR: {decoded_qr}")
                            await whatsapp_client.send_text_message(
                                to=sender_number, 
                                text=f"We found a QR code, but it doesn't seem to be a valid product code."
                            )
                            return
                        except ProductNotFoundError:
                            print(f"Product not found for QR: {decoded_qr}")
                            await whatsapp_client.send_text_message(
                                to=sender_number, 
                                text=f"Sorry, we couldn't find a product matching this QR code."
                            )
                            return
                    else:
                        print("No QR code found or decoded in the image.")
                else:
                    print("Error: Could not decode image data from WhatsApp.")

        # Default response (can be conditional)
        await whatsapp_client.send_template_message(to=sender_number)

