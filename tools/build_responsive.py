"""Generate responsive image variants for the site. Run from the repo root:

    python tools/build_responsive.py

Reads the original JPGs in assets/img/ and writes downscaled variants next to
them (never upscales): `{stem}-{width}.jpg` (fallback) and `{stem}-{width}.webp`
(preferred via <picture>). Widths are 480 / 768 / 1200 px plus the original
width. Quality 72 for both formats. Requires Pillow (pip install Pillow).
Re-run after swapping any photo, then check index.html srcsets still match.
"""
import os
from PIL import Image

IMG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                       "assets", "img")
JPG_Q, WEBP_Q = 72, 72

# Content photos only: badges/logo stay as-is (tiny, on white plates).
SOURCES = [
    "hero-desert-home.jpg",
    "service-1.jpg", "service-2.jpg", "service-3.jpg",
    "listing-roseworthy-1.jpg",
    "listing-beacon-ridge-1.jpg", "listing-beacon-ridge-2.jpg",
    "listing-beacon-ridge-3.jpg",
    "listing-ailanto-1.jpg", "listing-ailanto-2.jpg", "listing-ailanto-3.jpg",
    "pahrump-pond.jpg",
    "tile-interior.jpg", "tile-exterior.jpg", "tile-handshake.jpg",
    "marci-portrait.jpg",
]

def widths_for(orig_w):
    ws = [480, 768]
    if orig_w > 1000:
        ws.append(1200)
    ws.append(orig_w)
    return sorted({w for w in ws if w <= orig_w})

if __name__ == "__main__":
    for name in SOURCES:
        src = os.path.join(IMG_DIR, name)
        stem, _ = os.path.splitext(name)
        im = Image.open(src).convert("RGB")
        ow, oh = im.size
        for w in widths_for(ow):
            h = round(oh * w / ow)
            frame = im if w == ow else im.resize((w, h), Image.LANCZOS)
            if w < ow:  # resized JPG fallback variant
                frame.save(os.path.join(IMG_DIR, f"{stem}-{w}.jpg"),
                           "JPEG", quality=JPG_Q, optimize=True,
                           progressive=True)
            frame.save(os.path.join(IMG_DIR, f"{stem}-{w}.webp"),
                       "WebP", quality=WEBP_Q, method=6)
        print(f"{name} {ow}x{oh} -> {widths_for(ow)}")
