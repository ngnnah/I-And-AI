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
 * Transform a single pattern hex by an optional mirror then N 60° rotations,
 * preserving all non-coordinate fields (terrain, isPlacementHex, height, ...).
 */
function transformPatternHex(hex, rotations, mirror) {
  let { q, r } = hex;
  if (mirror) {
    ({ q, r } = mirrorHex(q, r));
  }
  for (let i = 0; i < rotations; i++) {
    ({ q, r } = rotateHex(q, r));
  }
  // Normalize negative zero (-0) that rotation/mirror math can produce,
  // so coordinates compare and stringify cleanly ("0", not "-0").
  return { ...hex, q: q + 0, r: r + 0 };
}

/**
 * Generate every distinct orientation of an animal habitat pattern.
 * Harmonies patterns match in any of 6 rotations and mirrored, so this
 * returns up to 12 unique orientations (symmetric patterns collapse).
 * Each orientation is a new array of hex objects with transformed {q, r}
 * and the original terrain / isPlacementHex / height fields intact.
 *
 * @param {Array<{q:number, r:number}>} pattern - Pattern hexes
 * @returns {Array<Array<Object>>} Unique orientations
 */
export function getPatternOrientations(pattern) {
  const seen = new Set();
  const orientations = [];

  for (const mirror of [false, true]) {
    for (let rot = 0; rot < 6; rot++) {
      const transformed = pattern.map((hex) => transformPatternHex(hex, rot, mirror));
      // Fingerprint by relative shape + per-hex requirements so symmetric
      // patterns (and mirror==rotation duplicates) are only kept once.
      const key = transformed
        .map((h) => `${h.q},${h.r}:${h.terrain}:${h.isPlacementHex ? 1 : 0}:${h.height ?? ""}`)
        .sort()
        .join("|");
      if (!seen.has(key)) {
        seen.add(key);
        orientations.push(transformed);
      }
    }
  }

  return orientations;
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

  // Harmonies player board: 5 columns, 5-4-5-4-5 = 23 hexes
  // Flat-topped hex axial coordinates, centered on (0,0)
  const boardLayout = {
    '-2': [-1, 0, 1, 2, 3],   // 5 hexes
    '-1': [-1, 0, 1, 2],      // 4 hexes
     '0': [-2, -1, 0, 1, 2],  // 5 hexes (center)
     '1': [-2, -1, 0, 1],     // 4 hexes
     '2': [-3, -2, -1, 0, 1], // 5 hexes
  };

  for (const [qStr, rValues] of Object.entries(boardLayout)) {
    const q = parseInt(qStr, 10);
    for (const r of rValues) {
      hexGrid[coordToKey(q, r)] = createHex(q, r);
    }
  }

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
