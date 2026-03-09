"""Tests for nonogram.image_loader."""

from pathlib import Path

import pytest

from nonogram.image_loader import list_puzzles, load_image

ARROW_PATH = Path(__file__).parent.parent / "nonograms" / "bw" / "arrow_w5_h5.png"
PUZZLES_ROOT = Path(__file__).parent.parent / "nonograms"


class TestLoadImage:
    def test_returns_5x5_grid(self):
        grid = load_image(ARROW_PATH)
        assert len(grid) == 5
        assert all(len(row) == 5 for row in grid)

    def test_grid_contains_booleans(self):
        grid = load_image(ARROW_PATH)
        for row in grid:
            for cell in row:
                assert isinstance(cell, bool)

    def test_has_filled_and_empty_cells(self):
        grid = load_image(ARROW_PATH)
        flat = [cell for row in grid for cell in row]
        assert any(flat), "expected at least one filled cell"
        assert not all(flat), "expected at least one empty cell"

    def test_missing_file_raises(self):
        with pytest.raises(Exception):
            load_image("/nonexistent/path/puzzle.png")


class TestListPuzzles:
    def test_finds_arrow_puzzle(self):
        puzzles = list_puzzles(PUZZLES_ROOT)
        assert any("arrow" in p for p in puzzles)

    def test_returns_names_without_extension(self):
        puzzles = list_puzzles(PUZZLES_ROOT)
        for name in puzzles:
            assert not name.endswith(".png")

    def test_empty_folder_returns_empty_list(self, tmp_path):
        assert list_puzzles(tmp_path) == []
