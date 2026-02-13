// Core game logic for Ito
import { THEME_PACKS } from '../data/themes.js';

/**
 * Pick N unique random themes from the pool (no repeats within a game session)
 * @param {number} count - How many themes to pick
 * @param {string[]} usedThemeIds - Already used theme IDs to exclude
 * @returns {object[]} Array of theme objects
 */
export function pickThemes(count, usedThemeIds = []) {
  const usedSet = new Set(usedThemeIds);
  const available = THEME_PACKS.all.filter(t => !usedSet.has(t.id));

  // Shuffle available themes using Fisher-Yates
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * Deal secret numbers to players
 * Each player gets a unique random number in [1, rangeMax]
 * @param {string[]} playerIds - Array of player IDs
 * @param {number} rangeMax - Max number (10 for kids, 100 for adults)
 * @returns {object} { [playerId]: number }
 */
export function dealNumbers(playerIds, rangeMax) {
  // Build pool of all numbers [1, rangeMax]
  const pool = [];
  for (let i = 1; i <= rangeMax; i++) {
    pool.push(i);
  }

  // Shuffle pool using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Assign one number per player
  const hands = {};
  playerIds.forEach((id, index) => {
    hands[id] = pool[index];
  });

  return hands;
}

/**
 * Check if the placed order is correct (ascending by their secret numbers)
 * @param {string[]} placedOrder - Array of playerIds in placed order
 * @param {object} hands - { [playerId]: number }
 * @returns {{ correct: boolean, firstErrorIndex: number|null }}
 */
export function checkOrder(placedOrder, hands) {
  for (let i = 1; i < placedOrder.length; i++) {
    if (hands[placedOrder[i]] < hands[placedOrder[i - 1]]) {
      return { correct: false, firstErrorIndex: i };
    }
  }
  return { correct: true, firstErrorIndex: null };
}

/**
 * Get difficulty presets
 * @param {string} difficulty - 'kids' or 'adults'
 * @returns {{ rangeMax: number, roundsTotal: number, label: string }}
 */
export function getDifficultyPreset(difficulty) {
  const presets = {
    kids: { rangeMax: 10, roundsTotal: 8, label: 'Kids (1-10)' },
    adults: { rangeMax: 100, roundsTotal: 10, label: 'Adults (1-100)' },
  };
  return presets[difficulty] || presets.kids;
}
