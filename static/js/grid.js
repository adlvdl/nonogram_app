/**
 * grid.js — Builds and manages the interactive nonogram grid DOM.
 *
 * Exports:
 *   buildGrid(puzzle, onStateChange) -> void
 *   buildColorPalette(colors, container) -> void
 *   readUserGrid(puzzle) -> boolean[][] | (string|null)[][]
 *   activeColor -> string|null  (current selected color for color puzzles)
 */

"use strict";

// Drag state: tracks whether the mouse button is held and what state to apply.
// dragTargetState is fixed for the duration of a drag so all cells in one
// stroke receive the same state (the one the first cell cycled to).
let isMouseDown = false;
let dragTargetState = null;

// Active color for color puzzles. null when not in color mode.
let activeColor = null;

document.addEventListener("mouseup", () => {
  isMouseDown = false;
  dragTargetState = null;
});

/**
 * Build the nonogram grid table and insert it into #nonogram-container.
 *
 * @param {Object} puzzle  - API response: { width, height, row_hints, col_hints, is_color }
 * @param {Function} onStateChange - called after every cell state change
 */
function buildGrid(puzzle, onStateChange) {
  const container = document.getElementById("nonogram-container");
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "nonogram-table";

  const maxColHintRows = Math.max(...puzzle.col_hints.map((h) => h.length));
  const maxRowHintCols = Math.max(...puzzle.row_hints.map((h) => h.length));

  // ── Header rows: column hints ──
  for (let hintRow = 0; hintRow < maxColHintRows; hintRow++) {
    const tr = document.createElement("tr");

    // Corner spacer cell (only on first hint row, spans all hint rows)
    if (hintRow === 0) {
      const corner = document.createElement("td");
      corner.className = "corner-cell";
      corner.rowSpan = maxColHintRows;
      corner.colSpan = maxRowHintCols;
      tr.appendChild(corner);
    }

    for (let col = 0; col < puzzle.width; col++) {
      const hints = puzzle.col_hints[col];
      const offset = maxColHintRows - hints.length;
      const td = document.createElement("td");
      td.className = "col-hint-cell";
      td.dataset.hintCol = String(col);

      if (hintRow >= offset) {
        const hint = hints[hintRow - offset];
        const span = document.createElement("span");
        span.className = "hint-number";
        if (puzzle.is_color) {
          const count = hint.count;
          const color = hint.color;
          span.textContent = count === 0 ? "" : String(count);
          if (color) {
            span.style.backgroundColor = color;
            span.style.color = contrastColor(color);
          }
        } else {
          span.textContent = hint === 0 ? "" : String(hint);
        }
        td.appendChild(span);
      }

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  // ── Puzzle rows: row hints + cells ──
  for (let row = 0; row < puzzle.height; row++) {
    const tr = document.createElement("tr");

    // Row hint cells
    const rowHints = puzzle.row_hints[row];
    const hintPad = maxRowHintCols - rowHints.length;

    for (let hc = 0; hc < maxRowHintCols; hc++) {
      const td = document.createElement("td");
      td.className = "row-hint-cell";
      td.dataset.hintRow = String(row);

      const idx = hc - hintPad;
      if (idx >= 0) {
        const hint = rowHints[idx];
        const span = document.createElement("span");
        span.className = "hint-number";
        if (puzzle.is_color) {
          const count = hint.count;
          const color = hint.color;
          span.textContent = count === 0 ? "" : String(count);
          if (color) {
            span.style.backgroundColor = color;
            span.style.color = contrastColor(color);
          }
        } else {
          span.textContent = hint === 0 ? "" : String(hint);
        }
        td.appendChild(span);
      }

      tr.appendChild(td);
    }

    // Puzzle cells
    for (let col = 0; col < puzzle.width; col++) {
      const td = document.createElement("td");
      td.className = "puzzle-cell";
      td.dataset.row = String(row);
      td.dataset.col = String(col);
      td.dataset.state = "empty";

      // Bold borders every 5 cells
      if (row % 5 === 0) td.classList.add("border-top");
      if (col % 5 === 0) td.classList.add("border-left");

      td.addEventListener("mousedown", (e) => {
        e.preventDefault(); // prevent text selection while dragging
        isMouseDown = true;
        dragTargetState = puzzle.is_color
          ? nextColorState(td.dataset.state)
          : nextState(td.dataset.state);
        applyState(td, dragTargetState);
        checkLineCompletion(puzzle);
        onStateChange();
      });

      td.addEventListener("mouseover", () => {
        if (isMouseDown && dragTargetState !== null) {
          applyState(td, dragTargetState);
          checkLineCompletion(puzzle);
          onStateChange();
        }
      });

      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  container.appendChild(table);
}

/**
 * Build a color palette selector and insert it into the given container.
 * Each color gets a swatch button; clicking selects it as the active color.
 *
 * @param {string[]} colors  - hex color strings, e.g. ["#ff0000", "#0000ff"]
 * @param {HTMLElement} container
 */
function buildColorPalette(colors, container) {
  container.innerHTML = "";
  if (colors.length === 0) return;

  // Select the first color by default.
  activeColor = colors[0];

  const allSwatchValues = [...colors, "crossed"];

  allSwatchValues.forEach((value) => {
    const btn = document.createElement("button");
    btn.dataset.color = value;

    if (value === "crossed") {
      btn.className = "color-swatch cross-swatch";
      btn.title = "Mark cell as empty";
      btn.setAttribute("aria-label", "Mark cell as empty");
    } else {
      btn.className = "color-swatch";
      btn.style.backgroundColor = value;
      btn.title = value;
      btn.setAttribute("aria-label", `Select color ${value}`);
    }

    if (value === activeColor) btn.classList.add("active");

    btn.addEventListener("click", () => {
      activeColor = value;
      container.querySelectorAll(".color-swatch").forEach((b) => {
        b.classList.toggle("active", b.dataset.color === value);
      });
    });

    container.appendChild(btn);
  });
}

/**
 * Return the next state in the BW cycle: empty -> filled -> crossed -> empty.
 *
 * @param {string} current
 * @returns {string}
 */
function nextState(current) {
  const states = ["empty", "filled", "crossed"];
  return states[(states.indexOf(current) + 1) % states.length];
}

/**
 * Return the next state for a color puzzle cell.
 *
 * In cross mode (activeColor === "crossed"):
 *   crossed -> empty, anything else -> crossed
 * In color mode:
 *   activeColor -> empty, anything else -> activeColor
 *
 * @param {string} current
 * @returns {string}
 */
function nextColorState(current) {
  if (activeColor === "crossed") {
    return current === "crossed" ? "empty" : "crossed";
  }
  if (current === activeColor) return "empty";
  return activeColor || "empty";
}

/**
 * Set a cell to an explicit state, updating inline style for hex colors.
 *
 * @param {HTMLTableCellElement} cell
 * @param {string} state  "empty" | "filled" | "crossed" | "#rrggbb"
 */
function applyState(cell, state) {
  cell.dataset.state = state;
  if (state.startsWith("#")) {
    cell.style.backgroundColor = state;
  } else {
    cell.style.backgroundColor = "";
  }
}

/**
 * Read the current user grid state from the DOM.
 * For BW puzzles returns boolean[][].
 * For color puzzles returns (string|null)[][] where null means empty/crossed.
 *
 * @param {Object} puzzle - { width, height, is_color }
 * @returns {boolean[][] | (string|null)[][]}
 */
function readUserGrid(puzzle) {
  const grid = [];
  for (let row = 0; row < puzzle.height; row++) {
    const rowData = [];
    for (let col = 0; col < puzzle.width; col++) {
      const cell = document.querySelector(
        `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
      );
      const state = cell ? cell.dataset.state : "empty";
      if (puzzle.is_color) {
        rowData.push(state.startsWith("#") ? state : null);
      } else {
        rowData.push(state === "filled");
      }
    }
    grid.push(rowData);
  }
  return grid;
}

/**
 * Compute run-length encoding of filled cells in a BW line.
 * Returns [0] for an all-empty line, matching nonogram convention.
 *
 * @param {boolean[]} cells
 * @returns {number[]}
 */
function computeLineRLE(cells) {
  const runs = [];
  let count = 0;
  for (const filled of cells) {
    if (filled) {
      count++;
    } else if (count > 0) {
      runs.push(count);
      count = 0;
    }
  }
  if (count > 0) runs.push(count);
  return runs.length === 0 ? [0] : runs;
}

/**
 * Compute color run-length encoding for a color line.
 * Groups consecutive cells of the same hex color; null/empty cells break runs.
 * Returns [{count: 0, color: ""}] for all-empty lines.
 *
 * @param {(string|null)[]} cells  - null means empty/crossed, string means hex color
 * @returns {{count: number, color: string}[]}
 */
function computeColorLineRLE(cells) {
  const runs = [];
  let currentColor = null;
  let count = 0;

  for (const cell of cells) {
    const color = cell && cell.startsWith("#") ? cell : null;
    if (color !== null) {
      if (color === currentColor) {
        count++;
      } else {
        if (currentColor !== null) runs.push({ count, color: currentColor });
        currentColor = color;
        count = 1;
      }
    } else {
      if (currentColor !== null) {
        runs.push({ count, color: currentColor });
        currentColor = null;
        count = 0;
      }
    }
  }
  if (currentColor !== null) runs.push({ count, color: currentColor });
  return runs.length === 0 ? [{ count: 0, color: "" }] : runs;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function colorRunsEqual(a, b) {
  return (
    a.length === b.length &&
    a.every((v, i) => v.count === b[i].count && v.color === b[i].color)
  );
}

/**
 * Return a contrasting text color (dark or light) for a given hex background.
 *
 * @param {string} hex  - e.g. "#ff0000"
 * @returns {string}    - "#1a1a1a" or "#ffffff"
 */
function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

/**
 * Check every row and column for completion and update the DOM accordingly.
 *
 * A line is "complete" when its run-length encoding matches its hint (for BW:
 * same counts; for color: same counts and colors). When complete, remaining
 * empty cells are auto-crossed and the hint is greyed via .hint-done.
 * Auto-crossed cells carry data-auto="true" so they reset on the next action.
 *
 * @param {Object} puzzle - { width, height, row_hints, col_hints, is_color }
 */
function checkLineCompletion(puzzle) {
  // Clear previous auto state so we recompute from scratch each time.
  document.querySelectorAll('.puzzle-cell[data-auto="true"]').forEach((cell) => {
    applyState(cell, "empty");
    delete cell.dataset.auto;
  });
  document.querySelectorAll(".hint-done").forEach((td) => {
    td.classList.remove("hint-done");
  });

  if (puzzle.is_color) {
    _checkColorLineCompletion(puzzle);
  } else {
    _checkBwLineCompletion(puzzle);
  }
}

function _checkBwLineCompletion(puzzle) {
  for (let row = 0; row < puzzle.height; row++) {
    const cells = [];
    for (let col = 0; col < puzzle.width; col++) {
      const cell = document.querySelector(
        `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
      );
      cells.push(cell ? cell.dataset.state === "filled" : false);
    }
    if (arraysEqual(computeLineRLE(cells), puzzle.row_hints[row])) {
      document
        .querySelectorAll(`.row-hint-cell[data-hint-row="${row}"]`)
        .forEach((td) => td.classList.add("hint-done"));
      for (let col = 0; col < puzzle.width; col++) {
        const cell = document.querySelector(
          `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell && cell.dataset.state === "empty") {
          applyState(cell, "crossed");
          cell.dataset.auto = "true";
        }
      }
    }
  }

  for (let col = 0; col < puzzle.width; col++) {
    const cells = [];
    for (let row = 0; row < puzzle.height; row++) {
      const cell = document.querySelector(
        `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
      );
      cells.push(cell ? cell.dataset.state === "filled" : false);
    }
    if (arraysEqual(computeLineRLE(cells), puzzle.col_hints[col])) {
      document
        .querySelectorAll(`.col-hint-cell[data-hint-col="${col}"]`)
        .forEach((td) => td.classList.add("hint-done"));
      for (let row = 0; row < puzzle.height; row++) {
        const cell = document.querySelector(
          `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell && cell.dataset.state === "empty") {
          applyState(cell, "crossed");
          cell.dataset.auto = "true";
        }
      }
    }
  }
}

function _checkColorLineCompletion(puzzle) {
  for (let row = 0; row < puzzle.height; row++) {
    const cells = [];
    for (let col = 0; col < puzzle.width; col++) {
      const cell = document.querySelector(
        `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
      );
      const state = cell ? cell.dataset.state : "empty";
      cells.push(state.startsWith("#") ? state : null);
    }
    if (colorRunsEqual(computeColorLineRLE(cells), puzzle.row_hints[row])) {
      document
        .querySelectorAll(`.row-hint-cell[data-hint-row="${row}"]`)
        .forEach((td) => td.classList.add("hint-done"));
      for (let col = 0; col < puzzle.width; col++) {
        const cell = document.querySelector(
          `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell && cell.dataset.state === "empty") {
          applyState(cell, "crossed");
          cell.dataset.auto = "true";
        }
      }
    }
  }

  for (let col = 0; col < puzzle.width; col++) {
    const cells = [];
    for (let row = 0; row < puzzle.height; row++) {
      const cell = document.querySelector(
        `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
      );
      const state = cell ? cell.dataset.state : "empty";
      cells.push(state.startsWith("#") ? state : null);
    }
    if (colorRunsEqual(computeColorLineRLE(cells), puzzle.col_hints[col])) {
      document
        .querySelectorAll(`.col-hint-cell[data-hint-col="${col}"]`)
        .forEach((td) => td.classList.add("hint-done"));
      for (let row = 0; row < puzzle.height; row++) {
        const cell = document.querySelector(
          `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell && cell.dataset.state === "empty") {
          applyState(cell, "crossed");
          cell.dataset.auto = "true";
        }
      }
    }
  }
}
