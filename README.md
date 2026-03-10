# Nonogram App

A web app for playing and solving nonogram (Picross) puzzles. Puzzles are sourced from PNG images — the app reads each image's pixels and automatically generates the row and column hints, then presents an interactive grid where you solve the puzzle by hand.

Built with Python + Flask on the backend and vanilla HTML/JS on the frontend.

---

## What is a Nonogram?

A nonogram (also known as Hanjie, Picross, or Griddlers) is a logic puzzle where you fill in cells on a grid to reveal a hidden picture. Numbers at the edge of each row and column tell you how many consecutive filled cells appear in that line and in what order.

For example, a clue of `4 8 3` means there are groups of four, eight, and three filled cells — in that order — with at least one empty cell separating each group.

Puzzles can be black and white (binary fill) or colored (each number is color-coded). Two differently colored groups may or may not have a gap between them.

---

## Project Scope

The goal is a composable, mobile-ready puzzle platform built in Python that can eventually be ported to Swift/iOS or Kotlin/Android. The architecture prioritises clean data boundaries and a separation of concerns so each module can be developed and tested independently.

**Planned workstreams:**
- **data-model** — core schema and image processing pipeline
- **infrastructure** — tooling, packaging, CI/CD
- **frontend** — interactive puzzle grid, hint highlighting, timer, mobile support
- **color support** — extend the pipeline to handle multi-color nonograms

---

## Current State

Fully functional for black-and-white nonograms.

- Load any BW PNG from the `nonograms/bw/` folder
- Automatically compute row and column hints from pixel data
- Display a correctly sized interactive grid with hints on the edges
- Click or click-and-drag cells to cycle through three states: **empty → filled → crossed (X)**
- Completed rows and columns are detected automatically: remaining empty cells are crossed out and the hint is greyed with a strikethrough
- Puzzle timer starts on load and stops when the correct solution is submitted
- Best solve times are stored per puzzle in browser localStorage
- Puzzle selection screen shows the best time for each puzzle (or "Unsolved")
- Solved puzzles display a pixel thumbnail of their solution on the selection screen
- Puzzle names are shown as a stable 6-digit ID rather than the descriptive filename, so the name cannot serve as a hint
- Detect when the solution is complete and show a congratulations popup with solve time and best-time status
- Reset and replay any puzzle

One puzzle is included: a 5×5 arrow (`nonograms/bw/arrow_w5_h5.png`). Adding new puzzles requires only dropping a PNG into the folder.

---

## Architecture

```
nonogram_app/
├── app.py                      Flask app factory — routes and config
├── nonogram/
│   ├── image_loader.py         PNG → bool[][] pixel grid (Pillow)
│   ├── hint_engine.py          Run-length encoding → row/column hints
│   ├── puzzle_model.py         Polars DataFrame representation + solution comparison
│   └── api.py                  Flask Blueprint: /api/puzzles, /api/nonogram/<name>
├── templates/
│   ├── index.html              Puzzle selection screen
│   └── puzzle.html             Interactive game grid
├── static/
│   ├── css/nonogram.css        Styles (grid, hints, X marks, congrats overlay)
│   └── js/
│       ├── grid.js             Builds the DOM table, manages cell state and line completion
│       ├── solution_checker.js Client-side solution comparison and popup control
│       ├── timer.js            Puzzle solve timer (start/stop, M:SS display)
│       ├── best_times.js       localStorage wrapper for best times and solution cache
│       └── main.js             Bootstrap: fetches API, wires grid + checker + timer
├── tests/                      36 tests covering all backend modules and API
├── demo/
│   └── demo_arrow.py           Runnable demo: prints hints and Polars frame to stdout
├── nonograms/
│   ├── bw/                     Black-and-white puzzle PNGs
│   └── color/                  Color puzzle PNGs (not yet supported)
├── pyproject.toml
└── requirements.txt
```

### Data Flow

```
nonograms/bw/arrow_w5_h5.png
        │
        ▼
image_loader.load_image()          Pillow opens PNG, converts to grayscale,
        │                          thresholds pixel < 128 → True (filled)
        │
        ├──▶ hint_engine.compute_row_hints()   Run-length encode each row
        ├──▶ hint_engine.compute_col_hints()   Transpose, then encode each column
        └──▶ puzzle_model.build_puzzle_frame() Polars DataFrame (row_idx, col_idx, is_filled)
        │
        ▼
api.py serialises → JSON response
        │
        ▼
Browser: grid.js renders table     Column hints top, row hints left, puzzle cells right
         main.js wires click events After every click, solution_checker.js compares
                                    user state against solution → shows popup on match
```

### API

| Endpoint | Response |
|---|---|
| `GET /api/puzzles` | `{"puzzles": ["bw/arrow_w5_h5", ...]}` |
| `GET /api/nonogram/<name>` | `{name, width, height, row_hints, col_hints, solution}` |

`row_hints` and `col_hints` are arrays of arrays, e.g. `[[1], [1], [5], [1], [1]]`. The `solution` field is a 2D boolean array used for client-side checking.

### Cell State Model

Each grid cell cycles through three states on click:

| State | Visual | Meaning |
|---|---|---|
| `empty` | white | undecided |
| `filled` | black | marked as filled |
| `crossed` | × | marked as definitely empty |

Only `filled` cells are compared against the solution. `crossed` and `empty` both count as `false`.

---

## Getting Started

**Requirements:** Python 3.12+

```bash
# Clone and set up
git clone https://github.com/adlvdl/nonogram_app.git
cd nonogram_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the app
python app.py
# Open http://localhost:5001
```

**Run the demo** (prints hints and Polars frame for the arrow puzzle):
```bash
python demo/demo_arrow.py
```

**Run the tests:**
```bash
pytest tests/ -v
```

### Adding New Puzzles

Drop any black-and-white PNG into `nonograms/bw/`. The filename convention is:

```
<name>_w<width>_h<height>.png
```

For example: `heart_w10_h10.png`. The app will pick it up automatically on next load — no code changes needed.

---

## Implementation Notes

- **Polars over Pandas** — all tabular data uses Polars. The `puzzle_model.py` DataFrame is the canonical in-memory representation; it's designed to extend naturally to color nonogram support (add a `color: String` column) and per-row progress tracking.
- **Solution check is client-side** — the full solution grid is returned in the API response and compared in JS after every click, avoiding a server round-trip. For a competitive or shared deployment this would move to a `POST /api/nonogram/<name>/check` endpoint.
- **Dispatcher pattern in `image_loader.py`** — `load_image()` dispatches to `_load_with_pillow()`, leaving a clean hook for a color-channel loader without changing the public API.
- **Port 5001** — port 5000 is reserved by macOS AirPlay Receiver.

---

## Roadmap

- [ ] Add more BW puzzle images
- [x] Highlight solved rows/columns in the hint area
- [x] Puzzle timer with best-time tracking per puzzle
- [x] Show solution thumbnail and best time on the selection screen
- [x] Obfuscate puzzle names so the filename cannot serve as a hint
- [ ] Right-click / long-press to place X directly
- [ ] Color nonogram support (multi-channel PNG pipeline)
- [ ] Mobile-optimised layout
- [ ] Server-side persistence — move best times and solve history to a SQLite store so progress is preserved across browsers and devices
