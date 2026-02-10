/**
 * Pure game logic for Codenames — no side effects, fully testable
 */

import { getRandomWords } from '../data/word-lists.js';

/**
 * Fisher-Yates shuffle (in-place)
 * @param {any[]} arr
 * @returns {any[]} The same array, shuffled
 */
export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a 5x5 board with words and a secret color map
 * @param {string} startingTeam - "red" or "blue"
 * @returns {{ words: string[], colorMap: string[] }}
 */
export function generateBoard(startingTeam) {
  const words = getRandomWords(25);

  // Starting team gets 9 cards, other gets 8, 7 neutral, 1 assassin
  const startingCount = 9;
  const otherCount = 8;
  const neutralCount = 7;
  const otherTeam = startingTeam === 'red' ? 'blue' : 'red';

  const colors = [
    ...Array(startingCount).fill(startingTeam),
    ...Array(otherCount).fill(otherTeam),
    ...Array(neutralCount).fill('neutral'),
    'assassin'
  ];
  shuffleArray(colors);

  return { words, colorMap: colors };
}

/**
 * Validate a player name
 * @param {string} name
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePlayerName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { valid: false, error: 'Name cannot be empty' };
  if (trimmed.length > 20) return { valid: false, error: 'Name must be 20 characters or less' };
  return { valid: true, error: null };
}

/**
 * Validate a spymaster's clue
 * @param {string} word - The clue word
 * @param {number} number - The clue number
 * @param {string[]} boardWords - The 25 words on the board
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateClue(word, number, boardWords) {
  const trimmed = (word || '').trim().toUpperCase();
  if (!trimmed) return { valid: false, error: 'Clue cannot be empty' };
  if (/\s/.test(trimmed)) return { valid: false, error: 'Clue must be a single word' };
  if (boardWords.map(w => w.toUpperCase()).includes(trimmed)) {
    return { valid: false, error: 'Clue cannot be a word on the board' };
  }
  if (typeof number !== 'number' || number < 0 || number > 9) {
    return { valid: false, error: 'Number must be between 0 and 9' };
  }
  return { valid: true, error: null };
}

/**
 * Check the result of guessing a card
 * @param {number} cardIndex - Index of the guessed card (0-24)
 * @param {string[]} colorMap - The secret color assignments
 * @param {string} currentTeam - The team that is guessing ("red" or "blue")
 * @returns {{ result: string, color: string }}
 */
export function checkGuessResult(cardIndex, colorMap, currentTeam) {
  const color = colorMap[cardIndex];
  if (color === currentTeam) return { result: 'correct', color };
  if (color === 'assassin') return { result: 'assassin', color };
  if (color === 'neutral') return { result: 'neutral', color };
  return { result: 'opponent', color };
}

/**
 * Check if the game is over
 * @param {boolean[]} revealedCards - Which cards are revealed
 * @param {string[]} colorMap - Secret color assignments
 * @param {number} redTotal - Total red cards
 * @param {number} blueTotal - Total blue cards
 * @returns {{ isOver: boolean, winner: string|null, reason: string|null }}
 */
export function checkWinCondition(revealedCards, colorMap, redTotal, blueTotal) {
  let redRevealed = 0;
  let blueRevealed = 0;

  for (let i = 0; i < 25; i++) {
    if (revealedCards[i]) {
      if (colorMap[i] === 'red') redRevealed++;
      else if (colorMap[i] === 'blue') blueRevealed++;
    }
  }

  if (redRevealed >= redTotal) return { isOver: true, winner: 'red', reason: 'all_revealed' };
  if (blueRevealed >= blueTotal) return { isOver: true, winner: 'blue', reason: 'all_revealed' };
  return { isOver: false, winner: null, reason: null };
}

/**
 * Validate team configuration for starting a game
 * @param {object} players - Players object from Firebase { playerId: { name, team, role, isActive } }
 * @returns {{ canStart: boolean, errors: string[] }}
 */
export function canStartGame(players) {
  const errors = [];
  const active = Object.values(players).filter(p => p.isActive);
  const redPlayers = active.filter(p => p.team === 'red');
  const bluePlayers = active.filter(p => p.team === 'blue');

  if (redPlayers.length === 0) errors.push('Red team needs at least 1 player');
  if (bluePlayers.length === 0) errors.push('Blue team needs at least 1 player');

  const redSpymasters = redPlayers.filter(p => p.role === 'spymaster');
  const blueSpymasters = bluePlayers.filter(p => p.role === 'spymaster');

  if (redPlayers.length > 0 && redSpymasters.length !== 1) {
    errors.push('Red team needs exactly 1 spymaster');
  }
  if (bluePlayers.length > 0 && blueSpymasters.length !== 1) {
    errors.push('Blue team needs exactly 1 spymaster');
  }

  return { canStart: errors.length === 0, errors };
}

/**
 * Get active players on a specific team
 * @param {object} players - Players object
 * @param {string} team - "red" or "blue"
 * @returns {Array<{ id: string, name: string, role: string }>}
 */
export function getTeamPlayers(players, team) {
  return Object.entries(players)
    .filter(([, p]) => p.isActive && p.team === team)
    .map(([id, p]) => ({ id, name: p.name, role: p.role }));
}

/**
 * Calculate how many guesses are allowed for a clue number
 * @param {number} clueNumber - The number given with the clue (0-9)
 * @returns {number} Max guesses allowed (clueNumber + 1, or Infinity for 0)
 */
export function calculateGuessesAllowed(clueNumber) {
  if (clueNumber === 0) return Infinity;
  return clueNumber + 1;
}
