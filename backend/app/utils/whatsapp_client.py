import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_GRAPH_API_URL = "https://graph.facebook.com/v18.0"


async def send_template_message(to: str) -> None:
    url = f"{_GRAPH_API_URL}/{settings.whatsapp_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to.lstrip("+"),  # WhatsApp API expects digits only, no leading +
        "type": "template",
        "template": {
            "name": settings.whatsapp_template_name,
            "language": {"code": settings.whatsapp_template_language},
        },
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        if not response.is_success:
            logger.error(
                "WhatsApp API error %s: %s", response.status_code, response.text
            )
        response.raise_for_status()


async def send_text_message(to: str, text: str) -> None:
    """Sends a text message using the WhatsApp Cloud API."""
    url = f"{_GRAPH_API_URL}/{settings.whatsapp_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to.lstrip("+"),
        "type": "text",
        "text": {"body": text},
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        if not response.is_success:
            logger.error(
                "WhatsApp API error %s: %s", response.status_code, response.text
            )
        response.raise_for_status()


async def download_media(url: str) -> bytes:
    """Downloads media from WhatsApp Cloud API using the access token."""
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if not response.is_success:
            logger.error(
                "Failed to download media: %s - %s", response.status_code, response.text
            )
        response.raise_for_status()
        return response.content
