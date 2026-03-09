"""Flask Blueprint exposing the nonogram API endpoints."""

from pathlib import Path

from flask import Blueprint, current_app, jsonify

from nonogram.hint_engine import compute_col_hints, compute_row_hints
from nonogram.image_loader import list_puzzles, load_image

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

    Response schema:
      name       str
      width      int
      height     int
      row_hints  list[list[int]]
      col_hints  list[list[int]]
      solution   list[list[bool]]
    """
    folder = _puzzles_folder()
    image_path = folder / f"{name}.png"

    if not image_path.exists():
        return jsonify({"error": f"Puzzle '{name}' not found"}), 404

    grid = load_image(image_path)
    height = len(grid)
    width = len(grid[0]) if grid else 0

    row_hints = compute_row_hints(grid)
    col_hints = compute_col_hints(grid)

    return jsonify({
        "name": name,
        "width": width,
        "height": height,
        "row_hints": row_hints,
        "col_hints": col_hints,
        "solution": grid,
    })
