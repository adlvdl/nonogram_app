/**
 * main.js — App bootstrap: wires grid.js and solution_checker.js together.
 *
 * Runs on puzzle.html. Reads ?name= from the query string, fetches the
 * puzzle from the API, renders the grid, and hooks up solution checking.
 */

"use strict";

(function () {
  const params = new URLSearchParams(window.location.search);
  const puzzleName = params.get("name");

  if (!puzzleName) {
    document.getElementById("puzzle-error").textContent =
      "No puzzle selected. Go back and choose one.";
    return;
  }

  document.title = `Nonogram — ${puzzleName}`;
  document.getElementById("puzzle-title").textContent = puzzleName;

  fetch(`/api/nonogram/${puzzleName}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Puzzle '${puzzleName}' not found`);
      return res.json();
    })
    .then((puzzle) => {
      document.getElementById("puzzle-loading").style.display = "none";

      buildGrid(puzzle, () => {
        const userGrid = readUserGrid(puzzle);
        if (checkSolution(puzzle.solution, userGrid)) {
          showCongratsPopup();
        }
      });

      // Dismiss popup and reset grid on "Play again"
      document.getElementById("btn-play-again").addEventListener("click", () => {
        hideCongratsPopup();
        buildGrid(puzzle, () => {
          const userGrid = readUserGrid(puzzle);
          if (checkSolution(puzzle.solution, userGrid)) {
            showCongratsPopup();
          }
        });
      });
    })
    .catch((err) => {
      document.getElementById("puzzle-loading").style.display = "none";
      document.getElementById("puzzle-error").textContent = err.message;
    });
})();
