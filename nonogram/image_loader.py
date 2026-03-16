"""Load PNG images and return pixel grids for nonogram processing."""

from pathlib import Path

from PIL import Image

# Minimum channel value to be considered white (empty cell).
_WHITE_THRESHOLD = 240


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


def load_color_image(path: str | Path) -> list[list[str | None]]:
    """Load a color PNG and return a 2D grid of hex color strings or None.

    None represents white/empty cells (all channels >= _WHITE_THRESHOLD).
    Colored cells are represented as lowercase hex strings like '#ff0000'.
    """
    img = Image.open(Path(path)).convert("RGB")
    width, height = img.size
    pixels = list(img.get_flattened_data())  # list of (r, g, b) tuples

    grid: list[list[str | None]] = []
    for row_idx in range(height):
        row: list[str | None] = []
        for col_idx in range(width):
            r, g, b = pixels[row_idx * width + col_idx]
            if r >= _WHITE_THRESHOLD and g >= _WHITE_THRESHOLD and b >= _WHITE_THRESHOLD:
                row.append(None)
            else:
                row.append(f"#{r:02x}{g:02x}{b:02x}")
        grid.append(row)

    return grid


def extract_colors(grid: list[list[str | None]]) -> list[str]:
    """Return unique non-None colors from the grid in first-appearance order."""
    seen: dict[str, None] = {}
    for row in grid:
        for cell in row:
            if cell is not None:
                seen[cell] = None
    return list(seen.keys())


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
