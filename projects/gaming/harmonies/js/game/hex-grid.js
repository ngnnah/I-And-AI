// Hex grid coordinate system (Axial coordinates: q, r)
// Reference: https://www.redblobgames.com/grids/hexagons/

// Convert axial to string key for Firebase/object storage
export function coordToKey(q, r) {
  return `${q}_${r}`;
}

// Convert string key back to axial coordinates
export function keyToCoord(key) {
  const [q, r] = key.split('_').map(Number);
  return { q, r };
}

// Get all 6 neighbors of a hex (flat-topped orientation)
export function getNeighbors(q, r) {
  return [
    { q: q + 1, r: r },     // E
    { q: q - 1, r: r },     // W
    { q: q, r: r + 1 },     // SE
    { q: q, r: r - 1 },     // NW
    { q: q + 1, r: r - 1 }, // NE
    { q: q - 1, r: r + 1 }  // SW
  ];
}

// Calculate distance between two hexes
export function hexDistance(q1, r1, q2, r2) {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

// Convert axial to cube coordinates (for rotation)
export function axialToCube(q, r) {
  const s = -q - r;
  return { q, r, s };
}

// Convert cube back to axial
export function cubeToAxial(q, r, s) {
  return { q, r };
}

// Rotate hex coordinate by 60° increments (clockwise)
// steps: 0-5 (0 = no rotation, 1 = 60°, 2 = 120°, etc.)
export function rotateCoord(q, r, steps) {
  let cube = axialToCube(q, r);

  for (let i = 0; i < steps; i++) {
    // Rotate cube 60° clockwise: (q, r, s) → (-z, -x, -y) = (-s, -q, -r)
    const newCube = { q: -cube.s, r: -cube.q, s: -cube.r };
    cube = newCube;
  }

  return cubeToAxial(cube.q, cube.r, cube.s);
}

// Mirror coordinate across Q axis
export function mirrorCoord(q, r) {
  return { q, r: -q - r };
}

// Mirror and rotate
export function mirrorAndRotateCoord(q, r, steps) {
  const mirrored = mirrorCoord(q, r);
  return rotateCoord(mirrored.q, mirrored.r, steps);
}

// Get pixel position for SVG rendering (flat-topped hexes)
export function hexToPixel(q, r, size) {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x, y };
}

// Get hex points for SVG polygon (flat-topped)
export function getHexPoints(size) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    const x = size * Math.cos(angleRad);
    const y = size * Math.sin(angleRad);
    points.push([x, y]);
  }
  return points;
}

// Convert points array to SVG polygon string
export function pointsToString(points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

// Check if a hex coordinate exists in a set of hexes
export function hexExists(hexGrid, q, r) {
  const key = coordToKey(q, r);
  return hexGrid.hasOwnProperty(key);
}

// Get all hexes adjacent to existing hexes (expansion candidates)
export function getExpansionHexes(hexGrid) {
  const candidates = new Set();

  for (const key in hexGrid) {
    const { q, r } = keyToCoord(key);
    const neighbors = getNeighbors(q, r);

    for (const neighbor of neighbors) {
      const neighborKey = coordToKey(neighbor.q, neighbor.r);
      if (!hexGrid.hasOwnProperty(neighborKey)) {
        candidates.add(neighborKey);
      }
    }
  }

  return Array.from(candidates).map(keyToCoord);
}
