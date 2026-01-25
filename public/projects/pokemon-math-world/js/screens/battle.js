// Battle screen
import { TRAINERS, GYM_LEADERS } from '../data/trainers.js';
import { POKEMON, TYPE_COLORS, getPokemonSprite } from '../data/pokemon.js';
import {
  getLevelConfig,
  gameState,
  battleState,
  updateState,
  updateBattleState,
  saveGame,
  restoreBattleProgress,
  resetBattleState
} from '../game/state.js';
import { showScreen, $, randomChoice } from '../game/utils.js';
import { playCorrect, playWrong } from '../game/audio.js';
import { CORRECT_MESSAGES, ENCOURAGE_MESSAGES } from '../game/questions.js';
import { showCatchScreen } from './catch.js';
import { renderChapterScreen } from './chapter.js';

export function startBattle() {
  const level = getLevelConfig();
  const chapter = level.chapters[gameState.currentChapter];

  // Check for saved progress in this chapter
  const savedEnemyKey = restoreBattleProgress(gameState.currentChapter);

  if (savedEnemyKey && POKEMON[savedEnemyKey]) {
    // Restore previous battle
    battleState.currentEnemy = { key: savedEnemyKey, ...POKEMON[savedEnemyKey] };
  } else {
    // Start fresh battle
    resetBattleState();
    const enemyKey = randomChoice(chapter.enemies);
    battleState.currentEnemy = { key: enemyKey, ...POKEMON[enemyKey] };
  }

  showScreen('gameScreen');
  renderBattle();
}

export function renderBattle() {
  const level = getLevelConfig();
  const chapter = level.chapters[gameState.currentChapter];
  const trainer = TRAINERS[gameState.trainer];

  // Get player's active Pokemon
  const playerPokemonKey = gameState.starter || gameState.collection[0] || 'pikachu';
  const playerPokemon = POKEMON[playerPokemonKey];

  // Generate question
  battleState.currentQuestion = level.generateQuestion(chapter.difficulty, chapter.wordProblems);
  const q = battleState.currentQuestion;

  const choicesHTML = q.choices.map(c => `
    <button class="answer-btn" onclick="submitAnswer(${c})">${c}</button>
  `).join('');

  const questionHTML = q.isWordProblem
    ? `<div class="word-problem">${q.question}</div>`
    : `<div class="question">${q.question}</div>`;

  const enemyHpPercent = battleState.enemyHP;
  const enemyHpClass = enemyHpPercent > 50 ? '' : enemyHpPercent > 20 ? 'medium' : 'low';

  // Determine enemy trainer (gym leader or wild)
  const isGymBattle = chapter.isGym && chapter.gymLeader;
  const enemyTrainer = isGymBattle ? GYM_LEADERS[chapter.gymLeader] : null;
  const encounterText = isGymBattle ? `⚔️ VS ${enemyTrainer.name}!` : '🌿 Wild Pokemon!';

  $('gameScreen').innerHTML = `
    <div class="chapter-screen">
      <div class="game-header">
        <div class="header-left">
          <div class="trainer-avatar"><img src="${trainer.sprite}"></div>
          <div class="player-info">
            <div class="player-name">${gameState.playerName}</div>
            <div class="badges">${gameState.badges.join('') || ''}</div>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${gameState.streak}</div>
            <div class="stat-label">Streak</div>
          </div>
          <div class="stat">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">${gameState.stars}</div>
            <div class="stat-label">Stars</div>
          </div>
        </div>
      </div>

      <div class="battle-field">
        <div class="encounter-type">
          <span>${encounterText}</span>
        </div>

        <div class="battle-scene">
          <!-- Player Side -->
          <div class="battle-pokemon player">
            <div class="battle-trainer-pokemon">
              <div class="battle-trainer">
                <img src="${trainer.sprite}" alt="${trainer.name}">
                <div class="trainer-name">${gameState.playerName}</div>
              </div>
              <div class="battle-pokemon-sprite">
                <img src="${getPokemonSprite(playerPokemon.id, true)}" alt="${playerPokemon.name}">
              </div>
            </div>
            <div class="pokemon-info-card">
              <div class="poke-name">${playerPokemon.name}</div>
              <div class="hp-bar-container">
                <div class="hp-bar-fill" style="width:100%"></div>
              </div>
            </div>
          </div>

          <div class="vs-badge">VS</div>

          <!-- Enemy Side -->
          <div class="battle-pokemon enemy">
            <div class="battle-trainer-pokemon">
              ${isGymBattle ? `
                <div class="battle-trainer">
                  <img src="${enemyTrainer.sprite}" alt="${enemyTrainer.name}">
                  <div class="trainer-name">${enemyTrainer.name}</div>
                </div>
              ` : ''}
              <div class="battle-pokemon-sprite">
                <img src="${getPokemonSprite(battleState.currentEnemy.id)}" alt="${battleState.currentEnemy.name}">
              </div>
            </div>
            <div class="pokemon-info-card">
              <div class="poke-name">${battleState.currentEnemy.name}</div>
              <div class="hp-bar-container">
                <div class="hp-bar-fill ${enemyHpClass}" style="width:${enemyHpPercent}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="question-area">
        <div class="question-prompt">🎯 Solve to attack! (${battleState.questionsAnswered + 1}/${chapter.questionsToWin})</div>
        ${questionHTML}
        ${q.hint ? `<div style="text-align:center;color:#F59E0B;font-size:0.9rem;margin-bottom:10px;">💡 ${q.hint}</div>` : ''}
        <div class="answers ${q.choices.length === 3 ? 'three-cols' : ''}">${choicesHTML}</div>
        <div class="message" id="feedbackMessage"></div>
      </div>

      <button class="btn back-btn" style="width:100%;margin-top:10px;" onclick="exitBattle()">← Back to Chapter</button>
    </div>
  `;
}

export function submitAnswer(answer) {
  const level = getLevelConfig();
  const chapter = level.chapters[gameState.currentChapter];
  const isCorrect = answer === battleState.currentQuestion.answer;
  const feedbackEl = $('feedbackMessage');
  const buttons = document.querySelectorAll('.answer-btn');

  buttons.forEach(btn => {
    btn.disabled = true;
    if (parseInt(btn.textContent) === battleState.currentQuestion.answer) {
      btn.classList.add('correct');
    } else if (parseInt(btn.textContent) === answer && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  if (isCorrect) {
    playCorrect();
    gameState.streak++;
    gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);
    gameState.stars += 1 + (gameState.streak >= 3 ? 1 : 0);
    gameState.questionsCorrect = (gameState.questionsCorrect || 0) + 1;

    battleState.questionsAnswered++;
    battleState.enemyHP -= Math.ceil(100 / chapter.questionsToWin);
    if (battleState.enemyHP < 0) battleState.enemyHP = 0;

    feedbackEl.className = 'message success';
    feedbackEl.textContent = randomChoice(CORRECT_MESSAGES);

    // Save progress after each question
    saveGame();

    setTimeout(() => {
      if (battleState.questionsAnswered >= chapter.questionsToWin) {
        showCatchScreen();
      } else {
        renderBattle();
      }
    }, 1000);
  } else {
    playWrong();
    gameState.streak = 0;

    feedbackEl.className = 'message encouragement';
    feedbackEl.textContent = randomChoice(ENCOURAGE_MESSAGES);

    // Save progress
    saveGame();

    setTimeout(() => renderBattle(), 1500);
  }
}

export function exitBattle() {
  // Save current progress before leaving
  saveGame();
  showScreen('chapterScreen');
  renderChapterScreen();
}

// Make functions globally available
window.submitAnswer = submitAnswer;
window.exitBattle = exitBattle;
