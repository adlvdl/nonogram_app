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

  const displayId = puzzleDisplayId(puzzleName);
  document.title = `Nonogram — ${displayId}`;
  document.getElementById("puzzle-title").textContent = displayId;

  fetch(`/api/nonogram/${puzzleName}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Puzzle '${puzzleName}' not found`);
      return res.json();
    })
    .then((puzzle) => {
      document.getElementById("puzzle-loading").style.display = "none";

      // Show colour palette for colour puzzles.
      const paletteEl = document.getElementById("color-palette");
      if (puzzle.is_color) {
        paletteEl.style.display = "flex";
        buildColorPalette(puzzle.colors, paletteEl);
      }

      function onStateChange() {
        const userGrid = readUserGrid(puzzle);
        if (checkSolution(puzzle.solution, userGrid)) {
          const elapsed = stopTimer();
          saveSolution(puzzleName, puzzle.solution);
          const isNewBest = saveBestTime(puzzleName, elapsed);
          document.getElementById("congrats-time").textContent =
            `Solved in ${formatTime(elapsed)}`;
          const best = getBestTime(puzzleName);
          document.getElementById("congrats-best").textContent =
            isNewBest ? "New best time!" : `Best: ${formatTime(best)}`;
          showCongratsPopup();
        }
      }

      buildGrid(puzzle, onStateChange);
      startTimer();

      // Dismiss popup and reset grid on "Reset puzzle"
      document.getElementById("btn-play-again").addEventListener("click", () => {
        hideCongratsPopup();
        if (puzzle.is_color) buildColorPalette(puzzle.colors, paletteEl);
        buildGrid(puzzle, onStateChange);
        startTimer();
      });
    })
    .catch((err) => {
      document.getElementById("puzzle-loading").style.display = "none";
      document.getElementById("puzzle-error").textContent = err.message;
    });
})();
