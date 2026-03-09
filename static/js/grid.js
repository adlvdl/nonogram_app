/**
 * grid.js — Builds and manages the interactive nonogram grid DOM.
 *
 * Exports:
 *   buildGrid(puzzle, onStateChange) -> void
 *   readUserGrid(puzzle) -> boolean[][]
 */

"use strict";

/**
 * Build the nonogram grid table and insert it into #nonogram-container.
 *
 * @param {Object} puzzle  - API response: { width, height, row_hints, col_hints }
 * @param {Function} onStateChange - called after every cell click
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

      td.addEventListener("click", () => {
        cycleState(td);
        onStateChange();
      });

      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  container.appendChild(table);
}

/**
 * Cycle a cell through: empty -> filled -> crossed -> empty.
 *
 * @param {HTMLTableCellElement} cell
 */
function cycleState(cell) {
  const states = ["empty", "filled", "crossed"];
  const current = cell.dataset.state;
  const next = states[(states.indexOf(current) + 1) % states.length];
  cell.dataset.state = next;
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
