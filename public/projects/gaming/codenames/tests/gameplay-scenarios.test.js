/**
 * Gameplay scenario tests — simulates full game flows using pure logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBoard,
  validateClue,
  checkGuessResult,
  checkWinCondition,
  canStartGame,
  getTeamPlayers,
  calculateGuessesAllowed
} from '../js/game/game-logic.js';

// ---------------------------------------------------------------------------
// Helpers: simulate a game state object for scenario testing
// ---------------------------------------------------------------------------

function createGameState(startingTeam = 'red') {
  const board = generateBoard(startingTeam);
  return {
    board,
    currentTurn: startingTeam,
    phase: 'clue',
    revealedCards: new Array(25).fill(false),
    currentClue: null,
    guessesRemaining: 0,
    redRevealed: 0,
    blueRevealed: 0,
    redTotal: startingTeam === 'red' ? 9 : 8,
    blueTotal: startingTeam === 'blue' ? 9 : 8,
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
  // Fallback: generate a unique word
  return 'CLUE' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Simulate giving a clue — mirrors firebase-sync handleGiveClue logic
 */
function giveClue(gs, word, number, spymasterName) {
  const { valid, error } = validateClue(word, number, gs.board.words);
  if (!valid) throw new Error(`Invalid clue: ${error}`);

  gs.phase = 'guess';
  gs.currentClue = { word: word.toUpperCase(), number, givenBy: spymasterName };
  gs.guessesRemaining = number === 0 ? 99 : number + 1;
  gs.clueLog.push({
    team: gs.currentTurn,
    spymaster: spymasterName,
    word: word.toUpperCase(),
    number,
    guesses: []
  });
}

/**
 * Simulate revealing a card — mirrors firebase-sync handleCardReveal logic
 * Returns { result, color, turnEnded, gameOver, winner }
 */
function revealCard(gs, cardIndex) {
  if (gs.revealedCards[cardIndex]) throw new Error('Card already revealed');

  const { result, color } = checkGuessResult(cardIndex, gs.board.colorMap, gs.currentTurn);
  gs.revealedCards[cardIndex] = true;

  if (color === 'red') gs.redRevealed++;
  if (color === 'blue') gs.blueRevealed++;

  // Log the guess
  const currentLogEntry = gs.clueLog[gs.clueLog.length - 1];
  currentLogEntry.guesses.push({
    cardIndex,
    word: gs.board.words[cardIndex],
    result
  });

  // Assassin = immediate loss
  if (result === 'assassin') {
    gs.winner = gs.currentTurn === 'red' ? 'blue' : 'red';
    gs.winReason = 'assassin';
    gs.currentClue = null;
    return { result, color, turnEnded: true, gameOver: true, winner: gs.winner };
  }

  // Check win by all_revealed
  const winCheck = checkWinCondition(gs.revealedCards, gs.board.colorMap, gs.redTotal, gs.blueTotal);
  if (winCheck.isOver) {
    gs.winner = winCheck.winner;
    gs.winReason = winCheck.reason;
    gs.currentClue = null;
    return { result, color, turnEnded: true, gameOver: true, winner: winCheck.winner };
  }

  // Correct guess — decrement remaining
  if (result === 'correct') {
    gs.guessesRemaining--;
    if (gs.guessesRemaining <= 0) {
      switchTurn(gs);
      return { result, color, turnEnded: true, gameOver: false, winner: null };
    }
    return { result, color, turnEnded: false, gameOver: false, winner: null };
  }

  // Neutral or opponent — switch turn
  switchTurn(gs);
  return { result, color, turnEnded: true, gameOver: false, winner: null };
}

function switchTurn(gs) {
  gs.currentTurn = gs.currentTurn === 'red' ? 'blue' : 'red';
  gs.phase = 'clue';
  gs.currentClue = null;
  gs.guessesRemaining = 0;
}

function endGuessing(gs) {
  const currentLogEntry = gs.clueLog[gs.clueLog.length - 1];
  currentLogEntry.guesses.push({ passed: true });
  switchTurn(gs);
}

/** Find card indices by color */
function findCardsByColor(gs, color) {
  return gs.board.colorMap
    .map((c, i) => c === color ? i : -1)
    .filter(i => i !== -1);
}

function findUnrevealedByColor(gs, color) {
  return findCardsByColor(gs, color).filter(i => !gs.revealedCards[i]);
}

// ---------------------------------------------------------------------------
// SCENARIO TESTS
// ---------------------------------------------------------------------------

describe('Full game: red wins by revealing all cards', () => {
  it('plays a complete game where red finds all 9 cards', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');
    assert.equal(redCards.length, 9);

    // Simulate multiple rounds of clue + guessing
    let cardsFound = 0;
    let round = 0;

    while (cardsFound < 9) {
      round++;
      const remaining = 9 - cardsFound;
      const batch = Math.min(remaining, 3);

      // Red spymaster gives clue
      giveClue(gs, `REDCLUE${round}`, batch, 'Alice');
      assert.equal(gs.phase, 'guess');

      // Red operatives guess correctly
      for (let i = 0; i < batch; i++) {
        const unrevealed = findUnrevealedByColor(gs, 'red');
        if (unrevealed.length === 0) break;
        const { result, gameOver } = revealCard(gs, unrevealed[0]);
        assert.equal(result, 'correct');
        cardsFound++;

        if (gameOver) {
          assert.equal(gs.winner, 'red');
          assert.equal(gs.winReason, 'all_revealed');
          return;
        }
      }

      // If turn didn't end from win, end guessing or turn switched from max guesses
      if (gs.phase === 'guess') {
        endGuessing(gs);
      }

      // Blue turn — give clue and pass
      if (!gs.winner) {
        giveClue(gs, `BLUECLUE${round}`, 1, 'Bob');
        endGuessing(gs);
      }
    }

    assert.equal(gs.winner, 'red');
  });
});

describe('Full game: assassin ends game immediately', () => {
  it('red team loses by hitting the assassin', () => {
    const gs = createGameState('red');
    const assassinIndex = gs.board.colorMap.indexOf('assassin');
    assert.ok(assassinIndex >= 0);

    giveClue(gs, 'BADCLUE', 1, 'Alice');
    const { result, gameOver, winner } = revealCard(gs, assassinIndex);

    assert.equal(result, 'assassin');
    assert.equal(gameOver, true);
    assert.equal(winner, 'blue');
    assert.equal(gs.winner, 'blue');
    assert.equal(gs.winReason, 'assassin');
  });

  it('blue team loses by hitting the assassin', () => {
    const gs = createGameState('red');
    // Red gives clue and passes, so it's blue's turn
    giveClue(gs, 'SKIP', 1, 'Alice');
    endGuessing(gs);
    assert.equal(gs.currentTurn, 'blue');

    const assassinIndex = gs.board.colorMap.indexOf('assassin');
    giveClue(gs, 'OOPS', 1, 'Bob');
    const { result, winner } = revealCard(gs, assassinIndex);

    assert.equal(result, 'assassin');
    assert.equal(winner, 'red');
  });
});

describe('Turn switching logic', () => {
  it('turn switches when hitting a neutral card', () => {
    const gs = createGameState('red');
    const neutralCards = findCardsByColor(gs, 'neutral');

    giveClue(gs, 'TESTCLUE', 2, 'Alice');
    const { result, turnEnded } = revealCard(gs, neutralCards[0]);

    assert.equal(result, 'neutral');
    assert.equal(turnEnded, true);
    assert.equal(gs.currentTurn, 'blue');
    assert.equal(gs.phase, 'clue');
  });

  it('turn switches when hitting opponent card', () => {
    const gs = createGameState('red');
    const blueCards = findCardsByColor(gs, 'blue');

    giveClue(gs, 'WRONG', 1, 'Alice');
    const { result, turnEnded } = revealCard(gs, blueCards[0]);

    assert.equal(result, 'opponent');
    assert.equal(turnEnded, true);
    assert.equal(gs.currentTurn, 'blue');
    // Opponent's revealed count goes up
    assert.equal(gs.blueRevealed, 1);
  });

  it('turn does NOT switch on correct guess with guesses remaining', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');

    giveClue(gs, 'GOODCLUE', 3, 'Alice');
    assert.equal(gs.guessesRemaining, 4); // number + 1

    const { result, turnEnded } = revealCard(gs, redCards[0]);
    assert.equal(result, 'correct');
    assert.equal(turnEnded, false);
    assert.equal(gs.currentTurn, 'red'); // still red's turn
    assert.equal(gs.guessesRemaining, 3);
  });

  it('turn switches when all guesses used up (correct guesses exhaust limit)', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');

    giveClue(gs, 'PRECISE', 2, 'Alice');
    assert.equal(gs.guessesRemaining, 3); // 2 + 1

    revealCard(gs, redCards[0]); // remaining: 2
    assert.equal(gs.guessesRemaining, 2);

    revealCard(gs, redCards[1]); // remaining: 1
    assert.equal(gs.guessesRemaining, 1);

    const { turnEnded } = revealCard(gs, redCards[2]); // remaining: 0
    assert.equal(turnEnded, true);
    assert.equal(gs.currentTurn, 'blue');
  });

  it('voluntary end guessing switches turn', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');
    const safeClue = getSafeClueWord(gs.board.words);

    giveClue(gs, safeClue, 3, 'Alice');
    revealCard(gs, redCards[0]); // correct, continue
    assert.equal(gs.currentTurn, 'red');

    endGuessing(gs);
    assert.equal(gs.currentTurn, 'blue');
    assert.equal(gs.phase, 'clue');
    // Check that "passed" is logged
    const lastGuess = gs.clueLog[0].guesses[gs.clueLog[0].guesses.length - 1];
    assert.equal(lastGuess.passed, true);
  });
});

describe('Guess result tracking in clue log', () => {
  it('tracks each guess with word and result', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');

    giveClue(gs, 'LOG', 3, 'Alice');
    revealCard(gs, redCards[0]);
    revealCard(gs, redCards[1]);

    const logEntry = gs.clueLog[0];
    assert.equal(logEntry.team, 'red');
    assert.equal(logEntry.spymaster, 'Alice');
    assert.equal(logEntry.word, 'LOG');
    assert.equal(logEntry.number, 3);
    assert.equal(logEntry.guesses.length, 2);
    assert.equal(logEntry.guesses[0].result, 'correct');
    assert.equal(logEntry.guesses[1].result, 'correct');
    assert.equal(logEntry.guesses[0].word, gs.board.words[redCards[0]]);
  });

  it('logs opponent hit correctly', () => {
    const gs = createGameState('red');
    const blueCards = findCardsByColor(gs, 'blue');

    giveClue(gs, 'MISS', 1, 'Alice');
    revealCard(gs, blueCards[0]);

    const logEntry = gs.clueLog[0];
    assert.equal(logEntry.guesses[0].result, 'opponent');
  });

  it('logs assassin hit correctly', () => {
    const gs = createGameState('red');
    const assassinIndex = gs.board.colorMap.indexOf('assassin');
    const safeClue = getSafeClueWord(gs.board.words);

    giveClue(gs, safeClue, 1, 'Alice');
    revealCard(gs, assassinIndex);

    assert.equal(gs.clueLog[0].guesses[0].result, 'assassin');
  });

  it('builds multi-round clue log', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');
    const blueCards = findCardsByColor(gs, 'blue');

    // Round 1: red clue
    giveClue(gs, 'ROUND1', 1, 'Alice');
    revealCard(gs, redCards[0]);
    endGuessing(gs);

    // Round 2: blue clue
    giveClue(gs, 'ROUND2', 1, 'Bob');
    revealCard(gs, blueCards[0]);
    endGuessing(gs);

    // Round 3: red clue
    giveClue(gs, 'ROUND3', 1, 'Alice');

    assert.equal(gs.clueLog.length, 3);
    assert.equal(gs.clueLog[0].team, 'red');
    assert.equal(gs.clueLog[1].team, 'blue');
    assert.equal(gs.clueLog[2].team, 'red');
  });
});

describe('Clue number 0 (unlimited guesses)', () => {
  it('allows unlimited guessing with 0 clue', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');

    giveClue(gs, 'UNLIMITED', 0, 'Alice');
    assert.equal(gs.guessesRemaining, 99);

    // Guess 5 correct cards without turn ending
    for (let i = 0; i < 5; i++) {
      const { turnEnded } = revealCard(gs, redCards[i]);
      assert.equal(turnEnded, false);
      assert.equal(gs.currentTurn, 'red');
    }

    // Voluntarily end
    endGuessing(gs);
    assert.equal(gs.currentTurn, 'blue');
  });
});

describe('Win condition: opponent reveals your last card', () => {
  it('blue wins when red accidentally reveals last blue card', () => {
    const gs = createGameState('red'); // red=9, blue=8
    const blueCards = findCardsByColor(gs, 'blue');

    // Reveal 7 of 8 blue cards via a "fake" mechanism
    for (let i = 0; i < 7; i++) {
      gs.revealedCards[blueCards[i]] = true;
      gs.blueRevealed++;
    }

    // Red gives clue and accidentally picks last blue card
    giveClue(gs, 'OOPS', 1, 'Alice');
    const { result, gameOver, winner } = revealCard(gs, blueCards[7]);

    assert.equal(result, 'opponent');
    assert.equal(gameOver, true);
    assert.equal(winner, 'blue');
    assert.equal(gs.winReason, 'all_revealed');
  });
});

describe('Board generation consistency', () => {
  it('always produces valid boards across 50 generations', () => {
    for (let i = 0; i < 50; i++) {
      const team = i % 2 === 0 ? 'red' : 'blue';
      const board = generateBoard(team);

      assert.equal(board.words.length, 25);
      assert.equal(board.colorMap.length, 25);
      assert.equal(new Set(board.words).size, 25, 'Duplicate words found');

      const counts = { red: 0, blue: 0, neutral: 0, assassin: 0 };
      board.colorMap.forEach(c => counts[c]++);

      const startCount = team === 'red' ? counts.red : counts.blue;
      const otherCount = team === 'red' ? counts.blue : counts.red;
      assert.equal(startCount, 9, `Starting team should have 9 cards`);
      assert.equal(otherCount, 8, `Other team should have 8 cards`);
      assert.equal(counts.neutral, 7);
      assert.equal(counts.assassin, 1);
    }
  });
});

describe('canStartGame edge cases', () => {
  it('rejects all players unassigned to teams', () => {
    const players = {
      p1: { name: 'A', team: null, role: null, isActive: true },
      p2: { name: 'B', team: null, role: null, isActive: true },
    };
    const { canStart } = canStartGame(players);
    assert.equal(canStart, false);
  });

  it('rejects one team assigned, other unassigned', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
      p2: { name: 'B', team: null, role: null, isActive: true },
    };
    const { canStart, errors } = canStartGame(players);
    assert.equal(canStart, false);
    assert.ok(errors.some(e => e.includes('Blue')));
  });

  it('allows large teams (3 operatives + 1 spymaster per team)', () => {
    const players = {};
    for (let i = 0; i < 4; i++) {
      players[`r${i}`] = { name: `R${i}`, team: 'red', role: i === 0 ? 'spymaster' : 'operative', isActive: true };
      players[`b${i}`] = { name: `B${i}`, team: 'blue', role: i === 0 ? 'spymaster' : 'operative', isActive: true };
    }
    const { canStart } = canStartGame(players);
    assert.equal(canStart, true);
  });

  it('rejects when all players are inactive', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: false },
      p2: { name: 'B', team: 'blue', role: 'spymaster', isActive: false },
    };
    const { canStart } = canStartGame(players);
    assert.equal(canStart, false);
  });

  it('handles mix of active/inactive across teams', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
      p2: { name: 'B', team: 'red', role: 'operative', isActive: false },
      p3: { name: 'C', team: 'blue', role: 'spymaster', isActive: true },
      p4: { name: 'D', team: 'blue', role: 'operative', isActive: false },
    };
    const { canStart } = canStartGame(players);
    assert.equal(canStart, true);
  });
});

describe('getTeamPlayers edge cases', () => {
  it('returns empty array for team with no players', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
    };
    assert.deepEqual(getTeamPlayers(players, 'blue'), []);
  });

  it('returns empty for empty players object', () => {
    assert.deepEqual(getTeamPlayers({}, 'red'), []);
  });

  it('includes player id in result', () => {
    const players = {
      'abc-123': { name: 'A', team: 'red', role: 'spymaster', isActive: true },
    };
    const result = getTeamPlayers(players, 'red');
    assert.equal(result[0].id, 'abc-123');
    assert.equal(result[0].role, 'spymaster');
  });
});

describe('validateClue edge cases', () => {
  const boardWords = ['APPLE', 'BANK', 'BRIDGE'];

  it('accepts hyphenated words', () => {
    assert.equal(validateClue('WELL-KNOWN', 2, boardWords).valid, true);
  });

  it('rejects tabs in clue', () => {
    assert.equal(validateClue('WORD\tTWO', 2, boardWords).valid, false);
  });

  it('trims whitespace before validating', () => {
    assert.equal(validateClue('  FRUIT  ', 2, boardWords).valid, true);
  });

  it('case-insensitive board word match', () => {
    assert.equal(validateClue('Bridge', 1, boardWords).valid, false);
    assert.equal(validateClue('BRIDGE', 1, boardWords).valid, false);
    assert.equal(validateClue('bridge', 1, boardWords).valid, false);
  });

  it('rejects NaN as number', () => {
    assert.equal(validateClue('WORD', NaN, boardWords).valid, false);
  });

  it('rejects float numbers', () => {
    assert.equal(validateClue('WORD', 2.5, boardWords).valid, false);
  });
});

describe('calculateGuessesAllowed edge cases', () => {
  it('returns 2 for clue number 1', () => {
    assert.equal(calculateGuessesAllowed(1), 2);
  });

  it('returns 10 for clue number 9', () => {
    assert.equal(calculateGuessesAllowed(9), 10);
  });
});

describe('Multi-round gameplay simulation', () => {
  it('simulates a full 4-round game alternating turns', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');
    const blueCards = findCardsByColor(gs, 'blue');

    let redIdx = 0;
    let blueIdx = 0;

    // Round 1: Red clue "ANIMAL" 2, guesses 2 correct, passes
    assert.equal(gs.currentTurn, 'red');
    giveClue(gs, 'ANIMAL', 2, 'Alice');
    revealCard(gs, redCards[redIdx++]); // correct
    revealCard(gs, redCards[redIdx++]); // correct
    endGuessing(gs);
    assert.equal(gs.redRevealed, 2);
    assert.equal(gs.currentTurn, 'blue');

    // Round 2: Blue clue "WATER" 1, guesses 1 correct, turn auto-ends
    giveClue(gs, 'WATER', 1, 'Bob');
    revealCard(gs, blueCards[blueIdx++]); // correct, remaining=1
    // Still has 1 guess left, let's use it
    const { turnEnded } = revealCard(gs, blueCards[blueIdx++]); // correct, remaining=0
    assert.equal(turnEnded, true);
    assert.equal(gs.blueRevealed, 2);
    assert.equal(gs.currentTurn, 'red');

    // Round 3: Red hits a neutral
    giveClue(gs, 'NATURE', 2, 'Alice');
    const neutralCards = findUnrevealedByColor(gs, 'neutral');
    revealCard(gs, neutralCards[0]);
    assert.equal(gs.currentTurn, 'blue');

    // Round 4: Blue hits a red card (opponent)
    giveClue(gs, 'OCEAN', 1, 'Bob');
    revealCard(gs, redCards[redIdx++]); // opponent card
    assert.equal(gs.currentTurn, 'red');
    assert.equal(gs.redRevealed, 3); // red got credit

    // Verify clue log has 4 entries
    assert.equal(gs.clueLog.length, 4);
    assert.equal(gs.clueLog[0].word, 'ANIMAL');
    assert.equal(gs.clueLog[1].word, 'WATER');
    assert.equal(gs.clueLog[2].word, 'NATURE');
    assert.equal(gs.clueLog[3].word, 'OCEAN');
  });
});

describe('checkWinCondition edge cases', () => {
  it('does not trigger win when only neutrals are revealed', () => {
    const colorMap = [
      ...Array(9).fill('red'), ...Array(8).fill('blue'),
      ...Array(7).fill('neutral'), 'assassin'
    ];
    const revealed = Array(25).fill(false);
    // Reveal all 7 neutrals
    for (let i = 17; i < 24; i++) revealed[i] = true;

    const result = checkWinCondition(revealed, colorMap, 9, 8);
    assert.equal(result.isOver, false);
  });

  it('detects win even with many other cards also revealed', () => {
    const colorMap = [
      ...Array(9).fill('red'), ...Array(8).fill('blue'),
      ...Array(7).fill('neutral'), 'assassin'
    ];
    const revealed = Array(25).fill(true);
    // Everything revealed — both teams should win, but red is checked first
    const result = checkWinCondition(revealed, colorMap, 9, 8);
    assert.equal(result.isOver, true);
    assert.equal(result.winner, 'red');
  });

  it('blue wins when blue starts (9 blue cards)', () => {
    const colorMap = [
      ...Array(8).fill('red'), ...Array(9).fill('blue'),
      ...Array(7).fill('neutral'), 'assassin'
    ];
    const revealed = Array(25).fill(false);
    // Reveal all 9 blue cards
    for (let i = 8; i < 17; i++) revealed[i] = true;

    const result = checkWinCondition(revealed, colorMap, 8, 9);
    assert.equal(result.isOver, true);
    assert.equal(result.winner, 'blue');
  });

  it('no winner with 8 of 9 cards revealed', () => {
    const colorMap = [
      ...Array(9).fill('red'), ...Array(8).fill('blue'),
      ...Array(7).fill('neutral'), 'assassin'
    ];
    const revealed = Array(25).fill(false);
    for (let i = 0; i < 8; i++) revealed[i] = true; // 8 of 9 red

    const result = checkWinCondition(revealed, colorMap, 9, 8);
    assert.equal(result.isOver, false);
  });
});

describe('Reveal card prevents double-reveal', () => {
  it('throws when trying to reveal an already revealed card', () => {
    const gs = createGameState('red');
    const redCards = findCardsByColor(gs, 'red');

    giveClue(gs, 'TEST', 2, 'Alice');
    revealCard(gs, redCards[0]);

    assert.throws(() => revealCard(gs, redCards[0]), /already revealed/);
  });
});
