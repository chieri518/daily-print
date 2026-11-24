"""Make the still images the shorts use: Nora cutouts, sample front pages, paper grain.

Run from tutorial/video:  python scripts/prepare_images.py <path-to-ffmpeg>
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
import pymupdf
from PIL import Image, ImageDraw, ImageFilter

FFMPEG = sys.argv[1] if len(sys.argv) > 1 else "ffmpeg"
ASSETS = Path(__file__).resolve().parents[2] / "assets"
REPO = ASSETS.parents[1]
OUT = ASSETS / "images"
OUT.mkdir(exist_ok=True)

# name: (clip, second, crop box in the 720x1280 frame)
CUTOUTS = {
    "nora-smile": ("4.8", 7.6, (300, 280, 720, 1000)),
    "nora-tired": ("1.1", 7.5, (130, 90, 660, 800)),
}
PAGES = ["1-the-morning-edition", "4-the-daily-vibe-check-gen-z"]
SCREENS = ["customize.png", "paper.png"]


def frame(clip, second):
    tmp = OUT / "_frame.png"
    subprocess.run([FFMPEG, "-loglevel", "error", "-y", "-ss", str(second),
                    "-i", str(ASSETS / "veo_creations" / f"{clip}.mp4"),
                    "-frames:v", "1", str(tmp)], check=True)
    im = Image.open(tmp).convert("RGB")
    tmp.unlink()
    return im


def sticker(im, border=16, radius=18):
    """A photo cut out with a white paper border and rounded corners."""
    w, h = im.size
    card = Image.new("RGBA", (w + 2 * border, h + 2 * border), (0, 0, 0, 0))
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *card.size), radius, fill=255)
    card.paste((255, 253, 248, 255), mask=mask)
    card.paste(im, (border, border))
    return card


for name, (clip, second, box) in CUTOUTS.items():
    sticker(frame(clip, second).crop(box)).save(OUT / f"{name}.png")

for name in PAGES:
    page = pymupdf.open(REPO / "public" / "samples" / f"{name}.pdf")[0]
    page.get_pixmap(dpi=150).save(OUT / f"page-{name}.png")

for name in SCREENS:
    Image.open(REPO / "docs" / "images" / name).save(OUT / f"screen-{name}")

# Paper grain: soft noise, multiplied over the backgrounds at low opacity.
rng = np.random.default_rng(7)
noise = rng.normal(128, 40, (960, 540)).clip(0, 255).astype("uint8")
Image.fromarray(noise, "L").filter(ImageFilter.GaussianBlur(0.6)).resize((1080, 1920)).save(OUT / "grain.png")
print("done:", sorted(p.name for p in OUT.iterdir()))
