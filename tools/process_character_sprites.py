from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "characters" / "source"
OUTPUT = ROOT / "assets" / "characters"
FRAME_SIZE = 96
FRAME_COUNT = 4
GROUND_Y = 94


def build(name: str) -> None:
    image = Image.open(SOURCE / f"{name}-source.png").convert("RGBA")
    if image.width % FRAME_COUNT:
        raise ValueError(f"{name}: source width must be divisible by {FRAME_COUNT}")

    cell_width = image.width // FRAME_COUNT
    frames = []
    boxes = []
    for index in range(FRAME_COUNT):
        frame = image.crop((index * cell_width, 0, (index + 1) * cell_width, image.height))
        alpha = frame.getchannel("A").point(lambda value: 255 if value > 8 else 0)
        box = alpha.getbbox()
        if box is None:
            raise ValueError(f"{name}: frame {index} is empty")
        frames.append(frame.crop(box))
        boxes.append(box)

    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    scale = min(90 / max_width, 90 / max_height)
    sheet = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), (0, 0, 0, 0))

    for index, frame in enumerate(frames):
        size = (max(1, round(frame.width * scale)), max(1, round(frame.height * scale)))
        sprite = frame.resize(size, Image.Resampling.NEAREST)
        x = index * FRAME_SIZE + (FRAME_SIZE - sprite.width) // 2
        y = GROUND_Y - sprite.height
        sheet.alpha_composite(sprite, (x, y))

    sheet.save(OUTPUT / f"{name}.png", optimize=True)
    print(f"{name}: source boxes={boxes} -> {sheet.size}")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for character in ("aurex", "chronox", "verdara"):
        build(character)
