/**
 * Harmonies - Board Renderer (SVG Hex Grid)
 *
 * Renders hexagonal grid with tokens using SVG
 * Mobile-optimized with touch targets and pinch-zoom support
 */

import { axialToPixel, getHexCorners, getNeighbors, coordToKey } from "../game/hex-grid.js";
import { COLOR_HEX } from "../data/tokens-config.js";

// Constants
const HEX_SIZE = 50; // Distance from center to corner (pixels)
const HEX_SPACING = 10; // Gap between hexes
const TOKEN_SIZE = 30; // Token diameter
const GRID_PADDING = 100; // Padding around grid

let currentHighlightedHexes = [];

/**
 * Render entire hex grid
 * @param {Object} hexGrid - Grid of hexes { "q_r": hex, ... }
 * @param {Array} placedAnimals - Array of placed animal cubes
 */
export function renderHexGrid(hexGrid, placedAnimals = []) {
  const svg = document.getElementById("hex-grid-svg");
  if (!svg) return;

  // Clear existing grid
  const existingHexes = svg.querySelectorAll(".hex-group");
  existingHexes.forEach((el) => el.remove());

  // Calculate grid bounds
  const hexKeys = Object.keys(hexGrid);
  if (hexKeys.length === 0) return;

  const coords = hexKeys.map((key) => {
    const [q, r] = key.split("_").map(Number);
    return { q, r };
  });

  const minQ = Math.min(...coords.map((c) => c.q));
  const maxQ = Math.max(...coords.map((c) => c.q));
  const minR = Math.min(...coords.map((c) => c.r));
  const maxR = Math.max(...coords.map((c) => c.r));

  // Calculate SVG viewBox
  const topLeftPixel = axialToPixel(minQ - 1, minR - 1, HEX_SIZE);
  const bottomRightPixel = axialToPixel(maxQ + 1, maxR + 1, HEX_SIZE);

  const viewBoxWidth = bottomRightPixel.x - topLeftPixel.x + GRID_PADDING * 2;
  const viewBoxHeight = bottomRightPixel.y - topLeftPixel.y + GRID_PADDING * 2;

  svg.setAttribute(
    "viewBox",
    `${topLeftPixel.x - GRID_PADDING} ${topLeftPixel.y - GRID_PADDING} ${viewBoxWidth} ${viewBoxHeight}`
  );

  // Render each hex
  for (const key in hexGrid) {
    const hex = hexGrid[key];
    renderHex(svg, hex, placedAnimals);
  }

  // Render potential expansion hexes (neighbors of existing hexes)
  renderExpansionHexes(svg, hexGrid);
}

/**
 * Render a single hex
 * @param {SVGElement} svg - SVG container
 * @param {Object} hex - Hex object with q, r, stack, terrain
 * @param {Array} placedAnimals - Array of placed animal cubes
 */
function renderHex(svg, hex, placedAnimals) {
  const { q, r } = hex;
  const hexKey = coordToKey(q, r);
  const { x, y } = axialToPixel(q, r, HEX_SIZE);

  // Create group for hex + tokens
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.classList.add("hex-group");
  group.dataset.hexKey = hexKey;
  group.setAttribute("transform", `translate(${x}, ${y})`);

  // Hex background
  const hexShape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  hexShape.setAttribute("points", getHexCorners(0, 0, HEX_SIZE));
  hexShape.classList.add("hex");
  hexShape.dataset.hexKey = hexKey;

  // Color by terrain
  const terrainColors = {
    empty: "#f9f9f9",
    water: "#E3F2FD",
    field: "#FFF9C4",
    tree: "#C8E6C9",
    trunk: "#D7CCC8",
    mountain: "#CFD8DC",
    rock: "#E0E0E0",
    building: "#FFCCBC",
  };
  hexShape.setAttribute("fill", terrainColors[hex.terrain] || "#f9f9f9");
  hexShape.setAttribute("stroke", "#ddd");
  hexShape.setAttribute("stroke-width", "2");

  group.appendChild(hexShape);

  // Render token stack
  const stack = hex.stack || [];
  stack.forEach((token, index) => {
    const tokenEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    tokenEl.setAttribute("cx", 0);
    tokenEl.setAttribute("cy", -index * 5); // Slight offset for stacking effect
    tokenEl.setAttribute("r", TOKEN_SIZE / 2);
    tokenEl.setAttribute("fill", COLOR_HEX[token.color] || "#999");
    tokenEl.setAttribute("stroke", "rgba(0, 0, 0, 0.2)");
    tokenEl.setAttribute("stroke-width", "2");
    tokenEl.classList.add("token", token.color);

    group.appendChild(tokenEl);
  });

  // Check if hex has animal cube
  const hasAnimal = placedAnimals.some((animal) =>
    animal.hexCoords?.some((coord) => coordToKey(coord.q, coord.r) === hexKey)
  );

  if (hasAnimal) {
    const cubeEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    cubeEl.setAttribute("x", -12);
    cubeEl.setAttribute("y", -12);
    cubeEl.setAttribute("width", 24);
    cubeEl.setAttribute("height", 24);
    cubeEl.setAttribute("fill", "#8B4513");
    cubeEl.setAttribute("stroke", "#000");
    cubeEl.setAttribute("stroke-width", "2");
    cubeEl.setAttribute("rx", "3");
    cubeEl.classList.add("animal-cube");

    group.appendChild(cubeEl);
  }

  // Coordinate label (for debugging)
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", 0);
  label.setAttribute("y", HEX_SIZE / 2 + 5);
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("font-size", "10");
  label.setAttribute("fill", "#999");
  label.textContent = `${q},${r}`;
  label.classList.add("hex-label");

  group.appendChild(label);

  svg.appendChild(group);
}

/**
 * Render expansion hexes (empty neighbors for potential placement)
 * @param {SVGElement} svg - SVG container
 * @param {Object} hexGrid - Existing hex grid
 */
function renderExpansionHexes(svg, hexGrid) {
  const expansionHexes = new Set();

  // Find all neighbors of existing hexes
  for (const key in hexGrid) {
    const [q, r] = key.split("_").map(Number);
    const neighbors = getNeighbors(q, r);

    neighbors.forEach((n) => {
      const nKey = coordToKey(n.q, n.r);
      if (!hexGrid[nKey]) {
        expansionHexes.add(nKey);
      }
    });
  }

  // Render expansion hexes as ghosted outlines
  expansionHexes.forEach((key) => {
    const [q, r] = key.split("_").map(Number);
    const { x, y } = axialToPixel(q, r, HEX_SIZE);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("hex-group", "expansion");
    group.dataset.hexKey = key;
    group.setAttribute("transform", `translate(${x}, ${y})`);

    const hexShape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    hexShape.setAttribute("points", getHexCorners(0, 0, HEX_SIZE));
    hexShape.classList.add("hex", "expansion-hex");
    hexShape.dataset.hexKey = key;
    hexShape.setAttribute("fill", "none");
    hexShape.setAttribute("stroke", "#ddd");
    hexShape.setAttribute("stroke-width", "1");
    hexShape.setAttribute("stroke-dasharray", "5,5");
    hexShape.setAttribute("opacity", "0.5");

    group.appendChild(hexShape);
    svg.appendChild(group);
  });
}

/**
 * Highlight valid placement hexes
 * @param {Array} validHexKeys - Array of hex keys ["q_r", ...]
 */
export function highlightValidHexes(validHexKeys) {
  clearHighlights();
  currentHighlightedHexes = validHexKeys;

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
  const highlighted = document.querySelectorAll(".hex.valid-placement");
  highlighted.forEach((el) => el.classList.remove("valid-placement"));
  currentHighlightedHexes = [];
}

/**
 * Add invalid placement styling to a hex
 * @param {string} hexKey - Hex key "q_r"
 */
export function markHexInvalid(hexKey) {
  const hexEl = document.querySelector(`[data-hex-key="${key}"]`);
  if (hexEl) {
    hexEl.classList.add("invalid-placement");
    setTimeout(() => {
      hexEl.classList.remove("invalid-placement");
    }, 500);
  }
}

/**
 * Animate token placement
 * @param {string} hexKey - Hex key "q_r"
 * @param {string} tokenColor - Token color
 */
export function animateTokenPlacement(hexKey, tokenColor) {
  const hexEl = document.querySelector(`[data-hex-key="${hexKey}"]`);
  if (!hexEl) return;

  // Add placement animation class
  hexEl.classList.add("token-placing");
  setTimeout(() => {
    hexEl.classList.remove("token-placing");
  }, 300);
}

/**
 * Update score display with animation
 * @param {number} newScore - New total score
 */
export function updateScoreDisplay(newScore) {
  const scoreEl = document.getElementById("current-score");
  if (!scoreEl) return;

  const oldScore = parseInt(scoreEl.textContent) || 0;

  // Animate score change
  if (newScore > oldScore) {
    scoreEl.classList.add("score-increase");
    setTimeout(() => {
      scoreEl.classList.remove("score-increase");
    }, 500);
  }

  scoreEl.textContent = newScore;
}

/**
 * Show tutorial overlay for first-time users
 * @param {string} step - Tutorial step identifier
 */
export function showTutorialOverlay(step) {
  // TODO: Implement BGA-style tutorial overlay (Phase 3)
  console.log("Tutorial step:", step);
}

/**
 * Enable pinch-zoom on hex grid (mobile)
 */
export function enablePinchZoom() {
  const svg = document.getElementById("hex-grid-svg");
  if (!svg) return;

  let scale = 1;
  let lastDistance = 0;

  svg.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }
  });

  svg.addEventListener("touchmove", (e) => {
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

      svg.style.transform = `scale(${scale})`;
      lastDistance = currentDistance;
    }
  });
}
