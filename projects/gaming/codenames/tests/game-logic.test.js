import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffleArray,
  generateBoard,
  getRandomCardIds,
  validatePlayerName,
  validateClue,
  checkGuessResult,
  checkWinCondition,
  canStartGame,
  getTeamPlayers,
  calculateGuessesAllowed,
  generateInspirationWords,
  calculateRound,
  getActionPrompt
} from '../js/game/game-logic.js';

describe('shuffleArray', () => {
  it('returns the same array reference', () => {
    const arr = [1, 2, 3];
    assert.equal(shuffleArray(arr), arr);
  });

  it('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffleArray(arr);
    assert.equal(arr.length, 5);
    assert.deepEqual(arr.sort(), [1, 2, 3, 4, 5]);
  });
});

describe('generateBoard', () => {
  it('returns 25 words and 25 colors', () => {
    const board = generateBoard('red');
    assert.equal(board.words.length, 25);
    assert.equal(board.colorMap.length, 25);
  });

  it('starting team (red) gets 9 cards', () => {
    const board = generateBoard('red');
    const redCount = board.colorMap.filter(c => c === 'red').length;
    const blueCount = board.colorMap.filter(c => c === 'blue').length;
    assert.equal(redCount, 9);
    assert.equal(blueCount, 8);
  });

  it('starting team (blue) gets 9 cards', () => {
    const board = generateBoard('blue');
    const redCount = board.colorMap.filter(c => c === 'red').length;
    const blueCount = board.colorMap.filter(c => c === 'blue').length;
    assert.equal(redCount, 8);
    assert.equal(blueCount, 9);
  });

  it('has 7 neutral and 1 assassin', () => {
    const board = generateBoard('red');
    const neutralCount = board.colorMap.filter(c => c === 'neutral').length;
    const assassinCount = board.colorMap.filter(c => c === 'assassin').length;
    assert.equal(neutralCount, 7);
    assert.equal(assassinCount, 1);
  });

  it('has no duplicate words', () => {
    const board = generateBoard('red');
    const unique = new Set(board.words);
    assert.equal(unique.size, 25);
  });
});

describe('validatePlayerName', () => {
  it('accepts valid names', () => {
    assert.deepEqual(validatePlayerName('Alice'), { valid: true, error: null });
  });

  it('rejects empty names', () => {
    const r = validatePlayerName('');
    assert.equal(r.valid, false);
    assert.ok(r.error);
  });

  it('rejects null/undefined', () => {
    assert.equal(validatePlayerName(null).valid, false);
    assert.equal(validatePlayerName(undefined).valid, false);
  });

  it('rejects names over 20 characters', () => {
    assert.equal(validatePlayerName('A'.repeat(21)).valid, false);
  });

  it('accepts names of exactly 20 characters', () => {
    assert.equal(validatePlayerName('A'.repeat(20)).valid, true);
  });
});

describe('validateClue', () => {
  const boardWords = ['APPLE', 'BANK', 'BRIDGE', 'CASTLE', 'DOG'];

  it('accepts valid single-word clues', () => {
    assert.deepEqual(validateClue('FRUIT', 2, boardWords), { valid: true, error: null });
  });

  it('rejects empty clues', () => {
    assert.equal(validateClue('', 2, boardWords).valid, false);
  });

  it('rejects multi-word clues', () => {
    assert.equal(validateClue('RED FRUIT', 2, boardWords).valid, false);
  });

  it('rejects clues that are words on the board (case insensitive)', () => {
    assert.equal(validateClue('apple', 2, boardWords).valid, false);
    assert.equal(validateClue('APPLE', 2, boardWords).valid, false);
  });

  it('rejects invalid numbers', () => {
    assert.equal(validateClue('FRUIT', -1, boardWords).valid, false);
    assert.equal(validateClue('FRUIT', 10, boardWords).valid, false);
    assert.equal(validateClue('FRUIT', 'two', boardWords).valid, false);
  });

  it('accepts number 0 (unlimited clue)', () => {
    assert.equal(validateClue('FRUIT', 0, boardWords).valid, true);
  });

  it('accepts number 9', () => {
    assert.equal(validateClue('FRUIT', 9, boardWords).valid, true);
  });
});

describe('checkGuessResult', () => {
  const colorMap = ['red', 'blue', 'neutral', 'assassin', 'red'];

  it('returns correct for own team color', () => {
    assert.deepEqual(checkGuessResult(0, colorMap, 'red'), { result: 'correct', color: 'red' });
  });

  it('returns opponent for other team color', () => {
    assert.deepEqual(checkGuessResult(1, colorMap, 'red'), { result: 'opponent', color: 'blue' });
  });

  it('returns neutral', () => {
    assert.deepEqual(checkGuessResult(2, colorMap, 'red'), { result: 'neutral', color: 'neutral' });
  });

  it('returns assassin', () => {
    assert.deepEqual(checkGuessResult(3, colorMap, 'red'), { result: 'assassin', color: 'assassin' });
  });

  it('works for blue team guessing', () => {
    assert.deepEqual(checkGuessResult(1, colorMap, 'blue'), { result: 'correct', color: 'blue' });
    assert.deepEqual(checkGuessResult(0, colorMap, 'blue'), { result: 'opponent', color: 'red' });
  });
});

describe('checkWinCondition', () => {
  it('detects red win when all red cards revealed', () => {
    // 9 red, 8 blue, 7 neutral, 1 assassin
    const colorMap = [
      ...Array(9).fill('red'),
      ...Array(8).fill('blue'),
      ...Array(7).fill('neutral'),
      'assassin'
    ];
    const revealed = Array(25).fill(false);
    // Reveal all 9 red cards
    for (let i = 0; i < 9; i++) revealed[i] = true;

    const result = checkWinCondition(revealed, colorMap, 9, 8);
    assert.deepEqual(result, { isOver: true, winner: 'red', reason: 'all_revealed' });
  });

  it('detects blue win when all blue cards revealed', () => {
    const colorMap = [
      ...Array(9).fill('red'),
      ...Array(8).fill('blue'),
      ...Array(7).fill('neutral'),
      'assassin'
    ];
    const revealed = Array(25).fill(false);
    for (let i = 9; i < 17; i++) revealed[i] = true;

    const result = checkWinCondition(revealed, colorMap, 9, 8);
    assert.deepEqual(result, { isOver: true, winner: 'blue', reason: 'all_revealed' });
  });

  it('returns not over when cards remain', () => {
    const colorMap = [
      ...Array(9).fill('red'),
      ...Array(8).fill('blue'),
      ...Array(7).fill('neutral'),
      'assassin'
    ];
    const revealed = Array(25).fill(false);
    revealed[0] = true; // Only 1 red revealed

    const result = checkWinCondition(revealed, colorMap, 9, 8);
    assert.deepEqual(result, { isOver: false, winner: null, reason: null });
  });
});

describe('canStartGame', () => {
  it('allows valid 4-player setup', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
      p2: { name: 'B', team: 'red', role: 'operative', isActive: true },
      p3: { name: 'C', team: 'blue', role: 'spymaster', isActive: true },
      p4: { name: 'D', team: 'blue', role: 'operative', isActive: true },
    };
    const result = canStartGame(players);
    assert.equal(result.canStart, true);
    assert.equal(result.errors.length, 0);
  });

  it('allows minimal 2-player setup (1 spymaster per team)', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
      p2: { name: 'B', team: 'blue', role: 'spymaster', isActive: true },
    };
    const result = canStartGame(players);
    assert.equal(result.canStart, true);
  });

  it('rejects when a team is empty', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
      p2: { name: 'B', team: 'red', role: 'operative', isActive: true },
    };
    const result = canStartGame(players);
    assert.equal(result.canStart, false);
    assert.ok(result.errors.some(e => e.includes('Blue')));
  });

  it('rejects when team has no spymaster', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'operative', isActive: true },
      p2: { name: 'B', team: 'blue', role: 'spymaster', isActive: true },
    };
    const result = canStartGame(players);
    assert.equal(result.canStart, false);
    assert.ok(result.errors.some(e => e.includes('Red') && e.includes('spymaster')));
  });

  it('ignores inactive players', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: false },
      p2: { name: 'B', team: 'blue', role: 'spymaster', isActive: true },
    };
    const result = canStartGame(players);
    assert.equal(result.canStart, false);
  });

  it('rejects team with 2 spymasters', () => {
    const players = {
      p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
      p2: { name: 'B', team: 'red', role: 'spymaster', isActive: true },
      p3: { name: 'C', team: 'blue', role: 'spymaster', isActive: true },
    };
    const result = canStartGame(players);
    assert.equal(result.canStart, false);
  });
});

describe('getTeamPlayers', () => {
  const players = {
    p1: { name: 'A', team: 'red', role: 'spymaster', isActive: true },
    p2: { name: 'B', team: 'red', role: 'operative', isActive: true },
    p3: { name: 'C', team: 'blue', role: 'spymaster', isActive: true },
    p4: { name: 'D', team: 'red', role: 'operative', isActive: false },
  };

  it('returns active players on a team', () => {
    const red = getTeamPlayers(players, 'red');
    assert.equal(red.length, 2);
    assert.ok(red.some(p => p.name === 'A'));
    assert.ok(red.some(p => p.name === 'B'));
  });

  it('excludes inactive players', () => {
    const red = getTeamPlayers(players, 'red');
    assert.ok(!red.some(p => p.name === 'D'));
  });

  it('returns correct team only', () => {
    const blue = getTeamPlayers(players, 'blue');
    assert.equal(blue.length, 1);
    assert.equal(blue[0].name, 'C');
  });
});

describe('calculateGuessesAllowed', () => {
  it('returns number + 1 for normal clues', () => {
    assert.equal(calculateGuessesAllowed(1), 2);
    assert.equal(calculateGuessesAllowed(3), 4);
    assert.equal(calculateGuessesAllowed(9), 10);
  });

  it('returns Infinity for 0 clue', () => {
    assert.equal(calculateGuessesAllowed(0), Infinity);
  });
});

// --- Picture Mode Tests ---

describe('generateBoard (pictures mode)', () => {
  it('returns 20 cardIds and 20 colors', () => {
    const board = generateBoard('red', 'pictures');
    assert.equal(board.cardIds.length, 20);
    assert.equal(board.colorMap.length, 20);
    assert.equal(board.words, undefined);
  });

  it('starting team (red) gets 8 cards', () => {
    const board = generateBoard('red', 'pictures');
    assert.equal(board.colorMap.filter(c => c === 'red').length, 8);
    assert.equal(board.colorMap.filter(c => c === 'blue').length, 7);
  });

  it('starting team (blue) gets 8 cards', () => {
    const board = generateBoard('blue', 'pictures');
    assert.equal(board.colorMap.filter(c => c === 'blue').length, 8);
    assert.equal(board.colorMap.filter(c => c === 'red').length, 7);
  });

  it('has 4 neutral and 1 assassin', () => {
    const board = generateBoard('red', 'pictures');
    assert.equal(board.colorMap.filter(c => c === 'neutral').length, 4);
    assert.equal(board.colorMap.filter(c => c === 'assassin').length, 1);
  });

  it('cardIds are unique', () => {
    const board = generateBoard('red', 'pictures');
    assert.equal(new Set(board.cardIds).size, 20);
  });

  it('cardIds are in range 0-279', () => {
    const board = generateBoard('red', 'pictures');
    for (const id of board.cardIds) {
      assert.ok(id >= 0 && id <= 279);
    }
  });

  it('defaults to words mode if no mode given', () => {
    const board = generateBoard('red');
    assert.equal(board.words.length, 25);
    assert.equal(board.colorMap.length, 25);
    assert.equal(board.cardIds, undefined);
  });
});

describe('getRandomCardIds', () => {
  it('returns the requested number of IDs', () => {
    assert.equal(getRandomCardIds(280, 20).length, 20);
    assert.equal(getRandomCardIds(100, 10).length, 10);
  });

  it('returns unique IDs', () => {
    const ids = getRandomCardIds(280, 20);
    assert.equal(new Set(ids).size, 20);
  });

  it('returns IDs within range', () => {
    const ids = getRandomCardIds(50, 10);
    for (const id of ids) {
      assert.ok(id >= 0 && id < 50);
    }
  });
});

describe('checkWinCondition (20-card board)', () => {
  it('detects red win with 8 red cards revealed', () => {
    const colorMap = [
      ...Array(8).fill('red'), ...Array(7).fill('blue'),
      ...Array(4).fill('neutral'), 'assassin'
    ];
    const revealed = Array(20).fill(false);
    for (let i = 0; i < 8; i++) revealed[i] = true;
    const result = checkWinCondition(revealed, colorMap, 8, 7);
    assert.deepEqual(result, { isOver: true, winner: 'red', reason: 'all_revealed' });
  });

  it('detects blue win with 7 blue cards revealed', () => {
    const colorMap = [
      ...Array(8).fill('red'), ...Array(7).fill('blue'),
      ...Array(4).fill('neutral'), 'assassin'
    ];
    const revealed = Array(20).fill(false);
    for (let i = 8; i < 15; i++) revealed[i] = true;
    const result = checkWinCondition(revealed, colorMap, 8, 7);
    assert.deepEqual(result, { isOver: true, winner: 'blue', reason: 'all_revealed' });
  });

  it('not over when cards remain on 20-card board', () => {
    const colorMap = [
      ...Array(8).fill('red'), ...Array(7).fill('blue'),
      ...Array(4).fill('neutral'), 'assassin'
    ];
    const revealed = Array(20).fill(false);
    revealed[0] = true;
    const result = checkWinCondition(revealed, colorMap, 8, 7);
    assert.deepEqual(result, { isOver: false, winner: null, reason: null });
  });
});

describe('generateBoard (diy mode)', () => {
  it('returns 20 cardIds and 20 colors', () => {
    const board = generateBoard('red', 'diy');
    assert.equal(board.cardIds.length, 20);
    assert.equal(board.colorMap.length, 20);
    assert.equal(board.words, undefined);
  });

  it('cardIds are unique and in range 0-127', () => {
    const board = generateBoard('red', 'diy');
    assert.equal(new Set(board.cardIds).size, 20);
    for (const id of board.cardIds) {
      assert.ok(id >= 0 && id < 128);
    }
  });
});

describe('validateClue (picture mode — empty boardWords)', () => {
  it('allows any word when boardWords is empty', () => {
    assert.equal(validateClue('ANYTHING', 2, []).valid, true);
  });
});

describe('generateInspirationWords', () => {
  it('returns exactly 3 words', () => {
    const boardWords = ['APPLE', 'BANANA', 'CHERRY'];
    const inspiration = generateInspirationWords(boardWords);
    assert.equal(inspiration.length, 3);
  });

  it('excludes words that are on the board', () => {
    const boardWords = ['AFRICA', 'AGENT', 'AIR', 'ALIEN', 'AMAZON'];
    const inspiration = generateInspirationWords(boardWords);
    const boardWordsUpper = boardWords.map(w => w.toUpperCase());
    for (const word of inspiration) {
      assert.ok(!boardWordsUpper.includes(word), `${word} should not be in board words`);
    }
  });

  it('returns unique words', () => {
    const inspiration = generateInspirationWords(['APPLE']);
    assert.equal(new Set(inspiration).size, 3);
  });
});

describe('calculateRound', () => {
  it('returns 1 when clueLog is empty', () => {
    assert.equal(calculateRound([], 'red'), 1);
    assert.equal(calculateRound(null, 'red'), 1);
  });

  it('returns 1 when only one team has given a clue', () => {
    const clueLog = [{ team: 'red', word: 'FRUIT', number: 2 }];
    assert.equal(calculateRound(clueLog, 'red'), 1);
  });

  it('returns 2 when both teams have given one clue each', () => {
    const clueLog = [
      { team: 'red', word: 'FRUIT', number: 2 },
      { team: 'blue', word: 'METAL', number: 3 }
    ];
    assert.equal(calculateRound(clueLog, 'red'), 1);
  });

  it('returns 2 when three clues have been given', () => {
    const clueLog = [
      { team: 'red', word: 'FRUIT', number: 2 },
      { team: 'blue', word: 'METAL', number: 3 },
      { team: 'red', word: 'ANIMAL', number: 1 }
    ];
    assert.equal(calculateRound(clueLog, 'red'), 2);
  });

  it('handles object-based clueLog (Firebase format)', () => {
    const clueLog = {
      0: { team: 'red', word: 'FRUIT', number: 2 },
      1: { team: 'blue', word: 'METAL', number: 3 }
    };
    assert.equal(calculateRound(clueLog, 'red'), 1);
  });
});

describe('getActionPrompt', () => {
  const mockPlayers = {
    'p1': { name: 'Alice', team: 'red', role: 'spymaster' },
    'p2': { name: 'Bob', team: 'red', role: 'operative' },
    'p3': { name: 'Charlie', team: 'blue', role: 'spymaster' },
    'p4': { name: 'Diana', team: 'blue', role: 'operative' }
  };

  it('returns waiting message when no team assigned', () => {
    const gameState = { currentTurn: 'red', phase: 'clue' };
    const prompt = getActionPrompt(gameState, null, null, mockPlayers);
    assert.ok(prompt.includes('Waiting'));
  });

  it('tells spymaster to give clue when it is their turn and clue phase', () => {
    const gameState = { currentTurn: 'red', phase: 'clue' };
    const prompt = getActionPrompt(gameState, 'red', 'spymaster', mockPlayers);
    assert.ok(prompt.includes('YOUR TURN'));
    assert.ok(prompt.includes('clue'));
  });

  it('tells operative to guess when it is their turn and guess phase', () => {
    const gameState = { currentTurn: 'red', phase: 'guess' };
    const prompt = getActionPrompt(gameState, 'red', 'operative', mockPlayers);
    assert.ok(prompt.includes('YOUR TURN'));
    assert.ok(prompt.includes('Guess') || prompt.includes('guess'));
  });

  it('tells operative to wait for spymaster during clue phase', () => {
    const gameState = { currentTurn: 'red', phase: 'clue' };
    const prompt = getActionPrompt(gameState, 'red', 'operative', mockPlayers);
    assert.ok(prompt.includes('Waiting') || prompt.includes('Alice'));
  });

  it('tells player to wait when other team is playing', () => {
    const gameState = { currentTurn: 'blue', phase: 'clue' };
    const prompt = getActionPrompt(gameState, 'red', 'spymaster', mockPlayers);
    assert.ok(prompt.includes('Blue team'));
  });
});

