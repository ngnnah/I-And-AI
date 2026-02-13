import { database, ref, get, update } from './firebase-config.js';
import { pickThemes, dealNumbers, checkOrder } from './game-logic.js';

/**
 * Host starts a new round: pick theme, deal numbers, set phase to "discuss"
 */
export async function startRound(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  const activePlayers = Object.keys(game.players).filter(id => game.players[id].isActive);
  const usedThemeIds = game.gameState.usedThemeIds || [];

  // Pick one theme
  const [theme] = pickThemes(1, usedThemeIds);

  // Deal numbers
  const hands = dealNumbers(activePlayers, game.settings.rangeMax);

  const updates = {
    'gameState/phase': 'discuss',
    'gameState/theme': theme,
    'gameState/hands': hands,
    'gameState/placedOrder': [],
    'gameState/revealed': false,
    'gameState/wasCorrect': null,
    'gameState/usedThemeIds': [...usedThemeIds, theme.id]
  };

  // Set status to playing on first round
  if (game.status === 'waiting') {
    updates['status'] = 'playing';
    updates['startedAt'] = Date.now();
  }

  await update(gameRef, updates);
}

/**
 * Host changes the theme during discuss phase
 */
export async function changeTheme(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  // Only allow in discuss phase
  if (game.gameState.phase !== 'discuss') {
    throw new Error('Can only change theme during discuss phase');
  }

  const usedThemeIds = game.gameState.usedThemeIds || [];

  // Pick a new theme (excluding already used ones)
  const [theme] = pickThemes(1, usedThemeIds);

  const updates = {
    'gameState/theme': theme,
    'gameState/usedThemeIds': [...usedThemeIds, theme.id]
  };

  await update(gameRef, updates);
}

/**
 * Host moves to placing phase
 */
export async function startPlacing(gameId) {
  await update(ref(database, `games/${gameId}`), {
    'gameState/phase': 'placing'
  });
}

/**
 * Host updates the placed order
 * @param {string[]} orderedPlayerIds - player IDs in the order host arranged them
 */
export async function setPlacedOrder(gameId, orderedPlayerIds) {
  await update(ref(database, `games/${gameId}`), {
    'gameState/placedOrder': orderedPlayerIds
  });
}

/**
 * Host reveals cards and checks order
 */
export async function revealCards(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  const { correct, firstErrorIndex } = checkOrder(
    game.gameState.placedOrder,
    game.gameState.hands
  );

  const roundsPlayed = (game.gameState.roundsPlayed || 0) + 1;
  const successCount = (game.gameState.successCount || 0) + (correct ? 1 : 0);

  await update(gameRef, {
    'gameState/phase': 'reveal',
    'gameState/revealed': true,
    'gameState/wasCorrect': correct,
    'gameState/firstErrorIndex': firstErrorIndex,
    'gameState/roundsPlayed': roundsPlayed,
    'gameState/successCount': successCount
  });
}

/**
 * Host moves to next round or ends game
 */
export async function nextRound(gameId) {
  const gameRef = ref(database, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const game = snapshot.val();

  const roundsPlayed = game.gameState.roundsPlayed || 0;

  if (roundsPlayed >= game.settings.roundsTotal) {
    // Game over
    await update(gameRef, {
      'status': 'finished',
      'finishedAt': Date.now(),
      'gameState/phase': 'finished'
    });
    return true; // game ended
  }

  // Reset for next round (startRound will be called separately)
  await update(gameRef, {
    'gameState/phase': 'waiting',
    'gameState/roundIndex': (game.gameState.roundIndex || 0) + 1,
    'gameState/theme': null,
    'gameState/hands': {},
    'gameState/placedOrder': [],
    'gameState/revealed': false,
    'gameState/wasCorrect': null,
    'gameState/firstErrorIndex': null
  });

  return false; // game continues
}

/**
 * Host ends the game early
 */
export async function endGameEarly(gameId) {
  await update(ref(database, `games/${gameId}`), {
    'status': 'finished',
    'finishedAt': Date.now(),
    'gameState/phase': 'finished'
  });
}
