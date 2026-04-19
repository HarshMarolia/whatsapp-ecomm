from __future__ import annotations

import io
from typing import Literal

import qrcode
from PIL import Image

Corner = Literal["top-left", "top-right", "bottom-left", "bottom-right"]


def embed_qr(
    image_bytes: bytes,
    payload: str,
    corner: Corner,
    size_fraction: float,
    padding: int,
) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    qr_size = int(size_fraction * min(img.width, img.height))

    qr_img = qrcode.make(payload).convert("RGBA").resize((qr_size, qr_size), Image.LANCZOS)

    positions: dict[str, tuple[int, int]] = {
        "top-left": (padding, padding),
        "top-right": (img.width - qr_size - padding, padding),
        "bottom-left": (padding, img.height - qr_size - padding),
        "bottom-right": (img.width - qr_size - padding, img.height - qr_size - padding),
    }
    pos = positions[corner]

    img.paste(qr_img, pos, mask=qr_img)

    output = io.BytesIO()
    img.convert("RGB").save(output, format="JPEG", quality=95)
    return output.getvalue()
