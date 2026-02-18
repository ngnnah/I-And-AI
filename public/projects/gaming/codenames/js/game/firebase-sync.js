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
  checkDuetWinConditionSimple,
  canStartGame,
  calculateGuessesAllowed
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
    // Validate: Need at least 2 players with assigned slots
    const players = gameData.players || {};
    const playersInSlots = Object.values(players).filter(p => p.isActive && p.slotNumber !== null);
    
    if (playersInSlots.length < 2) {
      throw new Error('Need 2 players in slots to start Duet mode');
    }

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
  const players = gameData.players || {};
  const { canStart, errors } = canStartGame(players);
  
  if (!canStart) {
    throw new Error(errors.join('. '));
  }
  
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

  const guessesRemaining = calculateGuessesAllowed(number);

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
  
  // In Duet mode: always switch to the partner for guessing
  if (config.isDuet) {
    const currentPlayer = game.gameState?.currentPlayer || 1;
    const newPlayer = currentPlayer === 1 ? 2 : 1;
    console.log(`🎯 DUET CLUE: P${currentPlayer} gave clue, switching to P${newPlayer} to guess`);
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
    
    // currentPlayer = GUESSER. handleGiveClue switches currentPlayer to the OTHER player
    // after the clue is given, so during guess phase currentPlayer = the guesser.
    // We need the CLUE GIVER's map: that's the opposite player.
    // When currentPlayer=2 (P2 guessing) → P1 gave the clue → use colorMapP1
    // When currentPlayer=1 (P1 guessing) → P2 gave the clue → use colorMapP2
    const currentPlayer = gs.currentPlayer || 1;
    const clueGiverPlayer = currentPlayer === 1 ? 2 : 1;

    // Use ONLY clue giver's map for ALL game logic (assassin, green, neutral)
    const clueGiverMap = currentPlayer === 1 ? game.board.colorMapP2 : game.board.colorMapP1;
    const clueGiverColor = clueGiverMap[cardIndex];

    console.log(`🎲 CARD REVEAL: Card ${cardIndex}`);
    console.log(`  Guesser: P${currentPlayer}, Clue giver: P${clueGiverPlayer}`);
    console.log(`  >>> Clue giver (P${clueGiverPlayer}) sees: ${clueGiverColor} <<<`);
    
    const newRevealed = [...game.board.revealed];
    newRevealed[cardIndex] = true;
    
    // Update Duet-specific counters
    let mistakesMade = gs.mistakesMade || 0;
    let turnsUsed = gs.turnsUsed || 0;

    // Clue giver's perspective determines turn outcome (official rules)
    if (clueGiverColor === 'neutral') {
      mistakesMade++;
    }

    // Win condition: count unique greens revealed across BOTH maps
    // (a card green on either map counts toward the 15-green goal,
    //  regardless of whose clue turn it was when revealed)
    const greenRevealed = newRevealed.filter((r, idx) =>
      r && (game.board.colorMapP1[idx] === 'green' || game.board.colorMapP2[idx] === 'green')
    ).length;
    
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
        result: clueGiverColor === 'green' ? 'correct' : clueGiverColor === 'assassin' ? 'assassin' : 'wrong',
        color: clueGiverColor
      }
    };
    
    // Check for assassin (immediate loss ONLY if assassin on CLUE GIVER's map)
    if (clueGiverColor === 'assassin') {
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
    // Only continue guessing if the card is green on the CLUE GIVER's map
    if (clueGiverColor === 'green') {
      const remaining = gs.guessesRemaining - 1;
      if (remaining <= 0) {
        // Out of guesses — end turn
        console.log(`  ✅ Green! Out of guesses. Phase → clue`);
        updates['gameState/phase'] = 'clue';
        updates['gameState/currentClue'] = null;
        updates['gameState/guessesRemaining'] = 0;
        updates['gameState/turnsUsed'] = turnsUsed + 1;

        // The guesser (currentPlayer) gives the next clue (official alternation).
        // Exception: if that player's own greens are all revealed, the other takes over.
        const p1GreenCount = newRevealed.filter((isRevealed, idx) =>
          isRevealed && game.board.colorMapP1[idx] === 'green'
        ).length;
        const p2GreenCount = newRevealed.filter((isRevealed, idx) =>
          isRevealed && game.board.colorMapP2[idx] === 'green'
        ).length;

        const p1Finished = p1GreenCount >= 9;
        const p2Finished = p2GreenCount >= 9;

        let newPlayer = currentPlayer; // guesser → next clue giver
        if (p1Finished && currentPlayer === 1) newPlayer = 2;
        if (p2Finished && currentPlayer === 2) newPlayer = 1;

        console.log(`  P1=${p1GreenCount}/9${p1Finished?' ✓':''}, P2=${p2GreenCount}/9${p2Finished?' ✓':''} → P${newPlayer} gives next clue`);
        updates['gameState/currentPlayer'] = newPlayer;
      } else {
        // Check if clue giver's map is now fully revealed — no more useful guesses
        const clueGiverGreenTotal = newRevealed.filter((isRevealed, idx) =>
          isRevealed && clueGiverMap[idx] === 'green'
        ).length;

        if (clueGiverGreenTotal >= 9) {
          // End turn — clue giver's map is complete
          console.log(`  ✅ Green! Clue giver P${clueGiverPlayer}'s map now complete (${clueGiverGreenTotal}/9). Ending turn.`);
          updates['gameState/phase'] = 'clue';
          updates['gameState/currentClue'] = null;
          updates['gameState/guessesRemaining'] = 0;
          updates['gameState/turnsUsed'] = turnsUsed + 1;

          const p1GreenCount = newRevealed.filter((isRevealed, idx) =>
            isRevealed && game.board.colorMapP1[idx] === 'green'
          ).length;
          const p2GreenCount = newRevealed.filter((isRevealed, idx) =>
            isRevealed && game.board.colorMapP2[idx] === 'green'
          ).length;

          let newPlayer = currentPlayer;
          if (p1GreenCount >= 9 && currentPlayer === 1) newPlayer = 2;
          if (p2GreenCount >= 9 && currentPlayer === 2) newPlayer = 1;
          updates['gameState/currentPlayer'] = newPlayer;
        } else {
          console.log(`  ✅ Green! ${remaining} guesses remaining`);
          updates['gameState/guessesRemaining'] = remaining;
        }
      }
    } else {
      // Wrong guess — end turn
      console.log(`  ❌ ${clueGiverColor}! Turn ends. Phase → clue`);
      updates['gameState/phase'] = 'clue';
      updates['gameState/currentClue'] = null;
      updates['gameState/guessesRemaining'] = 0;
      updates['gameState/turnsUsed'] = turnsUsed + 1;

      // The guesser (currentPlayer) gives the next clue (official alternation).
      // Exception: if that player's own greens are all revealed, the other takes over.
      const p1GreenCount = newRevealed.filter((isRevealed, idx) =>
        isRevealed && game.board.colorMapP1[idx] === 'green'
      ).length;
      const p2GreenCount = newRevealed.filter((isRevealed, idx) =>
        isRevealed && game.board.colorMapP2[idx] === 'green'
      ).length;

      const p1Finished = p1GreenCount >= 9;
      const p2Finished = p2GreenCount >= 9;

      let newPlayer = currentPlayer; // guesser → next clue giver
      if (p1Finished && currentPlayer === 1) newPlayer = 2;
      if (p2Finished && currentPlayer === 2) newPlayer = 1;

      console.log(`  P1=${p1GreenCount}/9${p1Finished?' ✓':''}, P2=${p2GreenCount}/9${p2Finished?' ✓':''} → P${newPlayer} gives next clue`);
      updates['gameState/currentPlayer'] = newPlayer;
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
  
  // Duet mode: increment turn counter and determine next clue giver
  if (config.isDuet) {
    const turnsUsed = gs.turnsUsed || 0;
    updates['gameState/turnsUsed'] = turnsUsed + 1;

    // Guesser becomes next clue giver unless their map is done
    const currentPlayer = gs.currentPlayer || 1;
    const revealed = game.board?.revealed || [];
    const colorMapP1 = game.board?.colorMapP1 || [];
    const colorMapP2 = game.board?.colorMapP2 || [];

    const p1GreenCount = revealed.filter((r, idx) => r && colorMapP1[idx] === 'green').length;
    const p2GreenCount = revealed.filter((r, idx) => r && colorMapP2[idx] === 'green').length;

    let newPlayer = currentPlayer;
    if (p1GreenCount >= 9 && currentPlayer === 1) newPlayer = 2;
    if (p2GreenCount >= 9 && currentPlayer === 2) newPlayer = 1;
    updates['gameState/currentPlayer'] = newPlayer;
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
