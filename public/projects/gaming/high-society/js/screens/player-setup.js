/**
 * Player Setup Screen — name entry and UUID generation.
 */
import { generatePlayerId } from '../game/firebase-config.js';
import { setLocalPlayer } from '../game/game-state.js';
import { validatePlayerName } from '../game/game-logic.js';
import { navigateTo } from '../main.js';

const nameInput    = document.getElementById('player-name-input');
const continueBtn  = document.getElementById('setup-continue-btn');
const errorEl      = document.getElementById('setup-error');

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function clearError() {
  errorEl.classList.add('hidden');
}

function handleContinue() {
  const name = nameInput.value.trim();
  const { valid, error } = validatePlayerName(name);

  if (!valid) {
    showError(error);
    return;
  }

  clearError();
  const playerId = generatePlayerId();
  setLocalPlayer(playerId, name);
  navigateTo('lobby');
}

continueBtn.addEventListener('click', handleContinue);

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleContinue();
});

nameInput.addEventListener('input', clearError);
