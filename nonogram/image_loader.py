"""Load PNG images and return pixel grids for nonogram processing."""

from pathlib import Path

from PIL import Image


def load_image(path: str | Path) -> list[list[bool]]:
    """Load a BW PNG and return a 2D grid where True = filled (dark pixel).

    Dispatches to the appropriate loader based on image mode.
    """
    return _load_with_pillow(Path(path))


def _load_with_pillow(path: Path) -> list[list[bool]]:
    """Load any PIL-supported image and threshold to a boolean grid."""
    img = Image.open(path).convert("L")  # grayscale
    width, height = img.size
    pixels = list(img.get_flattened_data())

    grid: list[list[bool]] = []
    for row_idx in range(height):
        row: list[bool] = []
        for col_idx in range(width):
            pixel_value = pixels[row_idx * width + col_idx]
            row.append(pixel_value < 128)  # dark pixels are filled
        grid.append(row)

    return grid


def list_puzzles(folder: str | Path) -> list[str]:
    """Return puzzle names (without extension) found in folder and subfolders.

    Scans recursively for PNG files. Names are relative paths with forward
    slashes, e.g. 'bw/arrow_w5_h5'.
    """
    folder_path = Path(folder)
    puzzles: list[str] = []

    for png_file in sorted(folder_path.rglob("*.png")):
        relative = png_file.relative_to(folder_path)
        name = str(relative.with_suffix("")).replace("\\", "/")
        puzzles.append(name)

    return puzzles
