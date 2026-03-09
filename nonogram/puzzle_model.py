"""Polars-based puzzle state representation and solution comparison."""

import polars as pl


def build_puzzle_frame(grid: list[list[bool]]) -> pl.DataFrame:
    """Build a Polars DataFrame representing a nonogram puzzle grid.

    Schema:
      row_idx  Int32    0-based row index
      col_idx  Int32    0-based column index
      is_filled Boolean  True if this cell should be filled (ground truth)
    """
    rows: list[dict] = []
    for row_idx, row in enumerate(grid):
        for col_idx, filled in enumerate(row):
            rows.append({
                "row_idx": row_idx,
                "col_idx": col_idx,
                "is_filled": filled,
            })

    return pl.DataFrame(rows).with_columns([
        pl.col("row_idx").cast(pl.Int32),
        pl.col("col_idx").cast(pl.Int32),
        pl.col("is_filled").cast(pl.Boolean),
    ])


def compare_solution(
    truth_frame: pl.DataFrame,
    user_grid: list[list[bool]],
) -> bool:
    """Return True when user_grid exactly matches the puzzle solution.

    user_grid[r][c] should be True for cells the user has marked as filled.
    Crossed-out (eliminated) cells must be passed as False.
    """
    user_rows: list[dict] = []
    for row_idx, row in enumerate(user_grid):
        for col_idx, filled in enumerate(row):
            user_rows.append({
                "row_idx": row_idx,
                "col_idx": col_idx,
                "user_filled": filled,
            })

    user_frame = pl.DataFrame(user_rows).with_columns([
        pl.col("row_idx").cast(pl.Int32),
        pl.col("col_idx").cast(pl.Int32),
        pl.col("user_filled").cast(pl.Boolean),
    ])

    joined = truth_frame.join(user_frame, on=["row_idx", "col_idx"], how="left")
    mismatches = joined.filter(pl.col("is_filled") != pl.col("user_filled"))
    return len(mismatches) == 0
