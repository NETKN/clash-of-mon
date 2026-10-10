from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "arenas" / "source"
OUTPUT = ROOT / "assets" / "arenas"
SPECS = {
    "skyforge-deck": (640, 192),
    "skyforge-lift": (256, 256),
    "titanback-deck": (640, 224),
    "titanback-lift": (256, 256),
}


def build(name: str, size: tuple[int, int]) -> None:
    image = Image.open(SOURCE / f"{name}-source.png").convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 255 if value > 8 else 0)
    box = alpha.getbbox()
    if box is None:
        raise ValueError(f"{name}: source is empty")
    image = image.crop(box)
    scale = min((size[0] - 4) / image.width, (size[1] - 4) / image.height)
    resized = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.alpha_composite(
        resized,
        ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2),
    )
    canvas.save(OUTPUT / f"{name}.png", optimize=True)
    print(f"{name}: source={box} -> {canvas.size}")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for asset, output_size in SPECS.items():
        build(asset, output_size)
