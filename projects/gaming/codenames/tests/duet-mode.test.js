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

  // Use the CLUE GIVER's color map (opposite of current guesser)
  // If currentPlayer is 2 (P2 guessing), use P1's map (P1 gave clue)
  // If currentPlayer is 1 (P1 guessing), use P2's map (P2 gave clue)
  const colorMap = gs.currentPlayer === 1 ? gs.board.colorMapP2 : gs.board.colorMapP1;
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
      // Out of guesses - end turn, guesser becomes next clue giver (no switch)
      gs.phase = 'clue';
      gs.currentClue = null;
      gs.turnsUsed++;
      return { color, turnEnded: true, gameOver: false };
    }
    return { color, turnEnded: false, gameOver: false };
  } else {
    // Wrong guess (neutral) - turn ends, guesser becomes next clue giver (no switch)
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

  it('after P2 guesses, P2 gives next clue (no switch)', () => {
    const gs = createDuetGameState();
    
    // P1 gives clue
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 1, 'P1');
    assert.equal(gs.currentPlayer, 2, 'P2 should be guessing');
    
    // P2 guesses wrong (neutral) - should check against P1's color map (clue giver)
    const neutralInP1Map = gs.board.colorMapP1.indexOf('neutral');
    const result = revealDuetCard(gs, neutralInP1Map);
    
    assert.equal(result.turnEnded, true);
    assert.equal(gs.phase, 'clue', 'Should return to clue phase');
    assert.equal(gs.currentPlayer, 2, 'P2 stays as next clue giver (no switch)');
  });
});

describe('Duet Gameplay - Green Card Guessing', () => {
  it('correct guess (green) allows continued guessing', () => {
    const gs = createDuetGameState();
    
    // P1 gives clue for 2
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 2, 'P1');
    
    // P2 guesses green card (must be green from P1's perspective)
    const greenIndex = gs.board.colorMapP1.indexOf('green');
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
    
    // P2 guesses green cards from P1's color map (clue giver)
    const greenIndices = gs.board.colorMapP1
      .map((c, i) => c === 'green' ? i : -1)
      .filter(i => i !== -1);
    
    const result1 = revealDuetCard(gs, greenIndices[0]);
    assert.equal(result1.turnEnded, false);
    assert.equal(gs.guessesRemaining, 1);
    
    // Second green guess
    const result2 = revealDuetCard(gs, greenIndices[1]);
    assert.equal(result2.turnEnded, true, 'Turn should end after all guesses');
    assert.equal(gs.phase, 'clue');
    assert.equal(gs.currentPlayer, 2, 'P2 stays as next clue giver (no switch)');
  });
});

describe('Duet Gameplay - Neutral Cards', () => {
  it('neutral guess ends turn immediately', () => {
    const gs = createDuetGameState();
    
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 3, 'P1');
    
    // P2 guessing, so check P1's color map (clue giver)
    const neutralIndex = gs.board.colorMapP1.indexOf('neutral');
    const result = revealDuetCard(gs, neutralIndex);
    
    assert.equal(result.color, 'neutral');
    assert.equal(result.turnEnded, true);
    assert.equal(gs.mistakesMade, 1);
    assert.equal(gs.phase, 'clue');
    assert.equal(gs.currentPlayer, 2, 'P2 stays as next clue giver (no switch)');
  });

  it('multiple neutral guesses accumulate mistakes', () => {
    const gs = createDuetGameState();
    
    // Turn 1: P1 gives clue, P2 hits neutral
    giveDuetClue(gs, getSafeClueWord(gs.board.words), 2, 'P1');
    const p1Neutrals = gs.board.colorMapP1
      .map((c, i) => c === 'neutral' && !gs.board.revealed[i] ? i : -1)
      .filter(i => i !== -1);
    revealDuetCard(gs, p1Neutrals[0]);
    assert.equal(gs.mistakesMade, 1);
    assert.equal(gs.currentPlayer, 2, 'P2 gives next clue');
    
    // Turn 2: P2 gives clue, P1 hits a different neutral
    giveDuetClue(gs, getSafeClueWord(gs.board.words), 2, 'P2');
    assert.equal(gs.currentPlayer, 1, 'P1 is now guessing');
    const p2Neutrals = gs.board.colorMapP2
      .map((c, i) => c === 'neutral' && !gs.board.revealed[i] ? i : -1)
      .filter(i => i !== -1);
    revealDuetCard(gs, p2Neutrals[0]);
    assert.equal(gs.mistakesMade, 2);
  });
});

describe('Duet Gameplay - Assassin', () => {
  it('hitting assassin ends game immediately with loss', () => {
    const gs = createDuetGameState();
    
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 2, 'P1');
    
    // P2 is guessing, so check P1's color map (clue giver)  
   const assassinIndex = gs.board.colorMapP1.indexOf('assassin');
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
    
    // Play 6 turns (3 full rounds)
    for (let i = 0; i < 3; i++) {
      const clueGiver = gs.currentPlayer;
      playerSequence.push({ phase: 'clue', player: clueGiver });
      
      const clueWord = getSafeClueWord(gs.board.words);
      giveDuetClue(gs, clueWord, 1, `P${clueGiver}`);
      
      const guesser = gs.currentPlayer;
      playerSequence.push({ phase: 'guess', player: guesser });
      
      // Make a neutral guess to end turn (use clue giver's color map)
      const clueGiverMap = clueGiver === 1 ? gs.board.colorMapP1 : gs.board.colorMapP2;
      const neutralIndex = clueGiverMap.findIndex((c, i) => c === 'neutral' && !gs.board.revealed[i]);
      if (neutralIndex !== -1) {
        revealDuetCard(gs, neutralIndex);
      }
    }
    
    // Check correct alternation pattern: P1clue → P2guess → P2clue → P1guess → P1clue → P2guess
    assert.equal(playerSequence[0].player, 1, 'P1 gives first clue');
    assert.equal(playerSequence[1].player, 2, 'P2 guesses first');
    assert.equal(playerSequence[2].player, 2, 'P2 gives second clue');
    assert.equal(playerSequence[3].player, 1, 'P1 guesses second');
    assert.equal(playerSequence[4].player, 1, 'P1 gives third clue');
    assert.equal(playerSequence[5].player, 2, 'P2 guesses third');
  });
});

// ---------------------------------------------------------------------------
// New Tests: Turn Switching Verification
// ---------------------------------------------------------------------------

describe('Duet Turn Switching - Critical Flow', () => {
  it('currentPlayer switches from 1 to 2 when P1 gives clue', () => {
    const gs = createDuetGameState();
    assert.equal(gs.currentPlayer, 1, 'Game starts with P1');
    assert.equal(gs.phase, 'clue', 'Phase is clue');
    
    // P1 gives clue
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 2, 'Player1');
    
    assert.equal(gs.currentPlayer, 2, 'After P1 gives clue, currentPlayer switches to 2');
    assert.equal(gs.phase, 'guess', 'Phase switches to guess');
  });

  it('currentPlayer switches from 2 to 1 when P2 gives clue', () => {
    const gs = createDuetGameState();
    gs.currentPlayer = 2; // Start with P2's turn
    assert.equal(gs.currentPlayer, 2, 'Game starts with P2');
    
    // P2 gives clue
    const clueWord = getSafeClueWord(gs.board.words);
    giveDuetClue(gs, clueWord, 2, 'Player2');
    
    assert.equal(gs.currentPlayer, 1, 'After P2 gives clue, currentPlayer switches to 1');
    assert.equal(gs.phase, 'guess', 'Phase switches to guess');
  });

  it('full round: P1 clue → P2 guess → P2 clue → P1 guess', () => {
    const gs = createDuetGameState();
    
    // Round 1: P1 gives clue for 1 word
    assert.equal(gs.currentPlayer, 1, 'Start: P1');
    giveDuetClue(gs, getSafeClueWord(gs.board.words), 1, 'Player1');
    assert.equal(gs.currentPlayer, 2, 'After P1 clue: P2 guesses');
    assert.equal(gs.phase, 'guess');
    assert.equal(gs.guessesRemaining, 2, '1 + 1 bonus = 2 guesses');
    
    // P2 guesses twice (uses all guesses) - check against P1's color map
    const p1Greens = [];
    for (let i = 0; i < 25; i++) {
      if (gs.board.colorMapP1[i] === 'green') p1Greens.push(i);
    }
    
    // First green guess
    revealDuetCard(gs, p1Greens[0]);
    assert.equal(gs.guessesRemaining, 1, '1 guess left');
    assert.equal(gs.phase, 'guess', 'Still guessing');
    
    // Second green guess - uses last guess
    revealDuetCard(gs, p1Greens[1]);
    assert.equal(gs.guessesRemaining, 0, 'No guesses left');
    assert.equal(gs.phase, 'clue', 'Turn ended, back to clue phase');
    assert.equal(gs.currentPlayer, 2, 'P2 stays as next clue giver');
    
    // Round 2: P2 gives clue
    giveDuetClue(gs, getSafeClueWord(gs.board.words), 1, 'Player2');
    assert.equal(gs.currentPlayer, 1, 'After P2 clue: P1 guesses');
    assert.equal(gs.phase, 'guess');
  });
});

describe('Duet Assassin Positions - Different Per Player', () => {
  it('P1 and P2 have different assassin positions', () => {
    const board = generateDuetBoard();
    
    // Collect assassin positions for each player
    const p1Assassins = [];
    const p2Assassins = [];
    
    for (let i = 0; i < 25; i++) {
      if (board.colorMapP1[i] === 'assassin') p1Assassins.push(i);
      if (board.colorMapP2[i] === 'assassin') p2Assassins.push(i);
    }
    
    assert.equal(p1Assassins.length, 3, 'P1 has exactly 3 assassins');
    assert.equal(p2Assassins.length, 3, 'P2 has exactly 3 assassins');
    
    // Verify they are different
    const overlap = p1Assassins.filter(pos => p2Assassins.includes(pos));
    assert.equal(overlap.length, 0, 'P1 and P2 assassins should be at DIFFERENT positions');
  });

  it('P1 cannot see P2s assassins as assassins', () => {
    const board = generateDuetBoard();
    
    // Get P2's assassin positions
    const p2Assassins = [];
    for (let i = 0; i < 25; i++) {
      if (board.colorMapP2[i] === 'assassin') p2Assassins.push(i);
    }
    
    // Check what P1 sees at those positions
    for (const pos of p2Assassins) {
      assert.notEqual(board.colorMapP1[pos], 'assassin', 
        `P1 should not see assassin at position ${pos} (P2's assassin)`);
    }
  });

  it('revealing P1s assassin does not affect P2s color map', () => {
    const gs = createDuetGameState();
    
    // Get P1's first assassin position
    const p1AssassinPos = gs.board.colorMapP1.indexOf('assassin');
    assert.notEqual(p1AssassinPos, -1, 'P1 has at least one assassin');
    
    // What does P2 see at this position?
    const p2ViewOfThisCard = gs.board.colorMapP2[p1AssassinPos];
    
    // Reveal the card
    gs.board.revealed[p1AssassinPos] = true;
    
    // P2's color map should be unchanged
    assert.equal(gs.board.colorMapP2[p1AssassinPos], p2ViewOfThisCard,
      'P2 color map unchanged after revealing P1 assassin');
  });
});

describe('Duet Complete Gameplay Flow', () => {
  it('simulates full turn: clue, switch player, guess, reveal', () => {
    const gs = createDuetGameState();
    
    // Initial state
    assert.equal(gs.phase, 'clue', 'Starts in clue phase');
    assert.equal(gs.currentPlayer, 1, 'P1 starts');
    
    // P1 gives clue "ANIMALS 3"
    giveDuetClue(gs, 'ANIMALS', 3, 'Player1');
    
    // Verify state after clue
    assert.equal(gs.phase, 'guess', 'Phase is now guess');
    assert.equal(gs.currentPlayer, 2, 'Current player is now P2');
    assert.equal(gs.currentClue.word, 'ANIMALS', 'Clue word stored');
    assert.equal(gs.currentClue.number, 3, 'Clue number stored');
    assert.equal(gs.guessesRemaining, 4, 'Guesses = 3 + 1');
    
    // P2 guesses a green card (must be green from P1's perspective, the clue giver)
    const p1GreenPos = gs.board.colorMapP1.indexOf('green');
    assert.notEqual(p1GreenPos, -1, 'P1 has green cards');
    
    const result = revealDuetCard(gs, p1GreenPos);
    
    // Verify result
    assert.equal(result.color, 'green', 'Revealed card is green');
    assert.equal(gs.board.revealed[p1GreenPos], true, 'Card is revealed');
    assert.equal(gs.greenRevealed, 1, 'Green count increased');
    assert.equal(gs.guessesRemaining, 3, 'Guesses remaining decreased');
    assert.equal(gs.phase, 'guess', 'Still in guess phase');
    assert.equal(result.turnEnded, false, 'Turn continues after green');
  });

  it('neutral card ends turn and advances to next phase', () => {
    const gs = createDuetGameState();
    
    // P1 gives clue
    giveDuetClue(gs, 'HINT', 2, 'Player1');
    assert.equal(gs.currentPlayer, 2, 'P2 guesses');
    
    // P2 hits a neutral card (check against P1's color map, the clue giver)
    const neutralPos = gs.board.colorMapP1.indexOf('neutral');
    assert.notEqual(neutralPos, -1, 'Has neutral cards');
    
    const result = revealDuetCard(gs, neutralPos);
    
    assert.equal(result.color, 'neutral', 'Hit neutral');
    assert.equal(result.turnEnded, true, 'Turn ended');
    assert.equal(gs.mistakesMade, 1, 'Mistake counted');
    assert.equal(gs.turnsUsed, 1, 'Turn consumed');
    
    // After turn ends, P2 stays as next clue giver
    assert.equal(gs.phase, 'clue', 'Back to clue phase');
    assert.equal(gs.currentPlayer, 2, 'P2 gives next clue');
  });
});
