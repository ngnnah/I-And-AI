/**
 * Firebase sync handlers for Codenames
 * All functions that write to Firebase live here
 */

import { database, ref, get, update, set, remove } from './firebase-config.js';
import { 
  generateBoard, 
  generateDuetBoard, 
  checkGuessResult, 
  checkWinCondition, 
  checkDuetWinCondition,
  checkDuetWinConditionSimple
} from './game-logic.js';
import { getModeConfig } from '../data/game-modes.js';
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
 * Claim a slot in Duet mode
 * @param {string} gameId
 * @param {string} playerId
 * @param {number} slotNumber - 1, 2, 3, etc.
 */
export async function handleSlotClaim(gameId, playerId, slotNumber) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();
  
  // Check if slot is already taken
  const players = game.players || {};
  const slotTaken = Object.values(players).some(p => 
    p.isActive && p.slotNumber === slotNumber
  );
  
  if (slotTaken) {
    throw new Error(`Slot ${slotNumber} is already taken`);
  }
  
  await update(ref(database, `games/${gameId}/players/${playerId}`), {
    slotNumber
  });
}

/**
 * Leave current slot and go to waiting pool in Duet mode
 * @param {string} gameId
 * @param {string} playerId
 */
export async function handleSlotLeave(gameId, playerId) {
  await update(ref(database, `games/${gameId}/players/${playerId}`), {
    slotNumber: null
  });
}

/**
 * Start the game — generate board, set initial state
 * @param {string} gameId
 */
export async function handleStartGame(gameId) {
  const snapshot = await get(ref(database, `games/${gameId}`));
  const gameData = snapshot.val();
  const gameMode = gameData?.gameMode || 'words';
  const config = getModeConfig(gameMode);

  // Duet mode has different setup
  if (config.isDuet) {
    const board = generateDuetBoard(gameMode);

    const updates = {
      status: 'playing',
      startedAt: Date.now(),
      'board/colorMapP1': board.colorMapP1,
      'board/colorMapP2': board.colorMapP2,
      'board/cardIds': board.cardIds,
      'board/revealed': board.revealed,
      'gameState/currentPlayer': 1,
      'gameState/phase': 'clue',
      'gameState/currentClue': null,
      'gameState/guessesRemaining': 0,
      'gameState/turnsUsed': 0,
      'gameState/mistakesMade': 0,
      'gameState/greenRevealed': 0,
      'gameState/greenTotal': config.greenCount,
      'gameState/winner': null,
      'gameState/winReason': null
    };

    await update(ref(database, `games/${gameId}`), updates);
    return;
  }

  // Standard competitive mode
  const startingTeam = Math.random() < 0.5 ? 'red' : 'blue';
  const board = generateBoard(startingTeam, gameMode);

  const updates = {
    status: 'playing',
    startingTeam,
    startedAt: Date.now(),
    'board/colorMap': board.colorMap,
    'gameState/currentTurn': startingTeam,
    'gameState/phase': 'clue',
    'gameState/revealedCards': new Array(config.totalCards).fill(false),
    'gameState/currentClue': null,
    'gameState/guessesRemaining': 0,
    'gameState/redRevealed': 0,
    'gameState/blueRevealed': 0,
    'gameState/redTotal': startingTeam === 'red' ? config.startingCount : config.otherCount,
    'gameState/blueTotal': startingTeam === 'blue' ? config.startingCount : config.otherCount,
    'gameState/winner': null,
    'gameState/winReason': null
  };

  if (config.cardType === 'text') {
    updates['board/words'] = board.words;
  } else {
    updates['board/cardIds'] = board.cardIds;
  }

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
  // Get game data to check mode
  const gameSnapshot = await get(ref(database, `games/${gameId}`));
  if (!gameSnapshot.exists()) return;
  const game = gameSnapshot.val();
  const gameMode = game.gameMode || 'words';
  const config = getModeConfig(gameMode);
  
  // Get current clue log length to determine next index
  const clueLog = game.clueLog || [];
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
  
  // In Duet mode: switch player after giving clue (clue giver → guesser)
  if (config.isDuet) {
    const currentPlayer = game.gameState?.currentPlayer || 1;
    const newPlayer = currentPlayer === 1 ? 2 : 1;
    console.log(`🎯 DUET CLUE: Switching currentPlayer ${currentPlayer} → ${newPlayer}`);
    updates['gameState/currentPlayer'] = newPlayer;
  }

  console.log('📤 handleGiveClue updates:', updates);
  await update(ref(database, `games/${gameId}`), updates);
  console.log('✅ handleGiveClue complete');
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
  
  const gameMode = game.gameMode || 'words';
  const config = getModeConfig(gameMode);
  
  console.log(`🎮 CARD REVEAL: gameMode=${gameMode}, isDuet=${config.isDuet}, cardIndex=${cardIndex}`);
  
  // Handle Duet mode separately
  if (config.isDuet) {
    // Duet uses board.revealed instead of gameState.revealedCards
    if (game.board.revealed[cardIndex]) return; // Already revealed
    
    // Use the CLUE GIVER's color map (opposite of current guesser)
    // If currentPlayer is 2 (P2 guessing), use P1's map (P1 gave clue)
    // If currentPlayer is 1 (P1 guessing), use P2's map (P2 gave clue)
    const currentPlayer = gs.currentPlayer || 1;
    const colorMap = currentPlayer === 1 ? game.board.colorMapP2 : game.board.colorMapP1;
    
    console.log(`🎲 CARD REVEAL: Card ${cardIndex}`);
    console.log(`  Current player (guesser): ${currentPlayer}`);
    console.log(`  Using color map: ${currentPlayer === 1 ? 'P2' : 'P1'} (clue giver's perspective)`);
    console.log(`  Color from map: ${colorMap[cardIndex]}`);
    
    const color = colorMap[cardIndex];
    const newRevealed = [...game.board.revealed];
    newRevealed[cardIndex] = true;
    
    // Update Duet-specific counters
    let greenRevealed = gs.greenRevealed || 0;
    let mistakesMade = gs.mistakesMade || 0;
    let turnsUsed = gs.turnsUsed || 0;
    
    if (color === 'green') {
      greenRevealed++;
    } else if (color === 'neutral') {
      mistakesMade++;
    }
    
    // Append guess to current clue log entry
    const clueLog = game.clueLog || [];
    const logIndex = (Array.isArray(clueLog) ? clueLog.length : Object.keys(clueLog).length) - 1;
    const currentEntry = Array.isArray(clueLog) ? clueLog[logIndex] : clueLog[logIndex];
    const guesses = currentEntry?.guesses || [];
    const guessIndex = Array.isArray(guesses) ? guesses.length : Object.keys(guesses || {}).length;
    
    const updates = {
      'board/revealed': newRevealed,
      'gameState/greenRevealed': greenRevealed,
      'gameState/mistakesMade': mistakesMade,
      [`clueLog/${logIndex}/guesses/${guessIndex}`]: {
        cardIndex,
        word: game.board.words ? game.board.words[cardIndex] : `Card ${cardIndex + 1}`,
        result: color === 'green' ? 'correct' : color === 'assassin' ? 'assassin' : 'wrong',
        color: color
      }
    };
    
    // Check for assassin (immediate loss)
    if (color === 'assassin') {
      updates['gameState/winner'] = 'loss';
      updates['gameState/winReason'] = 'assassin';
      updates['gameState/currentClue'] = null;
      updates['status'] = 'finished';
      updates['finishedAt'] = Date.now();
      await update(ref(database, `games/${gameId}`), updates);
      return;
    }
    
    // Check win/loss conditions
    const winCheck = checkDuetWinConditionSimple(greenRevealed, mistakesMade, turnsUsed, config);
    if (winCheck.isOver) {
      updates['gameState/winner'] = winCheck.winner;
      updates['gameState/winReason'] = winCheck.reason;
      updates['gameState/currentClue'] = null;
      updates['status'] = 'finished';
      updates['finishedAt'] = Date.now();
      await update(ref(database, `games/${gameId}`), updates);
      return;
    }
    
    // Handle turn progression in Duet mode
    if (color === 'green') {
      const remaining = gs.guessesRemaining - 1;
      if (remaining <= 0) {
        // Out of guesses — end turn, guesser becomes next clue giver (no player switch)
        console.log(`  ✅ Green! Out of guesses. Phase → clue, currentPlayer stays ${currentPlayer}`);
        updates['gameState/phase'] = 'clue';
        updates['gameState/currentClue'] = null;
        updates['gameState/guessesRemaining'] = 0;
        updates['gameState/turnsUsed'] = turnsUsed + 1;
      } else {
        console.log(`  ✅ Green! ${remaining} guesses remaining`);
        updates['gameState/guessesRemaining'] = remaining;
      }
    } else {
      // Wrong guess — end turn, guesser becomes next clue giver (no player switch)
      console.log(`  ❌ ${color}! Turn ends. Phase → clue, currentPlayer stays ${currentPlayer}`);
      updates['gameState/phase'] = 'clue';
      updates['gameState/currentClue'] = null;
      updates['gameState/guessesRemaining'] = 0;
      updates['gameState/turnsUsed'] = turnsUsed + 1;
    }
    
    await update(ref(database, `games/${gameId}`), updates);
    return;
  }
  
  // Competitive mode logic below
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
      word: game.board.words ? game.board.words[cardIndex] : `Card ${cardIndex + 1}`,
      result,
      color: color
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
    
    // Save to history
    const { saveGameHistory } = await import('./firebase-config.js');
    const finalGame = (await get(ref(database, `games/${gameId}`))).val();
    await saveGameHistory(gameId, finalGame);
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
    
    // Save to history
    const { saveGameHistory } = await import('./firebase-config.js');
    const finalGame = (await get(ref(database, `games/${gameId}`))).val();
    await saveGameHistory(gameId, finalGame);
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
  
  const gameMode = game.gameMode || 'words';
  const config = getModeConfig(gameMode);

  // Append "passed" marker to current clue log
  const clueLog = game.clueLog || [];
  const logIndex = (Array.isArray(clueLog) ? clueLog.length : Object.keys(clueLog).length) - 1;
  const currentEntry = Array.isArray(clueLog) ? clueLog[logIndex] : clueLog[logIndex];
  const guesses = currentEntry?.guesses || [];
  const guessIndex = Array.isArray(guesses) ? guesses.length : Object.keys(guesses || {}).length;

  const updates = {
    'gameState/phase': 'clue',
    'gameState/currentClue': null,
    'gameState/guessesRemaining': 0,
    [`clueLog/${logIndex}/guesses/${guessIndex}`]: { passed: true }
  };
  
  // Duet mode: increment turn counter instead of switching teams
  if (config.isDuet) {
    const turnsUsed = gs.turnsUsed || 0;
    updates['gameState/turnsUsed'] = turnsUsed + 1;
  } else {
    // Competitive mode: switch teams
    const currentTeam = gs.currentTurn;
    updates['gameState/currentTurn'] = currentTeam === 'red' ? 'blue' : 'red';
  }

  await update(ref(database, `games/${gameId}`), updates);
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

// Note: Inspiration word regeneration moved to client-side (game-room.js)
// This function is no longer used but kept for backward compatibility

/**
 * Cancel/delete a game (host only)
 * @param {string} gameId
 */
export async function handleCancelGame(gameId) {
  await remove(ref(database, `games/${gameId}`));
}

/**
 * Rematch - start a new round with same teams/roles
 * @param {string} gameId
 */
export async function handleRematch(gameId) {
  const snapshot = await get(ref(database, `games/${gameId}`));
  if (!snapshot.exists()) return;
  const game = snapshot.val();

  // Keep teams/roles but start a new game
  const gameMode = game.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const startingTeam = Math.random() < 0.5 ? 'red' : 'blue';
  const board = generateBoard(startingTeam, gameMode);

  const updates = {
    status: 'playing',
    startingTeam,
    startedAt: Date.now(),
    finishedAt: null,
    'board/colorMap': board.colorMap,
    'gameState/currentTurn': startingTeam,
    'gameState/phase': 'clue',
    'gameState/revealedCards': new Array(config.totalCards).fill(false),
    'gameState/currentClue': null,
    'gameState/guessesRemaining': 0,
    'gameState/redRevealed': 0,
    'gameState/blueRevealed': 0,
    'gameState/redTotal': startingTeam === 'red' ? config.startingCount : config.otherCount,
    'gameState/blueTotal': startingTeam === 'blue' ? config.startingCount : config.otherCount,
    'gameState/winner': null,
    'gameState/winReason': null,
    clueLog: null
  };

  if (config.cardType === 'text') {
    updates['board/words'] = board.words;
  } else {
    updates['board/cardIds'] = board.cardIds;
  }

  await update(ref(database, `games/${gameId}`), updates);
}
