/**
 * grid.js — Builds and manages the interactive nonogram grid DOM.
 *
 * Exports:
 *   buildGrid(puzzle, onStateChange) -> void
 *   readUserGrid(puzzle) -> boolean[][]
 */

"use strict";

// Drag state: tracks whether the mouse button is held and what state to apply.
// dragTargetState is fixed for the duration of a drag so all cells in one
// stroke receive the same state (the one the first cell cycled to).
let isMouseDown = false;
let dragTargetState = null;

document.addEventListener("mouseup", () => {
  isMouseDown = false;
  dragTargetState = null;
});

/**
 * Build the nonogram grid table and insert it into #nonogram-container.
 *
 * @param {Object} puzzle  - API response: { width, height, row_hints, col_hints }
 * @param {Function} onStateChange - called after every cell state change
 */
function buildGrid(puzzle, onStateChange) {
  const container = document.getElementById("nonogram-container");
  container.innerHTML = "";

  const table = document.createElement("table");
  table.className = "nonogram-table";

  const maxColHintRows = Math.max(...puzzle.col_hints.map(h => h.length));
  const maxRowHintCols = Math.max(...puzzle.row_hints.map(h => h.length));

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
        const value = hints[hintRow - offset];
        const span = document.createElement("span");
        span.className = "hint-number";
        span.textContent = value === 0 ? "" : String(value);
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
        const value = rowHints[idx];
        const span = document.createElement("span");
        span.className = "hint-number";
        span.textContent = value === 0 ? "" : String(value);
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
        dragTargetState = nextState(td.dataset.state);
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
 * Return the next state in the cycle: empty -> filled -> crossed -> empty.
 *
 * @param {string} current
 * @returns {string}
 */
function nextState(current) {
  const states = ["empty", "filled", "crossed"];
  return states[(states.indexOf(current) + 1) % states.length];
}

/**
 * Set a cell to an explicit state.
 *
 * @param {HTMLTableCellElement} cell
 * @param {string} state
 */
function applyState(cell, state) {
  cell.dataset.state = state;
}

/**
 * Read the current user grid state from the DOM.
 *
 * @param {Object} puzzle - { width, height }
 * @returns {boolean[][]} - true where user has filled a cell
 */
function readUserGrid(puzzle) {
  const grid = [];
  for (let row = 0; row < puzzle.height; row++) {
    const rowData = [];
    for (let col = 0; col < puzzle.width; col++) {
      const cell = document.querySelector(
        `.puzzle-cell[data-row="${row}"][data-col="${col}"]`
      );
      rowData.push(cell ? cell.dataset.state === "filled" : false);
    }
    grid.push(rowData);
  }
  return grid;
}

/**
 * Compute run-length encoding of filled cells in a line.
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

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Check every row and column for completion and update the DOM accordingly.
 *
 * A line is "complete" when its filled cells produce the same run-length
 * encoding as its hint — regardless of whether the fill is correct. When
 * complete: remaining empty cells are auto-crossed and the hint is greyed.
 * Auto-crossed cells are tracked via data-auto so they can be cleared and
 * recomputed on the next user action.
 *
 * @param {Object} puzzle - { width, height, row_hints, col_hints }
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

  // Check rows then columns. Running rows first means any cells auto-crossed
  // by a completed row are already "crossed" (not "filled") when the column
  // check runs, giving correct column RLEs without a second pass.
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
