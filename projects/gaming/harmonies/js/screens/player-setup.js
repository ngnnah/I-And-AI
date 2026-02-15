// Player setup/login screen

import { setLocalPlayer, getLocalPlayer, getOrCreateDeviceId } from '../game/game-state.js';
import { createOrUpdatePlayer } from '../game/firebase-config.js';
import { navigateTo } from '../main.js';

let usernameInput;
let continueBtn;
let errorMsg;

export function init() {
  usernameInput = document.getElementById('username-input');
  continueBtn = document.getElementById('continue-btn');
  errorMsg = document.getElementById('error-msg');

  continueBtn.addEventListener('click', handleContinue);
  usernameInput.addEventListener('input', handleInput);
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && validateUsername()) {
      handleContinue();
    }
  });

  // Check for existing player
  const player = getLocalPlayer();
  if (player) {
    usernameInput.value = player.displayName;
    showWelcomeBack(player.displayName);
  }
}

function handleInput() {
  const username = usernameInput.value.trim();

  // Clear error
  errorMsg.textContent = '';
  errorMsg.style.display = 'none';

  // Validate
  const isValid = validateUsername();

  // Update button state
  continueBtn.disabled = !isValid;

  // Visual feedback
  if (username.length === 0) {
    usernameInput.style.borderColor = '';
  } else if (isValid) {
    usernameInput.style.borderColor = '#4CAF50';
  } else {
    usernameInput.style.borderColor = '#F44336';
  }
}

function validateUsername() {
  const username = usernameInput.value.trim();

  if (username.length < 3 || username.length > 20) {
    return false;
  }

  // Alphanumeric + underscore only
  return /^[a-z0-9_]+$/i.test(username);
}

async function handleContinue() {
  const username = usernameInput.value.trim();

  if (!validateUsername()) {
    showError('Username must be 3-20 characters (letters, numbers, underscore)');
    return;
  }

  // Show loading
  continueBtn.disabled = true;
  continueBtn.textContent = 'Loading...';

  try {
    const usernameId = username.toLowerCase();
    const deviceId = getOrCreateDeviceId();

    // Create or update player in Firebase
    await createOrUpdatePlayer(usernameId, username, deviceId);

    // Save locally
    setLocalPlayer(usernameId, username, deviceId);

    // Navigate to lobby
    navigateTo('lobby');
  } catch (error) {
    console.error('Login error:', error);
    showError('Connection error. Please try again.');
    continueBtn.disabled = false;
    continueBtn.textContent = 'Continue';
  }
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
}

function showWelcomeBack(displayName) {
  const welcomeMsg = document.getElementById('welcome-msg');
  if (welcomeMsg) {
    welcomeMsg.textContent = `Welcome back, ${displayName}!`;
    welcomeMsg.style.display = 'block';

    // Auto-continue after 1.5s
    setTimeout(() => {
      if (validateUsername()) {
        handleContinue();
      }
    }, 1500);
  }
}

export function cleanup() {
  // Remove event listeners
  if (continueBtn) {
    continueBtn.removeEventListener('click', handleContinue);
  }
}
