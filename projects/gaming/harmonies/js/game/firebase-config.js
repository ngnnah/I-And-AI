// Firebase configuration and CRUD operations

// Firebase SDK imports (CDN loaded in HTML)
// Available: firebase.app, firebase.database, firebase.auth

const firebaseConfig = {
  databaseURL: 'https://harmonies-game-default-rtdb.asia-southeast1.firebasedatabase.app/'
};

let app;
let database;
let serverTimestamp;

// Initialize Firebase
export function initializeFirebase() {
  app = firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  serverTimestamp = firebase.database.ServerValue.TIMESTAMP;
  console.log('Firebase initialized');
}

// Database references
export function ref(path) {
  return firebase.database().ref(path);
}

export function getServerTimestamp() {
  return serverTimestamp;
}

// CRUD Operations

export async function get(reference) {
  return reference.once('value');
}

export async function set(reference, data) {
  return reference.set(data);
}

export async function update(reference, updates) {
  return reference.update(updates);
}

export async function push(reference, data) {
  return reference.push(data);
}

export async function remove(reference) {
  return reference.remove();
}

// Listeners

export function listenToGame(gameId, callback) {
  const gameRef = ref(`games/${gameId}`);

  const listener = gameRef.on('value', (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  // Return unsubscribe function
  return () => gameRef.off('value', listener);
}

export function listenToGamesList(callback) {
  const gamesRef = ref('games');

  const listener = gamesRef.on('value', (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });

  return () => gamesRef.off('value', listener);
}

export function listenToPlayer(username, callback) {
  const playerRef = ref(`players/${username}`);

  const listener = playerRef.on('value', (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });

  return () => playerRef.off('value', listener);
}

// Player Management

export async function createOrUpdatePlayer(username, displayName, deviceId) {
  const playerRef = ref(`players/${username}`);
  const snapshot = await get(playerRef);

  if (snapshot.exists()) {
    // Existing player: Update session
    await update(playerRef, {
      'activeSession/deviceId': deviceId,
      'activeSession/lastSeenAt': serverTimestamp
    });
  } else {
    // New player: Create profile
    await set(playerRef, {
      username: displayName,
      createdAt: serverTimestamp,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        highScore: 0,
        totalScore: 0
      },
      activeSession: {
        deviceId,
        lastSeenAt: serverTimestamp,
        currentGameId: null
      },
      gameHistory: []
    });
  }
}

export async function updatePlayerSession(username, gameId) {
  const playerRef = ref(`players/${username}`);
  await update(playerRef, {
    'activeSession/currentGameId': gameId,
    'activeSession/lastSeenAt': serverTimestamp
  });
}

// Game Management

export async function joinGame(gameId, username, displayName, deviceId) {
  const gameRef = ref(`games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    throw new Error('Game not found');
  }

  const game = snapshot.val();

  // Check if player already in game
  if (game.players && game.players[username]) {
    // Reactivate player
    await update(ref(`games/${gameId}/players/${username}`), {
      isActive: true,
      deviceId,
      lastSeenAt: serverTimestamp
    });
  } else {
    // Add new player
    if (game.status !== 'waiting') {
      throw new Error('Game already started');
    }

    const playerCount = Object.keys(game.players || {}).length;
    if (playerCount >= game.settings.maxPlayers) {
      throw new Error('Game is full');
    }

    await set(ref(`games/${gameId}/players/${username}`), {
      name: displayName,
      joinedAt: serverTimestamp,
      isActive: true,
      deviceId,
      lastSeenAt: serverTimestamp
    });

    // Initialize player board
    await set(ref(`games/${gameId}/playerBoards/${username}`), {
      hexGrid: {
        '0_0': { stack: [], terrain: null } // Start with single hex
      },
      animalCards: [],
      placedAnimals: [],
      score: {
        trees: 0,
        mountains: 0,
        fields: 0,
        buildings: 0,
        water: 0,
        animals: 0,
        total: 0
      }
    });
  }

  // Update player session
  await updatePlayerSession(username, gameId);
}

// Generate random game code (4 letters)
export function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate whimsical game name
export function generateGameName() {
  const adjectives = ['Phoenix', 'Moonlit', 'Crystal', 'Emerald', 'Golden', 'Silver', 'Azure', 'Crimson', 'Mystic', 'Tranquil'];
  const nouns = ['Sunset', 'Valley', 'Forest', 'Meadow', 'River', 'Mountain', 'Harbor', 'Garden', 'Grove', 'Haven'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj} ${noun}`;
}
