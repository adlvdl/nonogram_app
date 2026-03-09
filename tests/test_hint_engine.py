"""Tests for nonogram.hint_engine."""

from nonogram.hint_engine import (
    _run_length_encode,
    compute_col_hints,
    compute_row_hints,
)


class TestRunLengthEncode:
    def test_all_empty_returns_zero(self):
        assert _run_length_encode([False, False, False]) == [0]

    def test_all_filled_returns_full_length(self):
        assert _run_length_encode([True, True, True]) == [3]

    def test_alternating_returns_ones(self):
        assert _run_length_encode([True, False, True, False, True]) == [1, 1, 1]

    def test_single_run(self):
        assert _run_length_encode([False, True, True, True, False]) == [3]

    def test_multiple_runs(self):
        assert _run_length_encode([True, False, True, True]) == [1, 2]

    def test_leading_and_trailing_filled(self):
        assert _run_length_encode([True, False, True]) == [1, 1]

    def test_empty_sequence_returns_zero(self):
        assert _run_length_encode([]) == [0]


class TestComputeRowHints:
    def test_arrow_row_2_is_full(self):
        # The middle row of a 5-wide arrow is all filled
        grid = [
            [False, False, True,  False, False],
            [False, True,  False, False, False],
            [True,  True,  True,  True,  True],
            [False, True,  False, False, False],
            [False, False, True,  False, False],
        ]
        hints = compute_row_hints(grid)
        assert hints[2] == [5]

    def test_returns_one_hint_per_row(self):
        grid = [[True, False], [False, True]]
        hints = compute_row_hints(grid)
        assert len(hints) == 2

    def test_empty_row_returns_zero_hint(self):
        grid = [[False, False, False]]
        assert compute_row_hints(grid) == [[0]]


class TestComputeColHints:
    def test_arrow_col_2_has_three_ones(self):
        # Column 2 of the arrow: row0=T, row1=F, row2=T, row3=F, row4=T
        grid = [
            [False, False, True,  False, False],
            [False, True,  False, False, False],
            [True,  True,  True,  True,  True],
            [False, True,  False, False, False],
            [False, False, True,  False, False],
        ]
        hints = compute_col_hints(grid)
        assert hints[2] == [1, 1, 1]

    def test_returns_one_hint_per_column(self):
        grid = [[True, False, True], [False, True, False]]
        hints = compute_col_hints(grid)
        assert len(hints) == 3

    def test_empty_grid_returns_empty(self):
        assert compute_col_hints([]) == []
