// Game state management with localStorage persistence
import { LEVELS } from '../data/levels.js';

// Default state template
const DEFAULT_STATE = {
  playerName: '',
  trainer: 'ash',
  starter: 'pikachu',
  currentChapter: 0,
  currentQuestion: 0,  // Track question within chapter
  questionsCorrect: 0, // Questions correct in current chapter
  score: 0,
  streak: 0,
  maxStreak: 0,
  collection: [],
  badges: [],
  stars: 0,
  completedChapters: [],
  // Per-chapter progress tracking
  chapterProgress: {} // { chapterId: { questionsAnswered, questionsCorrect, enemyHP } }
};

// Current game state
export let gameState = { ...DEFAULT_STATE };
export let currentLevel = null;

// Battle state (not persisted)
export let battleState = {
  currentEnemy: null,
  currentQuestion: null,
  questionsAnswered: 0,
  enemyHP: 100
};

export function setCurrentLevel(level) {
  currentLevel = level;
}

export function getCurrentLevel() {
  return currentLevel;
}

export function getLevelConfig() {
  return currentLevel ? LEVELS[currentLevel] : null;
}

export function getCurrentChapter() {
  const level = getLevelConfig();
  return level ? level.chapters[gameState.currentChapter] : null;
}

// Save game to localStorage
export function saveGame() {
  if (!currentLevel) return;
  const key = LEVELS[currentLevel].storageKey;

  // Save current battle progress in chapterProgress
  if (battleState.questionsAnswered > 0) {
    const chapterId = gameState.currentChapter;
    gameState.chapterProgress[chapterId] = {
      questionsAnswered: battleState.questionsAnswered,
      questionsCorrect: gameState.questionsCorrect || 0,
      enemyHP: battleState.enemyHP,
      enemyKey: battleState.currentEnemy?.key
    };
  }

  try {
    localStorage.setItem(key, JSON.stringify(gameState));
  } catch (e) {
    console.warn('Could not save game:', e);
  }
}

// Load game from localStorage
export function loadGame(level) {
  const key = LEVELS[level].storageKey;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const data = JSON.parse(saved);
      gameState = { ...DEFAULT_STATE, ...data };
      // Ensure arrays exist
      if (!gameState.completedChapters) gameState.completedChapters = [];
      if (!gameState.chapterProgress) gameState.chapterProgress = {};
      if (!gameState.collection) gameState.collection = [];
      if (!gameState.badges) gameState.badges = [];
      return true;
    }
  } catch (e) {
    console.warn('Could not load game:', e);
  }
  return false;
}

// Reset game state
export function resetGameState() {
  if (!currentLevel) return;
  const key = LEVELS[currentLevel].storageKey;
  localStorage.removeItem(key);
  gameState = { ...DEFAULT_STATE };
  resetBattleState();
}

// Reset battle state
export function resetBattleState() {
  battleState = {
    currentEnemy: null,
    currentQuestion: null,
    questionsAnswered: 0,
    enemyHP: 100
  };
  gameState.questionsCorrect = 0;
}

// Restore battle progress for a chapter
export function restoreBattleProgress(chapterId) {
  const progress = gameState.chapterProgress[chapterId];
  if (progress) {
    battleState.questionsAnswered = progress.questionsAnswered || 0;
    battleState.enemyHP = progress.enemyHP || 100;
    gameState.questionsCorrect = progress.questionsCorrect || 0;
    return progress.enemyKey;
  }
  return null;
}

// Clear chapter progress (when chapter completed)
export function clearChapterProgress(chapterId) {
  delete gameState.chapterProgress[chapterId];
  saveGame();
}

// Update state helpers
export function updateState(updates) {
  Object.assign(gameState, updates);
}

export function updateBattleState(updates) {
  Object.assign(battleState, updates);
}

// Mark chapter as completed
export function completeChapter(chapterId, badge = null) {
  if (!gameState.completedChapters.includes(chapterId)) {
    gameState.completedChapters.push(chapterId);
  }
  if (badge && !gameState.badges.includes(badge)) {
    gameState.badges.push(badge);
  }
  clearChapterProgress(chapterId);
  saveGame();
}

// Add Pokemon to collection
export function addToCollection(pokemonKey) {
  if (!gameState.collection.includes(pokemonKey)) {
    gameState.collection.push(pokemonKey);
    saveGame();
    return true; // New catch
  }
  return false; // Already had
}

// Update streak
export function updateStreak(correct) {
  if (correct) {
    gameState.streak++;
    gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);
  } else {
    gameState.streak = 0;
  }
}

// Add stars with streak bonus
export function addStars(base = 1) {
  const bonus = gameState.streak >= 3 ? 1 : 0;
  gameState.stars += base + bonus;
  saveGame();
}
