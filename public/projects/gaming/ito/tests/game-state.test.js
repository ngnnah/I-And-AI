import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  localPlayer,
  currentGame,
  setLocalPlayer,
  getStoredPlayer,
  restorePlayer,
  clearStoredPlayerName,
  updateCurrentGame,
  setCurrentGameId,
  clearCurrentGame,
  getPlayerName,
  getPlayerId,
  setCurrentScreen,
  getCurrentScreen,
  isLocalPlayerInGame,
  isLocalPlayerHost
} from '../js/game/game-state.js';

describe('Game State Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset state objects
    localPlayer.id = null;
    localPlayer.name = null;
    currentGame.id = null;
    currentGame.data = null;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setLocalPlayer', () => {
    it('should set local player ID and name', () => {
      setLocalPlayer('player-123', 'Alice');
      
      expect(localPlayer.id).toBe('player-123');
      expect(localPlayer.name).toBe('Alice');
    });

    it('should persist to localStorage', () => {
      setLocalPlayer('player-456', 'Bob');
      
      const stored = localStorage.getItem('ito-player');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored);
      expect(parsed.id).toBe('player-456');
      expect(parsed.name).toBe('Bob');
    });
  });

  describe('getStoredPlayer', () => {
    it('should return null when no player stored', () => {
      const stored = getStoredPlayer();
      expect(stored).toBeNull();
    });

    it('should retrieve stored player', () => {
      localStorage.setItem('ito-player', JSON.stringify({ id: 'p1', name: 'Charlie' }));
      
      const stored = getStoredPlayer();
      expect(stored).toEqual({ id: 'p1', name: 'Charlie' });
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('ito-player', 'invalid-json{');
      
      const stored = getStoredPlayer();
      expect(stored).toBeNull();
    });
  });

  describe('restorePlayer', () => {
    it('should return false when no player to restore', () => {
      const restored = restorePlayer();
      expect(restored).toBe(false);
      expect(localPlayer.id).toBeNull();
      expect(localPlayer.name).toBeNull();
    });

    it('should restore player from localStorage', () => {
      localStorage.setItem('ito-player', JSON.stringify({ id: 'p2', name: 'Diana' }));
      
      const restored = restorePlayer();
      expect(restored).toBe(true);
      expect(localPlayer.id).toBe('p2');
      expect(localPlayer.name).toBe('Diana');
    });

    it('should return false for incomplete stored data', () => {
      localStorage.setItem('ito-player', JSON.stringify({ id: 'p3' })); // missing name
      
      const restored = restorePlayer();
      expect(restored).toBe(false);
    });
  });

  describe('clearStoredPlayerName', () => {
    it('should remove player from localStorage', () => {
      localStorage.setItem('ito-player', JSON.stringify({ id: 'p4', name: 'Eve' }));
      
      clearStoredPlayerName();
      
      const stored = localStorage.getItem('ito-player');
      expect(stored).toBeNull();
    });
  });

  describe('getPlayerName and getPlayerId', () => {
    it('should return null when no player set', () => {
      expect(getPlayerName()).toBeNull();
      expect(getPlayerId()).toBeNull();
    });

    it('should return player data when set', () => {
      setLocalPlayer('p5', 'Frank');
      
      expect(getPlayerId()).toBe('p5');
      expect(getPlayerName()).toBe('Frank');
    });
  });

  describe('currentGame management', () => {
    it('should set and retrieve game ID', () => {
      setCurrentGameId('game-789');
      expect(currentGame.id).toBe('game-789');
    });

    it('should update game data', () => {
      const gameData = {
        status: 'playing',
        hostId: 'p1',
        settings: { difficulty: 'kids' },
        players: { p1: { name: 'Alice' } }
      };

      updateCurrentGame(gameData);
      expect(currentGame.data).toEqual(gameData);
    });

    it('should clear current game', () => {
      setCurrentGameId('game-xyz');
      updateCurrentGame({ status: 'playing' });
      
      clearCurrentGame();
      
      expect(currentGame.id).toBeNull();
      expect(currentGame.data).toBeNull();
    });
  });

  describe('screen management', () => {
    it('should set and get current screen', () => {
      setCurrentScreen('lobby');
      expect(getCurrentScreen()).toBe('lobby');
      
      setCurrentScreen('game-room');
      expect(getCurrentScreen()).toBe('game-room');
    });
  });

  describe('isLocalPlayerInGame', () => {
    it('should return false when no game data', () => {
      setLocalPlayer('p1', 'Alice');
      expect(isLocalPlayerInGame()).toBe(false);
    });

    it('should return false when no local player', () => {
      updateCurrentGame({
        players: { p2: { name: 'Bob' } }
      });
      
      expect(isLocalPlayerInGame()).toBe(false);
    });

    it('should return true when local player is in game', () => {
      setLocalPlayer('p1', 'Alice');
      updateCurrentGame({
        players: {
          p1: { name: 'Alice', isActive: true },
          p2: { name: 'Bob', isActive: true }
        }
      });
      
      expect(isLocalPlayerInGame()).toBe(true);
    });

    it('should return false when local player not in game', () => {
      setLocalPlayer('p3', 'Charlie');
      updateCurrentGame({
        players: {
          p1: { name: 'Alice' },
          p2: { name: 'Bob' }
        }
      });
      
      expect(isLocalPlayerInGame()).toBe(false);
    });
  });

  describe('isLocalPlayerHost', () => {
    it('should return false when no game data', () => {
      setLocalPlayer('p1', 'Alice');
      expect(isLocalPlayerHost()).toBe(false);
    });

    it('should return false when no local player', () => {
      updateCurrentGame({ hostId: 'p1' });
      expect(isLocalPlayerHost()).toBe(false);
    });

    it('should return true when local player is host', () => {
      setLocalPlayer('p1', 'Alice');
      updateCurrentGame({
        hostId: 'p1',
        players: { p1: { name: 'Alice' } }
      });
      
      expect(isLocalPlayerHost()).toBe(true);
    });

    it('should return false when local player is not host', () => {
      setLocalPlayer('p2', 'Bob');
      updateCurrentGame({
        hostId: 'p1',
        players: {
          p1: { name: 'Alice' },
          p2: { name: 'Bob' }
        }
      });
      
      expect(isLocalPlayerHost()).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete player setup flow', () => {
      // Initial setup
      expect(restorePlayer()).toBe(false);
      
      // Player enters name
      setLocalPlayer('new-player', 'Grace');
      expect(getPlayerName()).toBe('Grace');
      
      // Check persistence
      const stored = getStoredPlayer();
      expect(stored.name).toBe('Grace');
      
      // Simulate page reload
      localPlayer.id = null;
      localPlayer.name = null;
      
      // Restore
      expect(restorePlayer()).toBe(true);
      expect(getPlayerName()).toBe('Grace');
    });

    it('should handle game join flow', () => {
      setLocalPlayer('p1', 'Host');
      setCurrentGameId('game-123');
      updateCurrentGame({
        hostId: 'p1',
        status: 'waiting',
        players: {
          p1: { name: 'Host', isActive: true }
        }
      });
      
      expect(isLocalPlayerInGame()).toBe(true);
      expect(isLocalPlayerHost()).toBe(true);
    });

    it('should handle non-host player in game', () => {
      setLocalPlayer('p2', 'Player');
      updateCurrentGame({
        hostId: 'p1',
        status: 'playing',
        players: {
          p1: { name: 'Host', isActive: true },
          p2: { name: 'Player', isActive: true }
        }
      });
      
      expect(isLocalPlayerInGame()).toBe(true);
      expect(isLocalPlayerHost()).toBe(false);
    });
  });
});
