/**
 * solution_checker.js — Compares the user grid against the puzzle solution.
 *
 * Exports:
 *   checkSolution(solution, userGrid) -> boolean
 *   showCongratsPopup() -> void
 */

"use strict";

/**
 * Return true when every cell in userGrid matches the solution.
 *
 * Works for both BW puzzles (boolean[][]) and color puzzles ((string|null)[][]).
 * For color: null means empty/crossed; a hex string means that color is placed.
 *
 * @param {boolean[][] | (string|null)[][]} solution - ground truth from the API
 * @param {boolean[][] | (string|null)[][]} userGrid - user's current state
 * @returns {boolean}
 */
function checkSolution(solution, userGrid) {
  for (let row = 0; row < solution.length; row++) {
    for (let col = 0; col < solution[row].length; col++) {
      if (solution[row][col] !== userGrid[row][col]) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Make the congratulations overlay visible.
 */
function showCongratsPopup() {
  const overlay = document.getElementById("congrats-overlay");
  if (overlay) {
    overlay.classList.add("visible");
  }
}

/**
 * Hide the congratulations overlay.
 */
function hideCongratsPopup() {
  const overlay = document.getElementById("congrats-overlay");
  if (overlay) {
    overlay.classList.remove("visible");
  }
}
