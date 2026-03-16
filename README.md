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

---

## Current State

Fully functional for both black-and-white and color nonograms.

- Load BW PNGs from `nonograms/bw/` and color PNGs from `nonograms/color/`
- Automatically compute row and column hints from pixel data; color hints carry the color of each run
- Display a correctly sized interactive grid with hints on the edges
- **BW puzzles:** click or drag cells to cycle through **empty → filled → crossed (X)**
- **Color puzzles:** select a color from the palette, then click or drag to paint; select the X button to mark cells as empty; clicking a painted cell with the same color removes it
- Color hint numbers are rendered as colored chips matching the run they describe
- Completed rows and columns are detected automatically: remaining empty cells are crossed out and hints are dimmed with a strikethrough (color chips retain their color)
- Puzzle timer starts on load and stops when the correct solution is submitted
- Best solve times are stored per puzzle in browser localStorage
- Puzzle selection screen shows the best time for each puzzle (or "Unsolved")
- Solved puzzles display a pixel thumbnail on the selection screen — rendered in full color for color puzzles
- Puzzle names are shown as a stable 6-digit ID rather than the descriptive filename, so the name cannot serve as a hint
- Congratulations popup shows solve time and best-time status
- Reset and replay any puzzle

---

## Architecture

```
nonogram_app/
├── app.py                      Flask app factory — routes and config
├── nonogram/
│   ├── image_loader.py         PNG → bool[][] (BW) or (str|None)[][] (color) pixel grid
│   ├── hint_engine.py          Run-length encoding → BW int hints or color {count,color} hints
│   ├── puzzle_model.py         Polars DataFrame representation + solution comparison
│   └── api.py                  Flask Blueprint: /api/puzzles, /api/nonogram/<name>
├── templates/
│   ├── index.html              Puzzle selection screen
│   └── puzzle.html             Interactive game grid
├── static/
│   ├── css/nonogram.css        Styles (grid, hints, color palette, X marks, congrats overlay)
│   └── js/
│       ├── grid.js             DOM grid, cell state, color palette, line completion
│       ├── solution_checker.js Client-side solution comparison (BW and color) and popup control
│       ├── timer.js            Puzzle solve timer (start/stop, M:SS display)
│       ├── best_times.js       localStorage wrapper for best times and solution cache
│       └── main.js             Bootstrap: fetches API, wires grid + palette + checker + timer
├── tests/                      36 tests covering all backend modules and API
├── demo/
│   └── demo_arrow.py           Runnable demo: prints hints and Polars frame to stdout
├── nonograms/
│   ├── bw/                     Black-and-white puzzle PNGs
│   └── color/                  Color puzzle PNGs
├── pyproject.toml
└── requirements.txt
```

### Data Flow

```
PNG file (bw/ or color/)
        │
        ▼
image_loader.load_image()          BW: grayscale threshold → bool[][]
image_loader.load_color_image()    Color: RGB pixels, white → None, others → "#rrggbb"
        │
        ├──▶ hint_engine.compute_row/col_hints()        BW: int[] per line
        ├──▶ hint_engine.compute_color_row/col_hints()  Color: {count, color}[] per line
        └──▶ puzzle_model.build_puzzle_frame()          Polars DataFrame (row_idx, col_idx, is_filled)
        │
        ▼
api.py serialises → JSON response   Includes is_color flag, colors list, and
        │                           type-appropriate hints and solution
        ▼
Browser: grid.js renders table      Color hints shown as colored chips; BW hints as plain numbers
         main.js wires events        Color puzzles show palette; after every click,
                                     solution_checker.js compares user state → popup on match
```

### API

| Endpoint | Response |
|---|---|
| `GET /api/puzzles` | `{"puzzles": ["bw/arrow_w5_h5", ...]}` |
| `GET /api/nonogram/<name>` | `{name, width, height, is_color, row_hints, col_hints, solution}` |

For BW puzzles (`is_color: false`), `row_hints`/`col_hints` are arrays of int arrays, e.g. `[[1], [5], [1]]`, and `solution` is a 2D boolean array.

For color puzzles (`is_color: true`), the response also includes `colors` (unique hex strings in appearance order). `row_hints`/`col_hints` are arrays of `{count, color}` arrays, e.g. `[[{"count":3,"color":"#ff0000"},{"count":2,"color":"#0000ff"}]]`, and `solution` is a 2D array of hex strings or `null` (empty cell).

### Cell State Model

**BW puzzles** — each cell cycles through three states on click:

| State | Visual | Meaning |
|---|---|---|
| `empty` | white | undecided |
| `filled` | black | marked as filled |
| `crossed` | × | marked as definitely empty |

Only `filled` cells are compared against the solution. `crossed` and `empty` both count as `false`.

**Color puzzles** — cells hold one of: `empty`, `crossed`, or a hex color string (e.g. `#ff0000`). The active color is selected from the palette; an X button enables cross mode. Only cells with a hex color value are compared against the solution — `empty` and `crossed` are treated as `null`.

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

Drop any PNG into the appropriate folder — `nonograms/bw/` for black-and-white or `nonograms/color/` for color. The app detects the type from the folder and picks up new files automatically on next load.

The filename convention is:

```
<name>_w<width>_h<height>.png
```

For example: `heart_w10_h10.png` or `parrot_w15_h15.png`.

**Color puzzle requirements:** white pixels (`RGB ≥ 240` on all channels) are treated as empty cells. All other colors are extracted automatically and presented in the palette.

---

## Implementation Notes

- **Polars over Pandas** — all tabular data uses Polars. The `puzzle_model.py` DataFrame is the canonical in-memory representation; it's designed to extend naturally to per-row progress tracking.
- **Solution check is client-side** — the full solution grid is returned in the API response and compared in JS after every click, avoiding a server round-trip. For a competitive or shared deployment this would move to a `POST /api/nonogram/<name>/check` endpoint.
- **Dispatcher pattern in `image_loader.py`** — `load_image()` and `load_color_image()` are separate entry points; `api.py` dispatches based on the `color/` path prefix.
- **Color detection by folder** — puzzles under `color/` are loaded as color; all others are loaded as BW. No metadata file or filename flag is required.
- **Port 5001** — port 5000 is reserved by macOS AirPlay Receiver.

---

## Roadmap

- [ ] Add more BW and color puzzle images
- [x] Highlight solved rows/columns in the hint area
- [x] Puzzle timer with best-time tracking per puzzle
- [x] Show solution thumbnail and best time on the selection screen
- [x] Obfuscate puzzle names so the filename cannot serve as a hint
- [x] Color nonogram support (multi-channel PNG pipeline, color palette UI, colored hint chips)
- [ ] Right-click / long-press to place X directly (BW puzzles)
- [ ] Mobile-optimised layout
- [ ] Server-side persistence — move best times and solve history to a SQLite store so progress is preserved across browsers and devices
