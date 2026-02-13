/**
 * Pure game logic for Codenames — no side effects, fully testable
 */

import { getRandomWords } from '../data/word-lists.js';
import { getModeConfig } from '../data/game-modes.js';

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
 * Generate a board with cards and a secret color map
 * @param {string} startingTeam - "red" or "blue"
 * @param {string} [gameMode="words"] - "words", "pictures", or "diy"
 * @returns {{ words?: string[], cardIds?: number[], colorMap: string[] }}
 */
export function generateBoard(startingTeam, gameMode = 'words') {
  const config = getModeConfig(gameMode);
  const otherTeam = startingTeam === 'red' ? 'blue' : 'red';

  const colors = [
    ...Array(config.startingCount).fill(startingTeam),
    ...Array(config.otherCount).fill(otherTeam),
    ...Array(config.neutralCount).fill('neutral'),
    ...Array(config.assassinCount).fill('assassin')
  ];
  shuffleArray(colors);

  if (config.cardType === 'text') {
    return { words: getRandomWords(config.totalCards), colorMap: colors };
  }
  return { cardIds: getRandomCardIds(config.totalImages, config.totalCards), colorMap: colors };
}

/**
 * Pick N unique random card IDs from a pool of totalImages
 * @param {number} totalImages - Size of the image pool
 * @param {number} count - How many to pick
 * @returns {number[]} Array of unique card IDs (0-indexed)
 */
export function getRandomCardIds(totalImages, count) {
  const all = Array.from({ length: totalImages }, (_, i) => i);
  shuffleArray(all);
  return all.slice(0, count);
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
  if (typeof number !== 'number' || !Number.isInteger(number) || number < 0 || number > 9) {
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

  for (let i = 0; i < revealedCards.length; i++) {
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

/**
 * Generate 3 random inspiration words for spymasters
 * Excludes words that are on the board
 * @param {string[]} boardWords - Words currently on the board
 * @returns {string[]} Array of 3 inspiration words
 */
export function generateInspirationWords(boardWords) {
  const boardWordsUpper = boardWords.map(w => w.toUpperCase());
  const availableWords = getRandomWords(200).filter(w => !boardWordsUpper.includes(w));
  return availableWords.slice(0, 3);
}

/**
 * Calculate the current round number based on clue log
 * A round = both teams have given a clue
 * @param {Array} clueLog - Array of clue entries
 * @param {string} startingTeam - Team that went first ("red" or "blue")
 * @returns {number} Current round number (starts at 1)
 */
export function calculateRound(clueLog, startingTeam) {
  if (!clueLog || clueLog.length === 0) return 1;
  const logArray = Array.isArray(clueLog) ? clueLog : Object.values(clueLog);
  // Round = ceil(clues given / 2)
  return Math.ceil(logArray.length / 2);
}

/**
 * Get action prompt text for a player based on game state
 * @param {object} gameState - Current game state
 * @param {string} localPlayerTeam - Local player's team ("red" or "blue" or null)
 * @param {string} localPlayerRole - Local player's role ("spymaster" or "operative" or null)
 * @param {object} players - All players
 * @returns {string} Action prompt text
 */
export function getActionPrompt(gameState, localPlayerTeam, localPlayerRole, players) {
  if (!localPlayerTeam || !localPlayerRole) {
    return 'Waiting for game to start...';
  }

  const { currentTurn, phase } = gameState;
  const isMyTeamsTurn = currentTurn === localPlayerTeam;
  const isSpymaster = localPlayerRole === 'spymaster';

  if (isMyTeamsTurn) {
    if (phase === 'clue' && isSpymaster) {
      return '🎯 YOUR TURN! Give your team a clue (word + number)';
    }
    if (phase === 'guess' && !isSpymaster) {
      return '🎯 YOUR TURN! Guess cards or click Pass';
    }
    if (phase === 'clue' && !isSpymaster) {
      // Find spymaster name
      const spymaster = Object.values(players).find(
        p => p.team === localPlayerTeam && p.role === 'spymaster'
      );
      return `⏳ Waiting for ${spymaster?.name || 'spymaster'} to give a clue...`;
    }
    if (phase === 'guess' && isSpymaster) {
      return '⏳ Waiting for your operatives to guess...';
    }
  } else {
    const otherTeamName = currentTurn === 'red' ? 'Red' : 'Blue';
    return `⏳ ${otherTeamName} team is playing...`;
  }

  return '';
}
