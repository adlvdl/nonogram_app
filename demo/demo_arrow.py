"""Demo: load the arrow puzzle and print its hints to stdout.

Run from the project root:
    python demo/demo_arrow.py
"""

from pathlib import Path

from nonogram.hint_engine import compute_col_hints, compute_row_hints
from nonogram.image_loader import load_image
from nonogram.puzzle_model import build_puzzle_frame, compare_solution

PUZZLE_PATH = Path(__file__).parent.parent / "nonograms" / "bw" / "arrow_w5_h5.png"


def main() -> None:
    print(f"Loading: {PUZZLE_PATH.name}\n")

    grid = load_image(PUZZLE_PATH)

    print("Pixel grid (# = filled, . = empty):")
    for row in grid:
        print(" ".join("#" if cell else "." for cell in row))

    print()
    row_hints = compute_row_hints(grid)
    col_hints = compute_col_hints(grid)

    print("Row hints:")
    for i, hints in enumerate(row_hints):
        print(f"  Row {i}: {hints}")

    print()
    print("Col hints:")
    for j, hints in enumerate(col_hints):
        print(f"  Col {j}: {hints}")

    print()
    frame = build_puzzle_frame(grid)
    print(f"Puzzle frame shape: {frame.shape}")
    print(frame)

    print()
    print("Solution check (correct grid):", compare_solution(frame, grid))

    wrong_grid = [[not cell for cell in row] for row in grid]
    print("Solution check (inverted grid):", compare_solution(frame, wrong_grid))


if __name__ == "__main__":
    main()
