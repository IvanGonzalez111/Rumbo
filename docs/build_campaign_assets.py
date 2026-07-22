from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
PUBLIC_ASSETS = ROOT / "public" / "assets"

NAVY = "#0D1932"
INK = "#17223B"
ORANGE = "#E86F35"
ORANGE_LIGHT = "#F6A06F"
GREEN = "#2F8F68"
SKY = "#4A83B8"
ROSE = "#B85F68"
CREAM = "#F7EFD8"
PAPER = "#FFFAF0"
MUTED = "#657087"
LINE = "#DED0A9"

ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"
ARIAL_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(ARIAL_BOLD if bold else ARIAL, size=size)


def cover_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    return copy


def add_overlay(image: Image.Image, fill: tuple[int, int, int, int]) -> Image.Image:
    overlay = Image.new("RGBA", image.size, fill)
    return Image.alpha_composite(image.convert("RGBA"), overlay)


def dotted_background(size: tuple[int, int], base: str = NAVY) -> Image.Image:
    image = Image.new("RGB", size, base)
    draw = ImageDraw.Draw(image)
    for y in range(12, size[1], 22):
        for x in range(12, size[0], 22):
            draw.ellipse((x - 1.4, y - 1.4, x + 1.4, y + 1.4), fill="#303A50")
    return image


def paste_with_shadow(
    canvas: Image.Image,
    item: Image.Image,
    position: tuple[int, int],
    radius: int = 28,
    opacity: int = 95,
    offset: tuple[int, int] = (0, 18),
) -> None:
    item = item.convert("RGBA")
    alpha = item.getchannel("A")
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_alpha = Image.new("L", item.size, 0)
    shadow_alpha.paste(alpha)
    shadow_alpha = shadow_alpha.filter(ImageFilter.GaussianBlur(radius))
    shadow_color = Image.new("RGBA", item.size, (8, 18, 38, opacity))
    shadow_color.putalpha(shadow_alpha.point(lambda value: value * opacity // 255))
    shadow.alpha_composite(shadow_color, (position[0] + offset[0], position[1] + offset[1]))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(item, position)


def rounded_image(image: Image.Image, radius: int) -> Image.Image:
    image = image.convert("RGBA")
    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width, image.height), radius=radius, fill=255)
    image.putalpha(mask)
    return image


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        width = draw.textbbox((0, 0), candidate, font=text_font)[2]
        if width <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    text: str,
    text_font: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    spacing: int = 10,
) -> int:
    lines = wrap_lines(draw, text, text_font, max_width)
    x, y = position
    line_height = text_font.size + spacing
    for index, line in enumerate(lines):
        draw.text((x, y + index * line_height), line, font=text_font, fill=fill)
    return y + len(lines) * line_height


def brand_pill(draw: ImageDraw.ImageDraw, x: int, y: int, width: int = 210) -> None:
    draw.rounded_rectangle((x, y, x + width, y + 58), radius=8, fill=ORANGE)
    draw.text((x + 28, y + 13), "RUMBO", font=font(27, True), fill=PAPER)


def slide_counter(draw: ImageDraw.ImageDraw, active: int, total: int = 4) -> None:
    start_x = 442
    y = 1288
    for index in range(total):
        width = 54 if index + 1 == active else 16
        fill = ORANGE if index + 1 == active else "#9AA2B1"
        draw.rounded_rectangle((start_x, y, start_x + width, y + 10), radius=5, fill=fill)
        start_x += width + 12


def product_frame(source: Path, size: tuple[int, int], background: str = PAPER) -> Image.Image:
    screenshot = Image.open(source).convert("RGB")
    screenshot = cover_crop(screenshot, size)
    frame = Image.new("RGBA", (size[0] + 28, size[1] + 28), background)
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle((0, 0, frame.width - 1, frame.height - 1), radius=10, fill=background, outline=LINE, width=2)
    frame.alpha_composite(rounded_image(screenshot, 6), (14, 14))
    return frame


def generate_carousel(backdrop: Image.Image) -> list[Path]:
    outputs: list[Path] = []

    # Slide 1: cover
    slide = add_overlay(cover_crop(backdrop, (1080, 1350)), (8, 20, 43, 70))
    draw = ImageDraw.Draw(slide)
    brand_pill(draw, 68, 68)
    draw.text((68, 225), "ASÍ FUNCIONA", font=font(83, True), fill=PAPER)
    draw.text((68, 320), "RUMBO", font=font(128, True), fill=ORANGE_LIGHT)
    draw_wrapped(draw, (72, 485), "Cuatro pasos para convertir un viaje en una historia.", font(42, True), PAPER, 780, 8)
    draw.rounded_rectangle((68, 1110, 770, 1210), radius=8, fill=PAPER)
    draw.text((105, 1138), "DESLIZÁ PARA EMPEZAR", font=font(32, True), fill=INK)
    slide_counter(draw, 1)
    out = ASSETS / "10-carrusel-01.png"
    slide.convert("RGB").save(out, quality=95)
    outputs.append(out)

    # Slide 2: setup
    slide = Image.new("RGBA", (1080, 1350), PAPER)
    draw = ImageDraw.Draw(slide)
    brand_pill(draw, 68, 60)
    draw.rounded_rectangle((68, 160, 152, 244), radius=42, fill=ORANGE)
    draw.text((98, 174), "1", font=font(49, True), fill=PAPER)
    draw_wrapped(draw, (180, 163), "CONTANOS CÓMO QUERÉS VIAJAR", font(53, True), INK, 815, 6)
    draw_wrapped(draw, (70, 315), "Elegí el destino, la compañía, los estilos y la energía de la aventura.", font(34), MUTED, 930, 8)
    frame = product_frame(ASSETS / "06-crear-viaje.png", (870, 640))
    paste_with_shadow(slide, frame, (91, 500), radius=22, opacity=85)
    draw.text((70, 1195), "VOS PONÉS EL CONTEXTO.", font=font(30, True), fill=ORANGE)
    draw.text((70, 1238), "Rumbo prepara el punto de partida.", font=font(29), fill=INK)
    slide_counter(draw, 2)
    out = ASSETS / "10-carrusel-02.png"
    slide.convert("RGB").save(out, quality=95)
    outputs.append(out)

    # Slide 3: missions
    slide = dotted_background((1080, 1350)).convert("RGBA")
    draw = ImageDraw.Draw(slide)
    brand_pill(draw, 68, 60)
    draw.rounded_rectangle((68, 160, 152, 244), radius=42, fill=ORANGE)
    draw.text((98, 174), "2", font=font(49, True), fill=PAPER)
    draw_wrapped(draw, (180, 163), "RECIBÍ MISIONES CREADAS PARA VOS", font(53, True), PAPER, 810, 6)
    draw_wrapped(draw, (70, 315), "La IA combina tus elecciones para proponer desafíos breves, seguros y distintos.", font(34), "#D9DFEA", 930, 8)
    frame = product_frame(ASSETS / "02-misiones.png", (870, 650))
    paste_with_shadow(slide, frame, (91, 500), radius=24, opacity=125)
    draw.rounded_rectangle((70, 1190, 390, 1247), radius=8, fill=GREEN)
    draw.text((92, 1203), "GENERADAS CON IA", font=font(26, True), fill=PAPER)
    slide_counter(draw, 3)
    out = ASSETS / "10-carrusel-03.png"
    slide.convert("RGB").save(out, quality=95)
    outputs.append(out)

    # Slide 4: result
    slide = Image.new("RGBA", (1080, 1350), CREAM)
    draw = ImageDraw.Draw(slide)
    brand_pill(draw, 68, 60)
    draw.text((68, 170), "3", font=font(50, True), fill=ORANGE)
    draw.text((115, 170), "GUARDÁ EL MOMENTO", font=font(48, True), fill=INK)
    draw.text((68, 245), "4", font=font(50, True), fill=GREEN)
    draw.text((115, 245), "DESBLOQUEÁ TU HISTORIA", font=font(48, True), fill=INK)
    draw_wrapped(draw, (70, 340), "Subí una evidencia, elegí cómo se sintió y mirá cómo crecen el pasaporte y la bitácora.", font(33), MUTED, 930, 8)
    evidence = product_frame(ASSETS / "03-completar-mision.png", (600, 420))
    passport = product_frame(ASSETS / "04-pasaporte.png", (390, 420))
    paste_with_shadow(slide, evidence, (54, 520), radius=20, opacity=80)
    paste_with_shadow(slide, passport, (635, 690), radius=20, opacity=80)
    draw.rounded_rectangle((70, 1120, 1010, 1220), radius=8, fill=ORANGE)
    draw.text((219, 1148), "EMPEZÁ TU PROPIA AVENTURA", font=font(34, True), fill=PAPER)
    slide_counter(draw, 4)
    out = ASSETS / "10-carrusel-04.png"
    slide.convert("RGB").save(out, quality=95)
    outputs.append(out)

    # Contact sheet for the written documentation.
    sheet = dotted_background((2000, 1120)).convert("RGBA")
    draw = ImageDraw.Draw(sheet)
    draw.text((75, 55), "CARRUSEL · ASÍ FUNCIONA RUMBO", font=font(48, True), fill=PAPER)
    draw.text((75, 118), "Cuatro placas que explican el recorrido desde el contexto hasta la bitácora.", font=font(27), fill="#C9D0DD")
    x = 75
    for output in outputs:
        card = Image.open(output).convert("RGBA").resize((420, 525), Image.Resampling.LANCZOS)
        paste_with_shadow(sheet, rounded_image(card, 8), (x, 245), radius=18, opacity=110, offset=(0, 14))
        x += 475
    draw.rounded_rectangle((75, 870, 1925, 1030), radius=8, fill=PAPER)
    draw.text((118, 913), "DESTINO  →  MISIONES CON IA  →  EVIDENCIA  →  SELLO Y BITÁCORA", font=font(37, True), fill=INK)
    sheet.convert("RGB").save(ASSETS / "10-carrusel-flujo.png", quality=95)
    return outputs


def draw_stamp(draw: ImageDraw.ImageDraw, center: tuple[int, int], radius: int, color: str, title: str, subtitle: str) -> None:
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline=color, width=8)
    draw.ellipse((x - radius + 18, y - radius + 18, x + radius - 18, y + radius - 18), outline=color, width=3)
    draw.line((x - radius + 38, y - 13, x + radius - 38, y - 13), fill=color, width=3)
    draw.line((x - radius + 38, y + 40, x + radius - 38, y + 40), fill=color, width=3)
    title_size = 30
    title_font = font(title_size, True)
    title_box = draw.textbbox((0, 0), title, font=title_font)
    while title_box[2] - title_box[0] > radius * 1.55 and title_size > 18:
        title_size -= 1
        title_font = font(title_size, True)
        title_box = draw.textbbox((0, 0), title, font=title_font)
    draw.text((x - (title_box[2] - title_box[0]) / 2, y - 58), title, font=title_font, fill=color)
    sub_box = draw.textbbox((0, 0), subtitle, font=font(21, True))
    draw.text((x - (sub_box[2] - sub_box[0]) / 2, y + 55), subtitle, font=font(21, True), fill=color)


def generate_stamp_piece() -> Path:
    piece = Image.new("RGBA", (1080, 1350), PAPER)
    draw = ImageDraw.Draw(piece)
    draw.rectangle((0, 0, 1080, 310), fill=NAVY)
    brand_pill(draw, 68, 58)
    draw.text((68, 165), "CADA MISIÓN", font=font(64, True), fill=PAPER)
    draw.text((68, 235), "DEJA UNA MARCA.", font=font(64, True), fill=ORANGE_LIGHT)
    draw_wrapped(draw, (70, 360), "Completá desafíos, desbloqueá sellos y construí un pasaporte que solo puede ser tuyo.", font(34), MUTED, 930, 9)
    draw_stamp(draw, (285, 690), 165, SKY, "POSTAL VIVA", "FOTOGRÁFICA")
    draw_stamp(draw, (795, 690), 165, GREEN, "PLAN IMPROVISADO", "EXPLORACIÓN")
    draw_stamp(draw, (285, 1050), 165, ORANGE, "BOCADO VALIENTE", "GASTRONÓMICA")
    draw_stamp(draw, (795, 1050), 165, ROSE, "MEMORIA GUARDADA", "EMOCIONAL")
    out = ASSETS / "11-pieza-sellos.png"
    piece.convert("RGB").save(out, quality=95)
    return out


def generate_poster(backdrop: Image.Image) -> Path:
    poster = add_overlay(cover_crop(backdrop, (1200, 1600)), (7, 17, 38, 72))
    draw = ImageDraw.Draw(poster)
    brand_pill(draw, 78, 76, 230)
    draw.text((78, 240), "TU PRÓXIMA", font=font(86, True), fill=PAPER)
    draw.text((78, 334), "HISTORIA", font=font(128, True), fill=PAPER)
    draw.text((78, 495), "EMPIEZA ACÁ.", font=font(86, True), fill=ORANGE_LIGHT)
    draw.rounded_rectangle((62, 620, 1138, 802), radius=8, fill=(7, 17, 38, 205))
    draw_wrapped(draw, (82, 655), "Misiones creadas con IA, sellos para coleccionar y una bitácora para volver a vivirlo.", font(38, True), PAPER, 980, 10)
    draw.rounded_rectangle((78, 1360, 1120, 1490), radius=8, fill=ORANGE)
    draw.text((225, 1396), "EMPEZÁ TU AVENTURA", font=font(48, True), fill=PAPER)
    out = ASSETS / "12-poster-experiencia.png"
    poster.convert("RGB").save(out, quality=95)
    return out


def phone_mockup(content: Image.Image, size: tuple[int, int], fit: str = "cover") -> Image.Image:
    width, height = size
    phone = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(phone)
    draw.rounded_rectangle((0, 0, width - 1, height - 1), radius=58, fill="#080D19", outline="#414B62", width=4)
    screen_box = (18, 18, width - 18, height - 18)
    screen_size = (screen_box[2] - screen_box[0], screen_box[3] - screen_box[1])
    if fit == "contain":
        screen = Image.new("RGBA", screen_size, PAPER)
        screen_draw = ImageDraw.Draw(screen)
        screen_draw.rectangle((0, 0, screen.width, 78), fill=NAVY)
        screen_draw.ellipse((22, 25, 52, 55), fill=ORANGE)
        screen_draw.text((66, 24), "rumbo", font=font(18, True), fill=PAPER)
        fitted = contain(content.convert("RGB"), (screen.width, screen.height - 190))
        content_y = 96
        screen.alpha_composite(fitted.convert("RGBA"), ((screen.width - fitted.width) // 2, content_y))
        detail_y = content_y + fitted.height + 18
        screen_draw.ellipse((24, detail_y, 46, detail_y + 22), outline=INK, width=2)
        screen_draw.rectangle((62, detail_y + 2, 82, detail_y + 20), outline=INK, width=2)
        screen_draw.polygon([(98, detail_y + 20), (108, detail_y), (118, detail_y + 20)], outline=INK)
        screen_draw.text((24, detail_y + 40), "rumbo  Cuatro pasos para convertir tu viaje", font=font(15, True), fill=INK)
        screen_draw.text((24, detail_y + 62), "en una historia propia.", font=font(15), fill=MUTED)
        screen_draw.text((24, detail_y + 89), "Ver las 4 placas", font=font(14, True), fill=SKY)
        screen_draw.line((25, screen.height - 72, screen.width - 25, screen.height - 72), fill=LINE, width=2)
        screen_draw.text((25, screen.height - 54), "rumbo.app", font=font(17, True), fill=INK)
    else:
        screen = cover_crop(content.convert("RGB"), screen_size).convert("RGBA")
    phone.alpha_composite(rounded_image(screen, 44), (screen_box[0], screen_box[1]))
    draw.rounded_rectangle((width // 2 - 58, 17, width // 2 + 58, 34), radius=8, fill="#080D19")
    return phone


def tablet_mockup(content: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    tablet = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(tablet)
    draw.rounded_rectangle((0, 0, width - 1, height - 1), radius=40, fill="#0A1020", outline="#465168", width=4)
    screen = cover_crop(content.convert("RGB"), (width - 34, height - 34))
    tablet.alpha_composite(rounded_image(screen, 28), (17, 17))
    return tablet


def generate_social_mockup() -> Path:
    canvas = dotted_background((1920, 1200)).convert("RGBA")
    draw = ImageDraw.Draw(canvas)
    draw.text((80, 58), "CAMPAÑA DE LANZAMIENTO", font=font(52, True), fill=PAPER)
    draw.text((80, 122), "Una misma identidad adaptada a feed, stories y carrusel.", font=font(29), fill="#C7CEDB")

    feed = Image.open(ASSETS / "08-pieza-feed.png")
    story = Image.open(ASSETS / "09-pieza-story.png")
    carousel = Image.open(ASSETS / "10-carrusel-01.png")

    tablet = tablet_mockup(feed, (700, 700))
    phone_story = phone_mockup(story, (390, 790))
    phone_carousel = phone_mockup(carousel, (390, 790), fit="contain")

    paste_with_shadow(canvas, tablet, (80, 270), radius=38, opacity=145, offset=(0, 30))
    paste_with_shadow(canvas, phone_story, (890, 240), radius=38, opacity=145, offset=(0, 30))
    paste_with_shadow(canvas, phone_carousel, (1410, 240), radius=38, opacity=145, offset=(0, 30))

    draw.text((292, 1010), "FEED", font=font(28, True), fill=ORANGE_LIGHT)
    draw.text((1030, 1060), "STORY", font=font(28, True), fill=ORANGE_LIGHT)
    draw.text((1508, 1060), "CARRUSEL", font=font(28, True), fill=ORANGE_LIGHT)
    out = ASSETS / "13-mockup-redes.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


def generate_outdoor_mockup(poster_path: Path) -> Path:
    canvas = Image.new("RGBA", (1920, 1200), "#DDE3E7")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, 1920, 835), fill="#E9EEF1")
    draw.rectangle((0, 835, 1920, 1200), fill="#A9B0B8")
    for x in range(0, 1920, 160):
        draw.line((x, 835, x + 240, 1200), fill="#8E969F", width=2)
    draw.line((0, 835, 1920, 835), fill="#7B838D", width=5)

    # Terminal signage and architecture.
    draw.rectangle((0, 0, 1920, 110), fill=NAVY)
    draw.text((70, 30), "SALIDAS", font=font(35, True), fill=PAPER)
    draw.text((275, 30), "DESTINOS", font=font(35, True), fill="#AAB5C6")
    draw.text((1670, 31), "RUMBO", font=font(34, True), fill=ORANGE_LIGHT)
    for x in (80, 540, 1000, 1460):
        draw.rectangle((x, 150, x + 340, 735), fill="#D5DCE1", outline="#B4BEC6", width=3)
        draw.rectangle((x + 22, 175, x + 318, 710), fill="#C8D8E0")

    # Backlit advertising panel.
    panel = Image.new("RGBA", (650, 920), (0, 0, 0, 0))
    panel_draw = ImageDraw.Draw(panel)
    panel_draw.rounded_rectangle((0, 0, 649, 919), radius=14, fill="#252D39")
    panel_draw.rounded_rectangle((18, 18, 631, 901), radius=8, fill="#F7F4EC")
    poster = Image.open(poster_path).convert("RGB").resize((575, 767), Image.Resampling.LANCZOS)
    panel.alpha_composite(rounded_image(poster, 4), (38, 52))
    panel_draw.text((174, 850), "rumbo.app", font=font(32, True), fill=PAPER)
    paste_with_shadow(canvas, panel, (630, 175), radius=44, opacity=120, offset=(0, 30))

    # Benches ground the mockup without competing with the campaign.
    draw.rounded_rectangle((145, 900, 530, 960), radius=8, fill="#545E69")
    draw.rectangle((185, 955, 215, 1090), fill="#545E69")
    draw.rectangle((460, 955, 490, 1090), fill="#545E69")
    draw.rounded_rectangle((1390, 900, 1775, 960), radius=8, fill="#545E69")
    draw.rectangle((1430, 955, 1460, 1090), fill="#545E69")
    draw.rectangle((1705, 955, 1735, 1090), fill="#545E69")

    out = ASSETS / "14-mockup-via-publica.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


def generate_campaign_board() -> Path:
    canvas = Image.new("RGBA", (1920, 1200), PAPER)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, 1920, 210), fill=NAVY)
    brand_pill(draw, 75, 70)
    draw.text((350, 70), "CADA VIAJE DEJA UNA HISTORIA", font=font(54, True), fill=PAPER)
    draw.text((352, 136), "Sistema visual y piezas de lanzamiento", font=font(27), fill="#C9D0DC")

    feed = Image.open(ASSETS / "08-pieza-feed.png").resize((430, 430), Image.Resampling.LANCZOS)
    story = Image.open(ASSETS / "09-pieza-story.png").resize((242, 430), Image.Resampling.LANCZOS)
    stamps = Image.open(ASSETS / "11-pieza-sellos.png").resize((344, 430), Image.Resampling.LANCZOS)
    poster = Image.open(ASSETS / "12-poster-experiencia.png").resize((322, 430), Image.Resampling.LANCZOS)
    carousel = Image.open(ASSETS / "10-carrusel-01.png").resize((344, 430), Image.Resampling.LANCZOS)
    pieces = [(feed, 72), (story, 545), (carousel, 830), (stamps, 1217), (poster, 1603)]
    for piece, x in pieces:
        paste_with_shadow(canvas, rounded_image(piece, 6), (x, 280), radius=18, opacity=85, offset=(0, 16))

    draw.text((75, 790), "PALETA", font=font(26, True), fill=INK)
    swatches = [(NAVY, "AZUL NOCHE"), (ORANGE, "ACCIÓN"), (CREAM, "PAPEL"), (GREEN, "EXPLORACIÓN"), (SKY, "RECUERDO")]
    x = 75
    for color, label in swatches:
        draw.rounded_rectangle((x, 850, x + 240, 930), radius=8, fill=color, outline=LINE, width=2)
        draw.text((x, 952), label, font=font(19, True), fill=INK)
        x += 285

    draw.rounded_rectangle((75, 1040, 1845, 1130), radius=8, fill=NAVY)
    draw.text((120, 1064), "NO HAGAS SOLO FOTOS. DESBLOQUEÁ RECUERDOS.", font=font(39, True), fill=PAPER)
    out = ASSETS / "15-tablero-campana.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


def generate_campaign_assets() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    backdrop = Image.open(PUBLIC_ASSETS / "rumbo-globe-backdrop.png").convert("RGB")
    generate_carousel(backdrop)
    generate_stamp_piece()
    poster = generate_poster(backdrop)
    generate_social_mockup()
    generate_outdoor_mockup(poster)
    generate_campaign_board()


if __name__ == "__main__":
    generate_campaign_assets()
    print("Piezas y mockups de campaña generados en docs/assets")
