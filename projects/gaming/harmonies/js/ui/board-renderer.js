// SVG hex board renderer

import { coordToKey, keyToCoord, hexToPixel, getHexPoints, pointsToString, getExpansionHexes } from '../game/hex-grid.js';
import { COLOR_HEX, TERRAIN_TYPES } from '../data/tokens-config.js';

const HEX_SIZE = 30; // pixels
const TERRAIN_ICONS = {
  [TERRAIN_TYPES.TREE]: '🌲',
  [TERRAIN_TYPES.MOUNTAIN]: '⛰️',
  [TERRAIN_TYPES.FIELD]: '🌾',
  [TERRAIN_TYPES.WATER]: '💧',
  [TERRAIN_TYPES.BUILDING]: '🏠'
};

export function renderHexBoard(containerId, hexGrid, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  const {
    onHexClick = null,
    selectedToken = null,
    showExpansion = true,
    showTerrainIcons = true
  } = options;

  // Clear container
  container.innerHTML = '';

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'hex-board-svg');
  svg.setAttribute('viewBox', '-250 -250 500 500');

  // Get expansion hexes if needed
  const expansionHexes = showExpansion ? getExpansionHexes(hexGrid) : [];

  // Render expansion hexes (empty placeholders)
  for (const coord of expansionHexes) {
    const hexGroup = renderEmptyHex(coord.q, coord.r, selectedToken, onHexClick);
    svg.appendChild(hexGroup);
  }

  // Render existing hexes
  for (const key in hexGrid) {
    const { q, r } = keyToCoord(key);
    const hex = hexGrid[key];
    const hexGroup = renderOccupiedHex(q, r, hex, showTerrainIcons, onHexClick);
    svg.appendChild(hexGroup);
  }

  container.appendChild(svg);
}

function renderEmptyHex(q, r, selectedToken, onHexClick) {
  const { x, y } = hexToPixel(q, r, HEX_SIZE);
  const points = getHexPoints(HEX_SIZE - 2);
  const pointsStr = pointsToString(points);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${x}, ${y})`);
  g.setAttribute('class', 'hex-group empty');
  g.setAttribute('data-q', q);
  g.setAttribute('data-r', r);

  // Main hex body
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', pointsStr);
  polygon.setAttribute('fill', '#ffffff');
  polygon.setAttribute('stroke', '#cbd5e1');
  polygon.setAttribute('stroke-width', '2');
  polygon.setAttribute('class', 'hex-poly');

  // Center dot
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('r', '3');
  circle.setAttribute('fill', '#e2e8f0');

  g.appendChild(polygon);
  g.appendChild(circle);

  // Preview if token selected
  if (selectedToken) {
    const preview = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    preview.setAttribute('r', HEX_SIZE - 10);
    preview.setAttribute('fill', COLOR_HEX[selectedToken]);
    preview.setAttribute('fill-opacity', '0.3');
    preview.setAttribute('class', 'token-preview');
    g.appendChild(preview);
  }

  // Click handler
  if (onHexClick) {
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => onHexClick({ q, r }));
  }

  return g;
}

function renderOccupiedHex(q, r, hex, showTerrainIcons, onHexClick) {
  const { x, y } = hexToPixel(q, r, HEX_SIZE);
  const points = getHexPoints(HEX_SIZE - 2);
  const pointsStr = pointsToString(points);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${x}, ${y})`);
  g.setAttribute('class', 'hex-group occupied');
  g.setAttribute('data-q', q);
  g.setAttribute('data-r', r);

  // Main hex body
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', pointsStr);
  polygon.setAttribute('fill', hex.stack?.length > 0 ? '#f1f5f9' : '#ffffff');
  polygon.setAttribute('stroke', '#e2e8f0');
  polygon.setAttribute('stroke-width', '2');

  g.appendChild(polygon);

  // Render stacked tokens
  if (hex.stack && hex.stack.length > 0) {
    for (let i = 0; i < hex.stack.length; i++) {
      const token = hex.stack[i];
      const tokenGroup = renderToken(token.color, i);
      g.appendChild(tokenGroup);
    }
  }

  // Terrain icon
  if (showTerrainIcons && hex.terrain && TERRAIN_ICONS[hex.terrain]) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '6');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '18');
    text.textContent = TERRAIN_ICONS[hex.terrain];
    g.appendChild(text);
  }

  // Click handler
  if (onHexClick) {
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => onHexClick({ q, r }));
  }

  return g;
}

function renderToken(color, stackIndex) {
  const offset = stackIndex * 8; // Stack upward
  const radius = HEX_SIZE - 12 - stackIndex * 2; // Decreasing radius for 3D effect

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(0, -${offset})`);

  // Token circle
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('r', radius);
  circle.setAttribute('fill', COLOR_HEX[color]);
  circle.setAttribute('stroke', 'rgba(0,0,0,0.2)');
  circle.setAttribute('stroke-width', '1');

  // Shadow for depth
  const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttribute('cx', '0');
  ellipse.setAttribute('cy', radius * 0.4);
  ellipse.setAttribute('rx', radius * 0.8);
  ellipse.setAttribute('ry', radius * 0.2);
  ellipse.setAttribute('fill', 'rgba(0,0,0,0.1)');

  g.appendChild(ellipse);
  g.appendChild(circle);

  return g;
}

// Render central token grid (3x3)
export function renderCentralTokenGrid(containerId, tokens, onTokenClick) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'central-token-grid';

  for (let i = 0; i < 9; i++) {
    const tokenDiv = document.createElement('div');
    tokenDiv.className = 'central-token';

    if (tokens[i]) {
      tokenDiv.style.backgroundColor = COLOR_HEX[tokens[i].color];
      tokenDiv.dataset.index = i;
      tokenDiv.dataset.color = tokens[i].color;

      if (onTokenClick) {
        tokenDiv.addEventListener('click', () => onTokenClick(i, tokens[i].color));
      }
    } else {
      tokenDiv.classList.add('empty');
    }

    grid.appendChild(tokenDiv);
  }

  container.appendChild(grid);
}

// Render animal cards
export function renderAnimalCards(containerId, cardIds, animalCardData, onCardClick) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  for (const cardId of cardIds) {
    const card = animalCardData.find(c => c.id === cardId);
    if (!card) continue;

    const cardDiv = document.createElement('div');
    cardDiv.className = 'animal-card';
    cardDiv.dataset.cardId = cardId;

    cardDiv.innerHTML = `
      <div class="animal-icon">${card.icon}</div>
      <div class="animal-name">${card.name}</div>
      <div class="animal-points">${card.pointsPerPlacement[0]} pts</div>
    `;

    if (onCardClick) {
      cardDiv.addEventListener('click', () => onCardClick(cardId, card));
    }

    container.appendChild(cardDiv);
  }
}
