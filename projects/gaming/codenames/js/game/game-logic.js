/**
 * Pure game logic for Codenames — no side effects, fully testable
 */

import { getRandomWords, WORD_LIST } from '../data/word-lists.js';
import { getModeConfig } from '../data/game-modes.js';
import { getRandomPictureClues } from '../data/picture-clues.js';

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
 * Generate a Duet mode board (cooperative 2-player)
 * Each player sees a different color map with overlapping green agents
 * @param {string} gameMode - Should be 'duet'
 * @returns {{ cardIds: number[], colorMapP1: string[], colorMapP2: string[], revealed: boolean[] }}
 */
export function generateDuetBoard(gameMode = 'duet') {
  const config = getModeConfig(gameMode);
  
  // Generate 15 unique positions for green agents
  const totalCards = config.totalCards;
  const greenPositions = new Set();
  while (greenPositions.size < config.greenCount) {
    greenPositions.add(Math.floor(Math.random() * totalCards));
  }
  const greenArray = Array.from(greenPositions);
  
  // Split green agents: Player 1 sees 9, Player 2 sees 9, with 3 overlapping
  // This creates the "shared key card" mechanic:
  // - P1 only: 6 greens (indices 0-5)
  // - Shared: 3 greens (indices 6-8) — both players see these
  // - P2 only: 6 greens (indices 9-14)
  // Total: 15 unique green cards
  const p1Green = greenArray.slice(0, 9); // indices 0-8
  const p2Green = greenArray.slice(6, 15); // indices 6-14 (overlap at 6,7,8)
  
  // Place assassins - each player has DIFFERENT assassins (like two-sided key card)
  const remainingPositions = [];
  for (let i = 0; i < totalCards; i++) {
    if (!greenPositions.has(i)) remainingPositions.push(i);
  }
  shuffleArray(remainingPositions);
  
  // P1 gets first 3 assassins, P2 gets next 3 assassins (can overlap for difficulty)
  const p1Assassins = remainingPositions.slice(0, config.assassinCount);
  const p2Assassins = remainingPositions.slice(config.assassinCount, config.assassinCount * 2);
  
  // Build color maps
  const colorMapP1 = Array(totalCards).fill('neutral');
  const colorMapP2 = Array(totalCards).fill('neutral');
  
  p1Green.forEach(idx => { colorMapP1[idx] = 'green'; });
  p2Green.forEach(idx => { colorMapP2[idx] = 'green'; });
  p1Assassins.forEach(idx => { colorMapP1[idx] = 'assassin'; });
  p2Assassins.forEach(idx => { colorMapP2[idx] = 'assassin'; });
  
  return {
    cardIds: getRandomCardIds(config.totalImages, totalCards),
    colorMapP1,
    colorMapP2,
    revealed: Array(totalCards).fill(false),
  };
}

/**
 * Check if Duet mode game is over
 * @param {boolean[]} revealedCards - Which cards are revealed
 * @param {string[]} colorMapP1 - Player 1's color map
 * @param {string[]} colorMapP2 - Player 2's color map
 * @param {number} turnCount - Number of turns taken
 * @param {number} mistakeCount - Number of mistakes made
 * @param {number} maxTurns - Maximum turns allowed
 * @param {number} maxMistakes - Maximum mistakes allowed
 * @returns {{ isOver: boolean, winner: string|null, reason: string|null }}
 */
export function checkDuetWinCondition(revealedCards, colorMapP1, colorMapP2, turnCount, mistakeCount, maxTurns, maxMistakes) {
  // Check for assassin hit
  for (let i = 0; i < revealedCards.length; i++) {
    if (revealedCards[i] && (colorMapP1[i] === 'assassin' || colorMapP2[i] === 'assassin')) {
      return { isOver: true, winner: null, reason: 'assassin' };
    }
  }
  
  // Check for turn limit
  if (turnCount >= maxTurns) {
    return { isOver: true, winner: null, reason: 'turns_exceeded' };
  }
  
  // Check for mistake limit
  if (mistakeCount >= maxMistakes) {
    return { isOver: true, winner: null, reason: 'mistakes_exceeded' };
  }
  
  // Check if all green agents found (from both perspectives)
  const allGreenPositions = new Set();
  for (let i = 0; i < colorMapP1.length; i++) {
    if (colorMapP1[i] === 'green' || colorMapP2[i] === 'green') {
      allGreenPositions.add(i);
    }
  }
  
  let greenRevealed = 0;
  for (const pos of allGreenPositions) {
    if (revealedCards[pos]) greenRevealed++;
  }
  
  if (greenRevealed >= allGreenPositions.size) {
    return { isOver: true, winner: 'coop', reason: 'all_revealed' };
  }
  
  return { isOver: false, winner: null, reason: null };
}

/**
 * Simplified Duet win condition check (used by firebase-sync)
 * @param {number} greenRevealed - Number of green cards revealed
 * @param {number} mistakesMade - Number of mistakes (neutral cards hit)
 * @param {number} turnsUsed - Number of turns used
 * @param {object} config - Game mode config with maxTurns, maxMistakes, greenCount
 * @returns {{ isOver: boolean, winner: string|null, reason: string|null }}
 */
export function checkDuetWinConditionSimple(greenRevealed, mistakesMade, turnsUsed, config) {
  // Win: all green cards revealed
  if (greenRevealed >= config.greenCount) {
    return { isOver: true, winner: 'win', reason: 'all-green' };
  }
  
  // Loss: too many mistakes
  if (mistakesMade > config.maxMistakes) {
    return { isOver: true, winner: 'loss', reason: 'too-many-mistakes' };
  }
  
  // Loss: ran out of turns
  if (turnsUsed > config.maxTurns) {
    return { isOver: true, winner: 'loss', reason: 'out-of-turns' };
  }
  
  // Game continues
  return { isOver: false, winner: null, reason: null };
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
 * For word mode: Excludes words that are on the board
 * For picture mode: Uses visual/conceptual clue words
 * @param {string[]} boardWords - Words currently on the board (empty for picture mode)
 * @param {string[]} excludeWords - Additional words to exclude (e.g., current inspiration)
 * @param {string} gameMode - Current game mode ('words', 'pictures', 'diy')
 * @returns {string[]} Array of 3 inspiration words
 */
export function generateInspirationWords(boardWords = [], excludeWords = [], gameMode = 'words') {
  const config = getModeConfig(gameMode);
  
  // For picture/DIY modes, use specialized visual clue words
  if (config.cardType === 'image') {
    return getRandomPictureClues(3);
  }
  
  // For word mode, exclude board words
  const boardWordsUpper = boardWords.map(w => w.toUpperCase());
  const excludeWordsUpper = excludeWords.map(w => w.toUpperCase());
  const allExcluded = [...new Set([...boardWordsUpper, ...excludeWordsUpper])];
  
  const availableWords = WORD_LIST.filter(w => !allExcluded.includes(w));
  
  // Shuffle available words
  const shuffled = [...availableWords];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, 3);
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
 * Returns concise status with player name and action
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
  const teamName = currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1);

  // Find the active player
  const activePlayer = Object.values(players).find(p => 
    p.team === currentTurn && 
    ((phase === 'clue' && p.role === 'spymaster') ||
     (phase === 'guess' && p.role === 'operative'))
  );
  const activeName = activePlayer?.name || 'Player';

  if (isMyTeamsTurn) {
    if (phase === 'clue' && isSpymaster) {
      return `🎯 YOUR TURN: Give a clue`;
    }
    if (phase === 'guess' && !isSpymaster) {
      return `🎯 YOUR TURN: Guess cards`;
    }
    if (phase === 'clue' && !isSpymaster) {
      return `${teamName} (${activeName}) is giving a clue...`;
    }
    if (phase === 'guess' && isSpymaster) {
      return `${teamName} operatives are guessing...`;
    }
  } else {
    const action = phase === 'clue' ? 'giving a clue' : 'guessing';
    return `${teamName} (${activeName}) is ${action}...`;
  }

  return '';
}
