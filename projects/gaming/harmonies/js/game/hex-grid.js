/**
 * Harmonies - Hex Grid Utilities
 *
 * Axial coordinate system for flat-topped hexagons
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

/**
 * Convert hex key "q_r" to coordinates {q, r}
 */
export function keyToCoord(key) {
  const [q, r] = key.split("_").map(Number);
  return { q, r };
}

/**
 * Convert coordinates to key "q_r"
 */
export function coordToKey(q, r) {
  return `${q}_${r}`;
}

/**
 * Get 6 neighboring hex coordinates (flat-topped hexes, axial coordinates)
 * East, West, Southeast, Northwest, Northeast, Southwest
 */
export function getNeighbors(q, r) {
  return [
    { q: q + 1, r: r },     // East
    { q: q - 1, r: r },     // West
    { q: q, r: r + 1 },     // Southeast
    { q: q, r: r - 1 },     // Northwest
    { q: q + 1, r: r - 1 }, // Northeast
    { q: q - 1, r: r + 1 }, // Southwest
  ];
}

/**
 * Calculate distance between two hexes
 */
export function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

/**
 * Convert axial coordinates to pixel coordinates (for SVG rendering)
 * @param {number} q - Axial q coordinate
 * @param {number} r - Axial r coordinate
 * @param {number} size - Hex size (distance from center to corner)
 * @returns {Object} {x, y} pixel coordinates
 */
export function axialToPixel(q, r, size) {
  const x = size * (3 / 2 * q);
  const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x, y };
}

/**
 * Convert pixel coordinates to axial coordinates
 * @param {number} x - Pixel x
 * @param {number} y - Pixel y
 * @param {number} size - Hex size
 * @returns {Object} {q, r} axial coordinates (rounded)
 */
export function pixelToAxial(x, y, size) {
  const q = (2 / 3 * x) / size;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
  return axialRound(q, r);
}

/**
 * Round fractional axial coordinates to nearest hex
 */
export function axialRound(q, r) {
  return cubeToAxial(cubeRound(axialToCube(q, r)));
}

/**
 * Convert axial to cube coordinates
 */
export function axialToCube(q, r) {
  const x = q;
  const z = r;
  const y = -x - z;
  return { x, y, z };
}

/**
 * Convert cube to axial coordinates
 */
export function cubeToAxial(cube) {
  const q = cube.x;
  const r = cube.z;
  return { q, r };
}

/**
 * Round cube coordinates to nearest integer cube
 */
export function cubeRound(cube) {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);

  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { x: rx, y: ry, z: rz };
}

/**
 * Rotate hex coordinates 60 degrees clockwise around origin
 */
export function rotateHex(q, r) {
  const cube = axialToCube(q, r);
  // Rotate cube: (x, y, z) -> (-z, -x, -y)
  const rotated = { x: -cube.z, y: -cube.x, z: -cube.y };
  return cubeToAxial(rotated);
}

/**
 * Get all rotations of a hex coordinate (6 orientations)
 */
export function getAllRotations(q, r) {
  const rotations = [{ q, r }];
  let current = { q, r };

  for (let i = 0; i < 5; i++) {
    current = rotateHex(current.q, current.r);
    rotations.push(current);
  }

  return rotations;
}

/**
 * Mirror hex coordinates horizontally (flip across vertical axis)
 */
export function mirrorHex(q, r) {
  return { q: -q - r, r: r };
}

/**
 * Create an empty hex object
 */
export function createHex(q, r) {
  return {
    q,
    r,
    stack: [],
    terrain: "empty",
  };
}

/**
 * Initialize a hex grid with starting hexes
 * Personal board starts with just the center hex
 */
export function initializePersonalBoard() {
  const hexGrid = {};

  // Start with center hex (0, 0)
  hexGrid[coordToKey(0, 0)] = createHex(0, 0);

  return hexGrid;
}

/**
 * Get all hexes within a certain range of origin
 */
export function getHexesInRange(centerQ, centerR, range) {
  const hexes = [];

  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      hexes.push({ q: centerQ + q, r: centerR + r });
    }
  }

  return hexes;
}

/**
 * Get hex corners for SVG polygon rendering
 * @param {number} centerX - Center X pixel position
 * @param {number} centerY - Center Y pixel position
 * @param {number} size - Hex size (distance from center to corner)
 * @returns {string} SVG points string
 */
export function getHexCorners(centerX, centerY, size) {
  const points = [];

  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = centerX + size * Math.cos(angleRad);
    const y = centerY + size * Math.sin(angleRad);
    points.push(`${x},${y}`);
  }

  return points.join(" ");
}
