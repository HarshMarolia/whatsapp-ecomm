import logging

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import PlainTextResponse

from app.config import settings
from app.dependencies import get_webhook_service
from app.schemas.whatsapp import WebhookPayload
from app.services.webhook_service import WebhookService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["whatsapp-webhook"])


@router.get("", response_class=PlainTextResponse)
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return PlainTextResponse(hub_challenge)
    return Response(status_code=403)


@router.post("")
async def receive_message(
    request: Request,
    webhook_service: WebhookService = Depends(get_webhook_service),
):
    body = await request.json()
    print("raw payload--->", body)

    try:
        payload = WebhookPayload.model_validate(body)
    except Exception as e:
        logger.warning("Unrecognised webhook payload, ignoring. Error: %s", e)
        return Response(status_code=200)

    for entry in payload.entry:
        for change in entry.changes:
            value = change.value
            contacts_by_wa_id = {c.wa_id: c for c in value.contacts}
            for message in value.messages:
                sender_number = f"+{message.from_}"
                contact = contacts_by_wa_id.get(message.from_)
                sender_name = contact.profile.name if contact and contact.profile else None
                print("sender_number--->", sender_number)
                print("sender_name--->", sender_name)
                print("message_text--->", message.text.body if message.text else None)
                await webhook_service.handle_message(sender_number, sender_name, message)
    return Response(status_code=200)
