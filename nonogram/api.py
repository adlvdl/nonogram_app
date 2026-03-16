"""Flask Blueprint exposing the nonogram API endpoints."""

from pathlib import Path

from flask import Blueprint, current_app, jsonify

from nonogram.hint_engine import (
    compute_col_hints,
    compute_color_col_hints,
    compute_color_row_hints,
    compute_row_hints,
)
from nonogram.image_loader import extract_colors, list_puzzles, load_color_image, load_image

bp = Blueprint("api", __name__, url_prefix="/api")


def _puzzles_folder() -> Path:
    return Path(current_app.config["PUZZLES_FOLDER"])


@bp.route("/puzzles")
def get_puzzle_list():
    """Return the list of available puzzle names."""
    folder = _puzzles_folder()
    puzzles = list_puzzles(folder)
    return jsonify({"puzzles": puzzles})


@bp.route("/nonogram/<path:name>")
def get_nonogram(name: str):
    """Return hints, dimensions, and solution grid for a named puzzle.

    For BW puzzles (is_color: false):
      row_hints  list[list[int]]
      col_hints  list[list[int]]
      solution   list[list[bool]]

    For color puzzles (is_color: true):
      colors     list[str]           unique hex colors in first-appearance order
      row_hints  list[list[{count, color}]]
      col_hints  list[list[{count, color}]]
      solution   list[list[str|null]]
    """
    folder = _puzzles_folder()
    image_path = folder / f"{name}.png"

    if not image_path.exists():
        return jsonify({"error": f"Puzzle '{name}' not found"}), 404

    is_color = name.startswith("color/")

    if is_color:
        color_grid = load_color_image(image_path)
        height = len(color_grid)
        width = len(color_grid[0]) if color_grid else 0
        colors = extract_colors(color_grid)
        row_hints = compute_color_row_hints(color_grid)
        col_hints = compute_color_col_hints(color_grid)
        return jsonify({
            "name": name,
            "width": width,
            "height": height,
            "is_color": True,
            "colors": colors,
            "row_hints": row_hints,
            "col_hints": col_hints,
            "solution": color_grid,
        })

    grid = load_image(image_path)
    height = len(grid)
    width = len(grid[0]) if grid else 0
    row_hints = compute_row_hints(grid)
    col_hints = compute_col_hints(grid)
    return jsonify({
        "name": name,
        "width": width,
        "height": height,
        "is_color": False,
        "row_hints": row_hints,
        "col_hints": col_hints,
        "solution": grid,
    })
