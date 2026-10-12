"""Generate exact-text 3D4ME icon assets from deterministic vector-like drawing.

Requires Pillow (PIL) and a sans bold font; the system DejaVu font is used when
available. The current assets are generated at build time, not at app runtime.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images"
FONT_CANDIDATES = (
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"),
)
INK = (17, 13, 31)
LAVENDER = (171, 151, 255)
MINT = (100, 228, 193)
WHITE = (250, 249, 255)


def font_at(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def background(size: int, glow: bool = True) -> Image.Image:
    image = Image.new("RGB", (size, size), INK)
    px = image.load()
    top = (26, 19, 47)
    bottom = (12, 11, 23)
    for y in range(size):
        t = y / max(1, size - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(size):
            px[x, y] = color
    if glow:
        light = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(light)
        draw.ellipse((size * .13, size * .18, size * .87, size * .88), fill=(124, 99, 230, 44))
        light = light.filter(ImageFilter.GaussianBlur(size * .12))
        image = Image.alpha_composite(image.convert("RGBA"), light).convert("RGB")
    return image


def draw_logo(image: Image.Image, *, monochrome: bool = False) -> None:
    """Draw the cube mark and exact 3D4ME wordmark inside the Android safe area."""
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = image.size
    unit = min(w, h) / 1024
    cube_w = 148 * unit
    gap = 24 * unit
    font = font_at(max(12, round(126 * unit)))
    text = "3D4ME"
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=0)
    text_w = draw.textlength(text, font=font)
    text_h = bbox[3] - bbox[1]
    # Keep the whole mark within the central adaptive-icon safe zone.
    max_width = w * .67
    if cube_w + gap + text_w > max_width:
        font = font_at(max(12, round(126 * unit * max_width / (cube_w + gap + text_w))))
        bbox = draw.textbbox((0, 0), text, font=font, stroke_width=0)
        text_w = draw.textlength(text, font=font)
        text_h = bbox[3] - bbox[1]
    total_w = cube_w + gap + text_w
    left = (w - total_w) / 2
    cy = h / 2
    cx = left + cube_w / 2
    sx = cube_w * .46
    sy = cube_w * .25
    depth = cube_w * .52
    top = (cx, cy - depth)
    right = (cx + sx, cy - sy)
    center = (cx, cy + sy)
    left_top = (cx - sx, cy - sy)
    left_bottom = (cx - sx, cy + depth * .48)
    middle_bottom = (cx, cy + depth)
    right_bottom = (cx + sx, cy + depth * .48)
    if monochrome:
        face_top = face_left = face_right = WHITE + (255,)
        edge = (255, 255, 255, 255)
        word_3d = word_4me = WHITE + (255,)
    else:
        face_top = LAVENDER + (255,)
        face_left = MINT + (255,)
        face_right = (117, 103, 218, 255)
        edge = (239, 232, 255, 255)
        word_3d = WHITE + (255,)
        word_4me = MINT + (255,)
    line = max(1, round(4 * unit))
    draw.polygon((top, right, center, left_top), fill=face_top)
    draw.polygon((left_top, center, middle_bottom, left_bottom), fill=face_left)
    draw.polygon((center, right, right_bottom, middle_bottom), fill=face_right)
    draw.line((top, right, center, left_top, top), fill=edge, width=line, joint="curve")
    draw.line((left_top, left_bottom, middle_bottom, right_bottom, right), fill=edge, width=line, joint="curve")
    draw.line((center, middle_bottom), fill=edge, width=line)

    text_x = left + cube_w + gap
    text_y = cy - text_h / 2 - bbox[1]
    first = "3D"
    first_width = draw.textlength(first, font=font)
    draw.text((text_x, text_y), first, font=font, fill=word_3d)
    draw.text((text_x + first_width, text_y), "4ME", font=font, fill=word_4me)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    app_icon = background(1024)
    draw_logo(app_icon)
    app_icon.save(OUT / "icon.png", optimize=True)

    adaptive = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_logo(adaptive)
    adaptive.save(OUT / "android-icon-foreground.png", optimize=True)

    bg = background(1024, glow=False)
    bg.save(OUT / "android-icon-background.png", optimize=True)

    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_logo(mono, monochrome=True)
    mono.save(OUT / "android-icon-monochrome.png", optimize=True)

    splash = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw_logo(splash)
    splash.save(OUT / "splash-icon.png", optimize=True)

    favicon = background(192)
    draw_logo(favicon)
    favicon.resize((96, 96), Image.Resampling.LANCZOS).save(OUT / "favicon.png", optimize=True)

    print("Generated 3D4ME app, adaptive, monochrome, splash and favicon assets.")
    for name in ("icon.png", "android-icon-foreground.png", "android-icon-background.png", "android-icon-monochrome.png", "splash-icon.png", "favicon.png"):
        asset = OUT / name
        with Image.open(asset) as image:
            print(f"{asset.relative_to(ROOT)}: {image.width}x{image.height}, {image.mode}")


if __name__ == "__main__":
    main()
