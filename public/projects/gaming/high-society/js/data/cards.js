/**
 * High Society — Status Card Definitions
 *
 * 16 cards total:
 *   - 10 luxury cards (values 1–10, white border)
 *   - 3 prestige cards (x2 multiplier, red border)
 *   - 3 disgrace cards (negative effects, red border)
 *
 * IMPORTANT: This file is in js/data/ which is globally gitignored.
 * Always force-add: git add -f js/data/cards.js
 */

export const STATUS_CARDS = [
  // --- Luxury Cards (white border) ---
  { id: 0,  type: 'luxury',   value: 1,  name: 'Perfume',         emoji: '🌸', effect: null },
  { id: 1,  type: 'luxury',   value: 2,  name: 'Champagne',       emoji: '🥂', effect: null },
  { id: 2,  type: 'luxury',   value: 3,  name: 'Haute Cuisine',   emoji: '🍽', effect: null },
  { id: 3,  type: 'luxury',   value: 4,  name: 'Casino',          emoji: '🎲', effect: null },
  { id: 4,  type: 'luxury',   value: 5,  name: 'Fine Clothes',    emoji: '👗', effect: null },
  { id: 5,  type: 'luxury',   value: 6,  name: 'Holidays',        emoji: '🏖', effect: null },
  { id: 6,  type: 'luxury',   value: 7,  name: 'Art Collection',  emoji: '🖼', effect: null },
  { id: 7,  type: 'luxury',   value: 8,  name: 'Jewelry',         emoji: '💎', effect: null },
  { id: 8,  type: 'luxury',   value: 9,  name: 'Thoroughbred',    emoji: '🐴', effect: null },
  { id: 9,  type: 'luxury',   value: 10, name: 'Country Estate',  emoji: '🏰', effect: null },

  // --- Prestige Cards (red border, x2 multiplier) ---
  { id: 10, type: 'prestige', value: 0,  name: 'Promotion to Peerage', emoji: '👑', effect: 'x2' },
  { id: 11, type: 'prestige', value: 0,  name: 'Promotion to Peerage', emoji: '👑', effect: 'x2' },
  { id: 12, type: 'prestige', value: 0,  name: 'Promotion to Peerage', emoji: '👑', effect: 'x2' },

  // --- Disgrace Cards (red border, negative effects) ---
  { id: 13, type: 'disgrace', subtype: 'thief',    value: 0, name: 'Thief',    emoji: '🦹', effect: 'Discard one luxury card (deferred if none owned)' },
  { id: 14, type: 'disgrace', subtype: 'scandale', value: 0, name: 'Scandale', emoji: '📰', effect: 'Halve your final score' },
  { id: 15, type: 'disgrace', subtype: 'passee',   value: 0, name: 'Passée',   emoji: '👎', effect: '-5 to final score' },
];

/** Money denominations each player starts with (11 cards, total = 106) */
export const MONEY_DENOMINATIONS = [1, 2, 3, 4, 6, 8, 10, 12, 15, 20, 25];

/** Player color names (assigned in join order, max 5 players) */
export const PLAYER_COLORS = ['crimson', 'navy', 'forest', 'gold', 'violet'];

/**
 * Returns true if the card has a red border (prestige or disgrace).
 * The game ends when the 4th red card is revealed.
 * @param {object} card
 * @returns {boolean}
 */
export function isRedCard(card) {
  return card.type === 'prestige' || card.type === 'disgrace';
}

/**
 * Get auction type for a card.
 * @param {object} card
 * @returns {'luxury' | 'disgrace'}
 */
export function getAuctionType(card) {
  return card.type === 'disgrace' ? 'disgrace' : 'luxury';
}
