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
 * @param {boolean[][]} solution - ground truth from the API
 * @param {boolean[][]} userGrid - user's current state (filled = true)
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
