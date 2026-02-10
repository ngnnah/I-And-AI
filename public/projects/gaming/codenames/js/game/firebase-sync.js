/**
 * Firebase sync handlers for Codenames
 * All functions that write to Firebase live here
 */

import { database, ref, get, update, set } from './firebase-config.js';
import { generateBoard, checkGuessResult, checkWinCondition } from './game-logic.js';
import { getLocalPlayer, getCurrentGame } from './game-state.js';

/**
 * Join a team/role
 * @param {string} gameId
 * @param {string} playerId
 * @param {string} team - "red" or "blue"
 * @param {string} role - "spymaster" or "operative"
 */
export async function handleTeamJoin(gameId, playerId, team, role) {
  await update(ref(database, `games/${gameId}/players/${playerId}`), {
    team,
    role
  });
}

/**
 * Start the game — generate board, set initial state
 * @param {string} gameId
 */
export async function handleStartGame(gameId) {
  const startingTeam = Math.random() < 0.5 ? 'red' : 'blue';
  const board = generateBoard(startingTeam);

  const updates = {
    status: 'playing',
    startingTeam,
    startedAt: Date.now(),
    'board/words': board.words,
    'board/colorMap': board.colorMap,
    'gameState/currentTurn': startingTeam,
    'gameState/phase': 'clue',
    'gameState/revealedCards': new Array(25).fill(false),
    'gameState/currentClue': null,
    'gameState/guessesRemaining': 0,
    'gameState/redRevealed': 0,
    'gameState/blueRevealed': 0,
    'gameState/redTotal': startingTeam === 'red' ? 9 : 8,
    'gameState/blueTotal': startingTeam === 'blue' ? 9 : 8,
    'gameState/winner': null,
    'gameState/winReason': null
  };

  await update(ref(database, `games/${gameId}`), updates);
}

/**
 * Give a clue — write clue, add to clueLog, switch to guess phase
 * @param {string} gameId
 * @param {string} word
 * @param {number} number
 * @param {string} spymasterName
 * @param {string} team
 */
export async function handleGiveClue(gameId, word, number, spymasterName, team) {
  // Get current clue log length to determine next index
  const snapshot = await get(ref(database, `games/${gameId}/clueLog`));
  const clueLog = snapshot.exists() ? snapshot.val() : [];
  const nextIndex = Array.isArray(clueLog) ? clueLog.length : Object.keys(clueLog || {}).length;

  const guessesRemaining = number === 0 ? 99 : number + 1; // 99 as "unlimited"

  const updates = {
    'gameState/currentClue': { word: word.toUpperCase(), number, givenBy: spymasterName },
    'gameState/phase': 'guess',
    'gameState/guessesRemaining': guessesRemaining,
    [`clueLog/${nextIndex}`]: {
      team,
      spymaster: spymasterName,
      word: word.toUpperCase(),
      number,
      guesses: []
    }
  };

  await update(ref(database, `games/${gameId}`), updates);
}

/**
 * Reveal a card — update board, append guess to clueLog, handle result
 * @param {string} gameId
 * @param {number} cardIndex
 * @param {string} playerName
 */
export async function handleCardReveal(gameId, cardIndex, playerName) {
  const snapshot = await get(ref(database, `games/${gameId}`));
  if (!snapshot.exists()) return;
  const game = snapshot.val();
  const gs = game.gameState;

  // Already revealed — skip
  if (gs.revealedCards[cardIndex]) return;

  const currentTeam = gs.currentTurn;
  const { result, color } = checkGuessResult(cardIndex, game.board.colorMap, currentTeam);

  // Update revealed cards and counters
  const newRevealed = [...gs.revealedCards];
  newRevealed[cardIndex] = true;

  let redRevealed = gs.redRevealed;
  let blueRevealed = gs.blueRevealed;
  if (color === 'red') redRevealed++;
  if (color === 'blue') blueRevealed++;

  // Append guess to current clue log entry
  const clueLog = game.clueLog || [];
  const logIndex = (Array.isArray(clueLog) ? clueLog.length : Object.keys(clueLog).length) - 1;
  const currentEntry = Array.isArray(clueLog) ? clueLog[logIndex] : clueLog[logIndex];
  const guesses = currentEntry?.guesses || [];
  const guessIndex = Array.isArray(guesses) ? guesses.length : Object.keys(guesses || {}).length;

  const updates = {
    'gameState/revealedCards': newRevealed,
    'gameState/redRevealed': redRevealed,
    'gameState/blueRevealed': blueRevealed,
    [`clueLog/${logIndex}/guesses/${guessIndex}`]: {
      cardIndex,
      word: game.board.words[cardIndex],
      result
    }
  };

  // Check for assassin (immediate loss)
  if (result === 'assassin') {
    const winner = currentTeam === 'red' ? 'blue' : 'red';
    updates['gameState/winner'] = winner;
    updates['gameState/winReason'] = 'assassin';
    updates['gameState/currentClue'] = null;
    updates['status'] = 'finished';
    updates['finishedAt'] = Date.now();
    await update(ref(database, `games/${gameId}`), updates);
    return;
  }

  // Check win condition
  const winCheck = checkWinCondition(newRevealed, game.board.colorMap, gs.redTotal, gs.blueTotal);
  if (winCheck.isOver) {
    updates['gameState/winner'] = winCheck.winner;
    updates['gameState/winReason'] = winCheck.reason;
    updates['gameState/currentClue'] = null;
    updates['status'] = 'finished';
    updates['finishedAt'] = Date.now();
    await update(ref(database, `games/${gameId}`), updates);
    return;
  }

  // Determine what happens next
  if (result === 'correct') {
    const remaining = gs.guessesRemaining - 1;
    if (remaining <= 0) {
      // Out of guesses — switch turn
      updates['gameState/currentTurn'] = currentTeam === 'red' ? 'blue' : 'red';
      updates['gameState/phase'] = 'clue';
      updates['gameState/currentClue'] = null;
      updates['gameState/guessesRemaining'] = 0;
    } else {
      updates['gameState/guessesRemaining'] = remaining;
    }
  } else {
    // Neutral or opponent — switch turn
    updates['gameState/currentTurn'] = currentTeam === 'red' ? 'blue' : 'red';
    updates['gameState/phase'] = 'clue';
    updates['gameState/currentClue'] = null;
    updates['gameState/guessesRemaining'] = 0;
  }

  await update(ref(database, `games/${gameId}`), updates);
}

/**
 * End guessing voluntarily — mark "passed" in clue log, switch turn
 * @param {string} gameId
 */
export async function handleEndGuessing(gameId) {
  const snapshot = await get(ref(database, `games/${gameId}`));
  if (!snapshot.exists()) return;
  const game = snapshot.val();
  const gs = game.gameState;
  const currentTeam = gs.currentTurn;

  // Append "passed" marker to current clue log
  const clueLog = game.clueLog || [];
  const logIndex = (Array.isArray(clueLog) ? clueLog.length : Object.keys(clueLog).length) - 1;
  const currentEntry = Array.isArray(clueLog) ? clueLog[logIndex] : clueLog[logIndex];
  const guesses = currentEntry?.guesses || [];
  const guessIndex = Array.isArray(guesses) ? guesses.length : Object.keys(guesses || {}).length;

  await update(ref(database, `games/${gameId}`), {
    'gameState/currentTurn': currentTeam === 'red' ? 'blue' : 'red',
    'gameState/phase': 'clue',
    'gameState/currentClue': null,
    'gameState/guessesRemaining': 0,
    [`clueLog/${logIndex}/guesses/${guessIndex}`]: { passed: true }
  });
}

/**
 * Start a new game with the same players — reset board, keep teams
 * @param {string} gameId
 */
export async function handleNewGame(gameId) {
  const snapshot = await get(ref(database, `games/${gameId}`));
  if (!snapshot.exists()) return;
  const game = snapshot.val();

  // Reset each player's team/role to null but keep them active
  const playerUpdates = {};
  for (const pid of Object.keys(game.players || {})) {
    playerUpdates[`players/${pid}/team`] = null;
    playerUpdates[`players/${pid}/role`] = null;
  }

  await update(ref(database, `games/${gameId}`), {
    status: 'setup',
    startingTeam: null,
    startedAt: null,
    finishedAt: null,
    board: null,
    gameState: null,
    clueLog: null,
    ...playerUpdates
  });
}
