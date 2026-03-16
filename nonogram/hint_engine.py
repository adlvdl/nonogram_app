"""Compute nonogram row and column hints from a pixel grid."""


def compute_row_hints(grid: list[list[bool]]) -> list[list[int]]:
    """Return a list of hint sequences, one per row.

    Each hint sequence is the run-length encoding of filled cells in that row.
    An all-empty row returns [0] to represent a blank clue.
    """
    return [_run_length_encode(row) for row in grid]


def compute_col_hints(grid: list[list[bool]]) -> list[list[int]]:
    """Return a list of hint sequences, one per column.

    Each hint sequence is the run-length encoding of filled cells in that column.
    An all-empty column returns [0] to represent a blank clue.
    """
    if not grid:
        return []

    num_cols = len(grid[0])
    columns: list[list[bool]] = [
        [grid[row_idx][col_idx] for row_idx in range(len(grid))]
        for col_idx in range(num_cols)
    ]
    return [_run_length_encode(col) for col in columns]


def _run_length_encode(line: list[bool]) -> list[int]:
    """Return run lengths of True values in sequence order.

    Returns [0] when no filled cells exist, matching nonogram convention
    for an empty row or column.
    """
    hints: list[int] = []
    current_run = 0

    for filled in line:
        if filled:
            current_run += 1
        elif current_run > 0:
            hints.append(current_run)
            current_run = 0

    if current_run > 0:
        hints.append(current_run)

    return hints if hints else [0]


# ── Color hint functions ──────────────────────────────────────────────────────

# A color hint entry is {"count": int, "color": str} where color is a hex
# string like "#ff0000". An empty row/column returns [{"count": 0, "color": ""}].

ColorHint = dict  # {"count": int, "color": str}


def compute_color_row_hints(grid: list[list[str | None]]) -> list[list[ColorHint]]:
    """Return color hint sequences for each row of a color grid."""
    return [_run_length_encode_color(row) for row in grid]


def compute_color_col_hints(grid: list[list[str | None]]) -> list[list[ColorHint]]:
    """Return color hint sequences for each column of a color grid."""
    if not grid:
        return []

    num_cols = len(grid[0])
    columns: list[list[str | None]] = [
        [grid[row_idx][col_idx] for row_idx in range(len(grid))]
        for col_idx in range(num_cols)
    ]
    return [_run_length_encode_color(col) for col in columns]


def _run_length_encode_color(line: list[str | None]) -> list[ColorHint]:
    """Return color run-length encoding for a single line.

    Consecutive cells of the same color form one run. None cells (empty/white)
    act as separators. Returns [{"count": 0, "color": ""}] for all-empty lines.
    """
    hints: list[ColorHint] = []
    current_color: str | None = None
    current_count = 0

    for cell in line:
        if cell is not None:
            if cell == current_color:
                current_count += 1
            else:
                if current_color is not None:
                    hints.append({"count": current_count, "color": current_color})
                current_color = cell
                current_count = 1
        else:
            if current_color is not None:
                hints.append({"count": current_count, "color": current_color})
                current_color = None
                current_count = 0

    if current_color is not None:
        hints.append({"count": current_count, "color": current_color})

    return hints if hints else [{"count": 0, "color": ""}]
