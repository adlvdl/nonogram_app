/**
 * best_times.js — localStorage wrapper for per-puzzle best solve times
 * and cached solution grids.
 *
 * Exports:
 *   getBestTime(puzzleName)        -> number | null  (seconds)
 *   saveBestTime(puzzleName, secs) -> boolean  (true if new best)
 *   formatBestTime(puzzleName)     -> string   ("M:SS" or "Unsolved")
 *   saveSolution(puzzleName, solution) -> void
 *   getSolution(puzzleName)            -> boolean[][] | null
 */

"use strict";

/**
 * Derive a stable 6-digit display ID from a puzzle's internal name.
 * The same name always produces the same number without revealing the filename.
 *
 * @param {string} name
 * @returns {string}  e.g. "#384729"
 */
function puzzleDisplayId(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  }
  return "#" + String(100000 + (Math.abs(h) % 900000));
}

const _BEST_TIMES_KEY = "nonogram-best-times";

/**
 * Return the best time in seconds for a puzzle, or null if unsolved.
 *
 * @param {string} puzzleName
 * @returns {number|null}
 */
function getBestTime(puzzleName) {
  try {
    const stored = JSON.parse(localStorage.getItem(_BEST_TIMES_KEY) || "{}");
    const t = stored[puzzleName];
    return typeof t === "number" ? t : null;
  } catch {
    return null;
  }
}

/**
 * Save a solve time if it is better than the current best.
 * Returns true when a new best is recorded.
 *
 * @param {string} puzzleName
 * @param {number} seconds
 * @returns {boolean}
 */
function saveBestTime(puzzleName, seconds) {
  try {
    const stored = JSON.parse(localStorage.getItem(_BEST_TIMES_KEY) || "{}");
    if (stored[puzzleName] === undefined || seconds < stored[puzzleName]) {
      stored[puzzleName] = seconds;
      localStorage.setItem(_BEST_TIMES_KEY, JSON.stringify(stored));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Return a display string for the best time: "M:SS" or "Unsolved".
 *
 * @param {string} puzzleName
 * @returns {string}
 */
function formatBestTime(puzzleName) {
  const t = getBestTime(puzzleName);
  if (t === null) return "Unsolved";
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const _SOLUTIONS_KEY = "nonogram-solutions";

/**
 * Cache the solution grid for a puzzle. Called once on first correct solve.
 *
 * @param {string} puzzleName
 * @param {boolean[][]} solution
 */
function saveSolution(puzzleName, solution) {
  try {
    const stored = JSON.parse(localStorage.getItem(_SOLUTIONS_KEY) || "{}");
    stored[puzzleName] = solution;
    localStorage.setItem(_SOLUTIONS_KEY, JSON.stringify(stored));
  } catch {
    // localStorage may be unavailable or full
  }
}

/**
 * Return the cached solution grid for a puzzle, or null if unsolved.
 *
 * @param {string} puzzleName
 * @returns {boolean[][]|null}
 */
function getSolution(puzzleName) {
  try {
    const stored = JSON.parse(localStorage.getItem(_SOLUTIONS_KEY) || "{}");
    return stored[puzzleName] || null;
  } catch {
    return null;
  }
}
