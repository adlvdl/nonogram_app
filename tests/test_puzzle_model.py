"""Tests for nonogram.puzzle_model."""

import polars as pl

from nonogram.puzzle_model import build_puzzle_frame, compare_solution


SIMPLE_GRID = [
    [True, False],
    [False, True],
]


class TestBuildPuzzleFrame:
    def test_schema(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        assert frame.schema["row_idx"] == pl.Int32
        assert frame.schema["col_idx"] == pl.Int32
        assert frame.schema["is_filled"] == pl.Boolean

    def test_row_count(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        assert len(frame) == 4  # 2 rows * 2 cols

    def test_filled_cells(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        filled = frame.filter(pl.col("is_filled"))
        assert len(filled) == 2  # two True cells in the grid

    def test_cell_coordinates(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        row_indices = set(frame["row_idx"].to_list())
        col_indices = set(frame["col_idx"].to_list())
        assert row_indices == {0, 1}
        assert col_indices == {0, 1}


class TestCompareSolution:
    def test_correct_solution_returns_true(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        assert compare_solution(frame, SIMPLE_GRID) is True

    def test_wrong_solution_returns_false(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        wrong = [[False, True], [True, False]]
        assert compare_solution(frame, wrong) is False

    def test_all_empty_user_grid_returns_false(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        empty = [[False, False], [False, False]]
        assert compare_solution(frame, empty) is False

    def test_all_filled_user_grid_returns_false(self):
        frame = build_puzzle_frame(SIMPLE_GRID)
        full = [[True, True], [True, True]]
        assert compare_solution(frame, full) is False
