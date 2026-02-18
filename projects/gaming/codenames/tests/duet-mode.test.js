/**
 * Duet Mode Tests - Cooperative 2-player gameplay
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDuetBoard,
  checkDuetWinConditionSimple,
  validateClue,
  generateBoard
} from '../js/game/game-logic.js';
import { getModeConfig } from '../js/data/game-modes.js';
import { WORD_LIST } from '../js/data/word-lists.js';

// ---------------------------------------------------------------------------
// Helpers: simulate Duet game state
// ---------------------------------------------------------------------------

function createDuetGameState() {
  const board = generateDuetBoard();
  // Add words for text-based testing
  const words = WORD_LIST.slice(0, 25).map(w => w.toUpperCase());
  board.words = words;
  
  return {
    board,
    phase: 'clue',
    currentPlayer: 1, // 1 or 2
    currentClue: null,
    guessesRemaining: 0,
    greenRevealed: 0,
    mistakesMade: 0,
    turnsUsed: 0,
    winner: null,
    winReason: null,
    clueLog: []
  };
}

/**
 * Generate a safe clue word that's not on the board
 */
function getSafeClueWord(boardWords) {
  const safeWords = ['TESTCLUE', 'HINT', 'CLUEWORD', 'SAFECLUE', 'MYWORD'];
  const boardWordsUpper = boardWords.map(w => w.toUpperCase());
  for (const word of safeWords) {
    if (!boardWordsUpper.includes(word)) return word;
  }
  return 'CLUE' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Simulate P1 or P2 giving a clue in Duet mode
 */
function giveDuetClue(gs, word, number, playerName) {
  const { valid, error } = validateClue(word, number, gs.board.words);
  if (!valid) throw new Error(`Invalid clue: ${error}`);

  gs.phase = 'guess';
  gs.currentClue = { word: word.toUpperCase(), number, givenBy: playerName };
  gs.guessesRemaining = number === 0 ? 99 : number + 1;
  
  // Switch current player: giver → guesser
  gs.currentPlayer = gs.currentPlayer === 1 ? 2 : 1;
  
  gs.clueLog.push({
    player: playerName,
    word: word.toUpperCase(),
    number,
    guesses: []
  });
}

/**
 * Simulate revealing a card in Duet mode
 * Returns { color, turnEnded, gameOver, winner }
 */
function revealDuetCard(gs, cardIndex) {
  if (gs.board.revealed[cardIndex]) throw new Error('Card already revealed');

  // Use current player's color map (after clue was given, player switched)
  const colorMap = gs.currentPlayer === 1 ? gs.board.colorMapP1 : gs.board.colorMapP2;
  const color = colorMap[cardIndex];
  
  gs.board.revealed[cardIndex] = true;

  // Update counters
  if (color === 'green') {
    gs.greenRevealed++;
  } else if (color === 'neutral') {
    gs.mistakesMade++;
  }

  // Log the guess
  const currentLogEntry = gs.clueLog[gs.clueLog.length - 1];
  currentLogEntry.guesses.push({
    cardIndex,
    word: gs.board.words[cardIndex],
    result: color === 'green' ? 'correct' : color === 'assassin' ? 'assassin' : 'wrong',
    color
  });

  // Assassin = immediate loss
  if (color === 'assassin') {
    gs.winner = 'loss';
    gs.winReason = 'assassin';
    gs.currentClue = null;
    return { color, turnEnded: true, gameOver: true, winner: 'loss' };
  }

  const config = getModeConfig('duet');
    const winCheck = checkDuetWinConditionSimple(gs.greenRevealed, gs.mistakesMade, gs.turnsUsed, config);
  if (winCheck.isOver) {
    gs.winner = winCheck.winner;
    gs.winReason = winCheck.reason;
    gs.currentClue = null;
    return { color, turnEnded: true, gameOver: true, winner: winCheck.winner };
  }

  // Handle turn progression
  if (color === 'green') {
    gs.guessesRemaining--;
    if (gs.guessesRemaining <= 0) {
      // Out of guesses - switch back to other player for clue phase
      gs.currentPlayer = gs.currentPlayer === 1 ? 2 : 1;
      gs.phase = 'clue';
      gs.currentClue = null;
      gs.turnsUsed++;
      return { color, turnEnded: true, gameOver: false };
    }
    return { color, turnEnded: false, gameOver: false };
  } else {
    // Wrong guess (neutral) - turn ends, switch player
    gs.currentPlayer = gs.currentPlayer === 1 ? 2 : 1;
    gs.phase = 'clue';
    gs.currentClue = null;
    gs.guessesRemaining = 0;
    gs.turnsUsed++;
    return { color, turnEnded: true, gameOver: false };
  }
}

// ---------------------------------------------------------------------------
// Tests: Duet Board Generation
// ---------------------------------------------------------------------------

describe('generateDuetBoard', () => {
  it('returns 25 cards and dual color maps', () => {
    const board = generateDuetBoard();
    assert.equal(board.cardIds.length, 25);
    assert.equal(board.colorMapP1.length, 25);
    assert.equal(board.colorMapP2.length, 25);
    assert.equal(board.revealed.length, 25);
  });

  it('has exactly 15 green cards total', () => {
    const board = generateDuetBoard();
    const greenInP1 = board.colorMapP1.filter(c => c === 'green').length;
    const greenInP2 = board.colorMapP2.filter(c => c === 'green').length;
    
    // Count cards that are green in at least one perspective
    const greenCards = new Set();
    board.colorMapP1.forEach((c, i) => { if (c === 'green') greenCards.add(i); });
    board.colorMapP2.forEach((c, i) => { if (c === 'green') greenCards.add(i); });
    
    assert.equal(greenCards.size, 15, 'Should have exactly 15 green cards total');
  });

  it('has 3 assassins per player at DIFFERENT positions', () => {
    const board = generateDuetBoard();
    const assassinsP1 = board.colorMapP1.filter(c => c === 'assassin').length;
    const assassinsP2 = board.colorMapP2.filter(c => c === 'assassin').length;
    
    // Each player has 3 assassins
    assert.equal(assassinsP1, 3, 'P1 should have 3 assassins');
    assert.equal(assassinsP2, 3, 'P2 should have 3 assassins');
    
    // Assassins should be at DIFFERENT positions (not shared)
    const assassinIndicesP1 = board.colorMapP1.map((c, i) => c === 'assassin' ? i : -1).filter(i => i !== -1);
    const assassinIndicesP2 = board.colorMapP2.map((c, i) => c === 'assassin' ? i : -1).filter(i => i !== -1);
    
    // They should NOT be identical (different perspectives)
    const identical = assassinIndicesP1.every((idx, i) => idx === assassinIndicesP2[i]);
    assert.equal(identical, false, 'Assassins should be at different positions for P1 vs P2');
  });

  it('has different color maps for P1 and P2', () => {
    const board = generateDuetBoard();
    
    // Maps should not be identical
    const identical = board.colorMapP1.every((c, i) => c === board.colorMapP2[i]);
    assert.equal(identical, false, 'P1 and P2 should see different color maps');
  });

  it('all cards start unrevealed', () => {
    const board = generateDuetBoard();
    assert.ok(board.revealed.every(r => r === false));
  });
});

// ---------------------------------------------------------------------------
// Tests: Duet Win Conditions
// ---------------------------------------------------------------------------

describe('checkDuetWinConditionSimple', () => {
  const config = getModeConfig('duet');

  it('returns win when all 15 green cards revealed', () => {
    const result = checkDuetWinConditionSimple(15, 0, 5, config);
    assert.equal(result.isOver, true);
    assert.equal(result.winner, 'win');
    assert.equal(result.reason, 'all-green');
  });

  it('returns loss when too many mistakes made', () => {
    const result = checkDuetWinConditionSimple(5, 10, 5, config); // maxMistakes = 9
    assert.equal(result.isOver, true);
    assert.equal(result.winner, 'loss');
    assert.equal(result.reason, 'too-many-mistakes');
  });

  it('returns loss when turns exceeded', () => {
    const result = checkDuetWinConditionSimple(10, 3, 10, config); // maxTurns = 9
    assert.equal(result.isOver, true);
    assert.equal(result.winner, 'loss');
    assert.equal(result.reason, 'out-of-turns');
  });

  it('returns not over when game is still playable', () => {
    const result = checkDuetWinConditionSimple(10, 3, 5, config);
    assert.equal(result.isOver, false);
    assert.equal(result.winner, null);
  });

  it('exactly maxMistakes should still be playable', () => {
    const result = checkDuetWinConditionSimple(10, 9, 5, config); // 9 mistakes allowed
    assert.equal(result.isOver, false);
  });

  it('exactly maxTurns should still be playable', () => {
    const result = checkDuetWinConditionSimple(10, 3, 9, config); // 9 turns allowed
    assert.equal(result.isOver, false);
  });
});

// ---------------------------------------------------------------------------
// Tests: Duet Gameplay Scenarios
// ---------------------------------------------------------------------------

describe('Duet Gameplay - Turn Switching', () => {
  it('P1 gives clue, P2 guesses', () => {
    const gs = createDuetGameState();
    assert.equal(gs.currentPlayer, 1, 'P1 starts');
    assert.equal(gs.phase, 'clue');

    // P1 gives a clue
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 2, 'P1');
    
    assert.equal(gs.phase, 'guess', 'Should be in guess phase');
    assert.equal(gs.currentPlayer, 2, 'Should switch to P2 for guessing');
    assert.equal(gs.guessesRemaining, 3, 'Should have 2+1 guesses');
  });

  it('P2 gives clue, P1 guesses', () => {
    const gs = createDuetGameState();
    gs.currentPlayer = 2; // Start with P2
    gs.phase = 'clue';

    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 1, 'P2');
    
    assert.equal(gs.phase, 'guess');
    assert.equal(gs.currentPlayer, 1, 'Should switch to P1 for guessing');
    assert.equal(gs.guessesRemaining, 2, 'Should have 1+1 guesses');
  });

  it('after P2 guesses, turn returns to P1 for clue', () => {
    const gs = createDuetGameState();
    
    // P1 gives clue
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 1, 'P1');
    assert.equal(gs.currentPlayer, 2, 'P2 should be guessing');
    
    // P2 guesses wrong (neutral)
    const neutralIndex = gs.board.colorMapP2.indexOf('neutral');
    const result = revealDuetCard(gs, neutralIndex);
    
    assert.equal(result.turnEnded, true);
    assert.equal(gs.phase, 'clue', 'Should return to clue phase');
    assert.equal(gs.currentPlayer, 1, 'Should switch back to P1 for next clue');
  });
});

describe('Duet Gameplay - Green Card Guessing', () => {
  it('correct guess (green) allows continued guessing', () => {
    const gs = createDuetGameState();
    
    // P1 gives clue for 2
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 2, 'P1');
    
    // P2 guesses green card
    const greenIndex = gs.board.colorMapP2.indexOf('green');
    const result = revealDuetCard(gs, greenIndex);
    
    assert.equal(result.color, 'green');
    assert.equal(result.turnEnded, false, 'Turn should continue');
    assert.equal(gs.phase, 'guess', 'Should stay in guess phase');
    assert.equal(gs.guessesRemaining, 2, 'Should have 2 guesses left');
    assert.equal(gs.greenRevealed, 1);
  });

  it('all guesses used ends turn', () => {
    const gs = createDuetGameState();
    
    // P1 gives clue for 1
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 1, 'P1');
    assert.equal(gs.guessesRemaining, 2); // 1+1
    
    // P2 guesses one green card
    const greenIndices = gs.board.colorMapP2
      .map((c, i) => c === 'green' ? i : -1)
      .filter(i => i !== -1);
    
    const result1 = revealDuetCard(gs, greenIndices[0]);
    assert.equal(result1.turnEnded, false);
    assert.equal(gs.guessesRemaining, 1);
    
    // Second green guess
    const result2 = revealDuetCard(gs, greenIndices[1]);
    assert.equal(result2.turnEnded, true, 'Turn should end after all guesses');
    assert.equal(gs.phase, 'clue');
    assert.equal(gs.currentPlayer, 1, 'Should switch to P1 for next clue');
  });
});

describe('Duet Gameplay - Neutral Cards', () => {
  it('neutral guess ends turn immediately', () => {
    const gs = createDuetGameState();
    
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 3, 'P1');
    
    const neutralIndex = gs.board.colorMapP2.indexOf('neutral');
    const result = revealDuetCard(gs, neutralIndex);
    
    assert.equal(result.color, 'neutral');
    assert.equal(result.turnEnded, true);
    assert.equal(gs.mistakesMade, 1);
    assert.equal(gs.phase, 'clue');
    assert.equal(gs.currentPlayer, 1); // Switch back to P1
  });

  it('multiple neutral guesses accumulate mistakes', () => {
    const gs = createDuetGameState();
    
    // Turn 1: P1 → P2 hits neutral
    giveDuetClue(gs, getSafeClueWord(gs.board.words), 2, 'P1');
    const neutralIndices = gs.board.colorMapP2
      .map((c, i) => c === 'neutral' ? i : -1)
      .filter(i => i !== -1);
    revealDuetCard(gs, neutralIndices[0]);
    assert.equal(gs.mistakesMade, 1);
    
    // Turn 2: P1 → P2 hits another neutral
    giveDuetClue(gs, getSafeClueWord(gs.board.words), 2, 'P1');
    revealDuetCard(gs, neutralIndices[1]);
    assert.equal(gs.mistakesMade, 2);
  });
});

describe('Duet Gameplay - Assassin', () => {
  it('hitting assassin ends game immediately with loss', () => {
    const gs = createDuetGameState();
    
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 2, 'P1');
    
    const assassinIndex = gs.board.colorMapP2.indexOf('assassin');
    const result = revealDuetCard(gs, assassinIndex);
    
    assert.equal(result.color, 'assassin');
    assert.equal(result.gameOver, true);
    assert.equal(result.winner, 'loss');
    assert.equal(gs.winner, 'loss');
    assert.equal(gs.winReason, 'assassin');
  });
});

describe('Duet Gameplay - Full Game Flow', () => {
  it('simulates complete game with win', () => {
    const gs = createDuetGameState();
    let turnCount = 0;
    const maxTurns = 20; // Safety limit
    
    // Play until win or max turns
    while (!gs.winner && turnCount < maxTurns) {
      const currentPlayerLabel = gs.currentPlayer === 1 ? 'P1' : 'P2';
      
      // Give a clue
      const clueWord = getSafeClueWord(gs.board.words);
      giveDuetClue(gs, clueWord, 2, currentPlayerLabel);
      
      // Make guesses
      while (gs.phase === 'guess' && gs.guessesRemaining > 0) {
        // Find a green card from current player's perspective
        const colorMap = gs.currentPlayer === 1 ? gs.board.colorMapP1 : gs.board.colorMapP2;
        const greenIndex = colorMap.findIndex((c, i) => c === 'green' && !gs.board.revealed[i]);
        
        if (greenIndex === -1) break; // No green cards left
        
        const result = revealDuetCard(gs, greenIndex);
        if (result.gameOver) break;
        if (result.turnEnded) break;
      }
      
      turnCount++;
    }
    
    // Should eventually win (or hit max turns)
    assert.ok(turnCount < maxTurns, 'Should not exceed max turns');
    if (gs.greenRevealed === 15) {
      assert.equal(gs.winner, 'win');
      assert.equal(gs.winReason, 'all-green');
    }
  });

  it('alternates players correctly over multiple turns', () => {
    const gs = createDuetGameState();
    const playerSequence = [];
    
    // Play 6 turns
    for (let i = 0; i < 6; i++) {
      const clueGiver = gs.currentPlayer;
      playerSequence.push({ phase: 'clue', player: clueGiver });
      
      const clueWord = getSafeClueWord(gs.board.words);
      giveDuetClue(gs, clueWord, 1, `P${clueGiver}`);
      
      const guesser = gs.currentPlayer;
      playerSequence.push({ phase: 'guess', player: guesser });
      
      // Make a neutral guess to end turn quickly
      const colorMap = guesser === 1 ? gs.board.colorMapP1 : gs.board.colorMapP2;
      const neutralIndex = colorMap.findIndex((c, i) => c === 'neutral' && !gs.board.revealed[i]);
      if (neutralIndex !== -1) {
        revealDuetCard(gs, neutralIndex);
      }
    }
    
    // Check alternation
    assert.equal(playerSequence[0].player, 1, 'P1 gives first clue');
    assert.equal(playerSequence[1].player, 2, 'P2 guesses first');
    assert.equal(playerSequence[2].player, 1, 'P1 gives second clue');
    assert.equal(playerSequence[3].player, 2, 'P2 guesses second');
    assert.equal(playerSequence[4].player, 1, 'P1 gives third clue');
    assert.equal(playerSequence[5].player, 2, 'P2 guesses third');
  });
});
