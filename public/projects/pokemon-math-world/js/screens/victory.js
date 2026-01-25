// Victory screen when completing a level
import { getLevelConfig, gameState } from '../game/state.js';
import { showScreen, $, createConfetti } from '../game/utils.js';
import { playVictory } from '../game/audio.js';

export function showVictoryScreen() {
  const level = getLevelConfig();

  createConfetti();
  setTimeout(createConfetti, 500);
  playVictory();

  $('victoryScreen').innerHTML = `
    <div class="victory-screen">
      <div class="victory-title">🎉 ${level.name} Complete! 🎉</div>
      <div class="badge-earned">${gameState.badges.join(' ')}</div>
      <div class="card">
        <h3 style="color:#374151;margin-bottom:15px;">Your Journey</h3>
        <div class="stat-row"><span>Pokemon Caught</span><span>${gameState.collection.length}</span></div>
        <div class="stat-row"><span>Stars Earned</span><span>⭐ ${gameState.stars}</span></div>
        <div class="stat-row"><span>Best Streak</span><span>🔥 ${gameState.maxStreak}</span></div>
        <div class="stat-row"><span>Badges</span><span>${gameState.badges.join(' ') || 'None'}</span></div>
      </div>
      <button class="btn btn-warning continue-btn" onclick="backToWorld()">Back to World Map</button>
    </div>
  `;

  showScreen('victoryScreen');
}
