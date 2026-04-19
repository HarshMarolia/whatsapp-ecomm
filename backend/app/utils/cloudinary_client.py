from __future__ import annotations

import io
import time

import anyio
import cloudinary
import cloudinary.uploader

from app.config import settings

_configured = False


def _ensure_configured() -> None:
    global _configured
    if not _configured:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        _configured = True


def get_upload_signature(folder: str = "products") -> dict:
    _ensure_configured()
    timestamp = int(time.time())
    params_to_sign = {"folder": folder, "timestamp": timestamp}
    signature = cloudinary.utils.api_sign_request(params_to_sign, settings.cloudinary_api_secret)
    return {
        "cloud_name": settings.cloudinary_cloud_name,
        "api_key": settings.cloudinary_api_key,
        "timestamp": timestamp,
        "signature": signature,
        "folder": folder,
    }


async def upload_image(image_bytes: bytes, public_id: str) -> str:
    _ensure_configured()

    def _upload() -> dict:
        return cloudinary.uploader.upload(
            io.BytesIO(image_bytes),
            public_id=public_id,
            overwrite=True,
            resource_type="image",
        )

    result = await anyio.to_thread.run_sync(_upload)
    return result["secure_url"]


def extract_public_id(cloudinary_url: str) -> str:
    """Extract public_id from a Cloudinary secure_url, stripping version and extension.

    e.g. https://res.cloudinary.com/name/image/upload/v1234/products/foo.jpg → products/foo
    """
    marker = "/upload/"
    after_upload = cloudinary_url.split(marker, 1)[1]
    # strip optional version segment (v followed by digits)
    if after_upload.startswith("v") and "/" in after_upload:
        segment, rest = after_upload.split("/", 1)
        if segment[1:].isdigit():
            after_upload = rest
    # strip file extension
    public_id, _ = after_upload.rsplit(".", 1) if "." in after_upload else (after_upload, "")
    return public_id


async def delete_image(cloudinary_url: str) -> None:
    _ensure_configured()
    public_id = extract_public_id(cloudinary_url)

    def _destroy() -> None:
        cloudinary.uploader.destroy(public_id, resource_type="image")

    await anyio.to_thread.run_sync(_destroy)
