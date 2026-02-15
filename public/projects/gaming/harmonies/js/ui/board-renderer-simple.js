/**
 * Harmonies - Simple Board Renderer (CSS Hexagons)
 *
 * Simpler approach using CSS hexagons instead of SVG
 */

import { coordToKey, getNeighbors } from "../game/hex-grid.js";
import { COLOR_HEX } from "../data/tokens-config.js";

/**
 * Render hex grid using CSS hexagons
 * @param {Object} hexGrid - Grid of hexes { "q_r": hex, ... }
 * @param {Array} placedAnimals - Array of placed animal cubes
 */
export function renderHexGrid(hexGrid, placedAnimals = []) {
  const container = document.getElementById("hex-grid-container");
  if (!container) return;

  // Clear existing
  container.innerHTML = "";

  // Collect all hex positions (existing + expansion)
  const allHexes = new Map();

  // Add existing hexes
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    allHexes.set(key, { ...hex, exists: true });
  }

  // Add expansion hexes (neighbors of existing)
  for (const key in hexGrid) {
    const [q, r] = key.split("_").map(Number);
    const neighbors = getNeighbors(q, r);

    neighbors.forEach((n) => {
      const nKey = coordToKey(n.q, n.r);
      if (!allHexes.has(nKey)) {
        allHexes.set(nKey, {
          q: n.q,
          r: n.r,
          stack: [],
          terrain: "empty",
          exists: false, // Expansion hex
        });
      }
    });
  }

  // Render all hexes
  allHexes.forEach((hex, key) => {
    const hexEl = createHexElement(hex, key, placedAnimals);
    container.appendChild(hexEl);
  });
}

/**
 * Create a single hex element (CSS hexagon)
 * @param {Object} hex - Hex data
 * @param {string} hexKey - Hex key "q_r"
 * @param {Array} placedAnimals - Placed animals
 * @returns {HTMLElement}
 */
function createHexElement(hex, hexKey, placedAnimals) {
  const hexEl = document.createElement("div");
  hexEl.className = "hex-cell";
  hexEl.dataset.hexKey = hexKey;

  // Position using CSS Grid (axial to offset coordinates)
  const { q, r } = hex;
  const col = q;
  const row = r + Math.floor(q / 2);

  hexEl.style.gridColumn = col + 10; // Offset to allow negative coords
  hexEl.style.gridRow = row + 10;

  // Style based on type
  if (!hex.exists) {
    hexEl.classList.add("expansion");
  } else {
    hexEl.classList.add("terrain-" + hex.terrain);
  }

  // Render tokens stack
  if (hex.stack && hex.stack.length > 0) {
    hex.stack.forEach((token, index) => {
      const tokenEl = document.createElement("div");
      tokenEl.className = "token";
      tokenEl.style.backgroundColor = COLOR_HEX[token.color] || "#999";
      tokenEl.style.bottom = `${index * 8}px`; // Stack effect
      hexEl.appendChild(tokenEl);
    });
  }

  // Check for animal cube
  const hasAnimal = placedAnimals.some((animal) =>
    animal.hexCoords?.some((coord) => coordToKey(coord.q, coord.r) === hexKey)
  );

  if (hasAnimal) {
    const cubeEl = document.createElement("div");
    cubeEl.className = "animal-cube";
    cubeEl.textContent = "🦊";
    hexEl.appendChild(cubeEl);
  }

  // Coordinate label (for debugging)
  const label = document.createElement("div");
  label.className = "hex-label";
  label.textContent = `${q},${r}`;
  hexEl.appendChild(label);

  return hexEl;
}

/**
 * Highlight valid placement hexes
 * @param {Array} validHexKeys - Array of hex keys
 */
export function highlightValidHexes(validHexKeys) {
  clearHighlights();

  validHexKeys.forEach((key) => {
    const hexEl = document.querySelector(`[data-hex-key="${key}"]`);
    if (hexEl) {
      hexEl.classList.add("valid-placement");
    }
  });
}

/**
 * Clear all hex highlights
 */
export function clearHighlights() {
  const highlighted = document.querySelectorAll(".hex-cell.valid-placement");
  highlighted.forEach((el) => el.classList.remove("valid-placement"));
}

/**
 * Update score display
 * @param {number} newScore - New total score
 */
export function updateScoreDisplay(newScore) {
  const scoreEl = document.getElementById("current-score");
  if (!scoreEl) return;

  const oldScore = parseInt(scoreEl.textContent) || 0;

  if (newScore > oldScore) {
    scoreEl.classList.add("score-increase");
    setTimeout(() => {
      scoreEl.classList.remove("score-increase");
    }, 500);
  }

  scoreEl.textContent = newScore;
}

/**
 * Enable pinch-zoom (mobile)
 */
export function enablePinchZoom() {
  const container = document.getElementById("hex-grid-container");
  if (!container) return;

  let scale = 1;
  let lastDistance = 0;

  container.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }
  });

  container.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const delta = currentDistance - lastDistance;
      scale = Math.max(0.5, Math.min(2, scale + delta * 0.01));

      container.style.transform = `scale(${scale})`;
      lastDistance = currentDistance;
    }
  });
}
