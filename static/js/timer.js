/**
 * timer.js — Puzzle solve timer.
 *
 * Exports:
 *   startTimer() -> void
 *   stopTimer()  -> number  (elapsed seconds)
 *   formatTime(seconds) -> string  (e.g. "1:05")
 */

"use strict";

let _timerSeconds = 0;
let _timerInterval = null;

/**
 * Format a seconds count as M:SS.
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Reset and start the timer. Updates #puzzle-timer every second.
 */
function startTimer() {
  _timerSeconds = 0;
  clearInterval(_timerInterval);
  const display = document.getElementById("puzzle-timer");
  if (display) display.textContent = formatTime(0);
  _timerInterval = setInterval(() => {
    _timerSeconds++;
    if (display) display.textContent = formatTime(_timerSeconds);
  }, 1000);
}

/**
 * Stop the timer and return the elapsed seconds.
 *
 * @returns {number}
 */
function stopTimer() {
  clearInterval(_timerInterval);
  _timerInterval = null;
  return _timerSeconds;
}
