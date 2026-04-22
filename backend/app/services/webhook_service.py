import os
from pathlib import Path

from app.schemas.customer import CustomerCreateRequest
from app.schemas.whatsapp import WebhookMessage
from app.services.base import BaseService
from app.services.customer_service import CustomerService
from app.utils import whatsapp_client


class WebhookService(BaseService):
    def __init__(self, customer_service: CustomerService) -> None:
        self.customer_service = customer_service
        self.media_dir = Path("data/media")
        self.media_dir.mkdir(parents=True, exist_ok=True)

    async def handle_message(
        self, sender_number: str, sender_name: str | None, message: WebhookMessage
    ) -> None:
        await self.customer_service.get_or_create(
            CustomerCreateRequest(whatsapp_number=sender_number, name=sender_name)
        )

        if message.type == "image" and message.image:
            image_url = message.image.url
            if image_url:
                image_data = await whatsapp_client.download_media(image_url)
                
                # Create a filename based on message id or timestamp
                file_ext = message.image.mime_type.split("/")[-1] if message.image.mime_type else "jpg"
                filename = f"{message.id}.{file_ext}"
                file_path = self.media_dir / filename
                
                with open(file_path, "wb") as f:
                    f.write(image_data)
                
                print(f"Image saved locally to: {file_path}")

        # Default response (can be conditional)
        await whatsapp_client.send_template_message(to=sender_number)
