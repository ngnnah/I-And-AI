/**
 * Game Over Screen
 * Handles display of final results and scores
 */

import { currentGame, clearCurrentGame } from '../game/game-state.js';
import { calculateWinner } from '../game/game-logic.js';
import { navigateTo } from '../main.js';

// DOM elements
const winnerText = document.getElementById('winner-text');
const gameSummary = document.getElementById('game-summary');
const scoreTableBody = document.getElementById('score-table-body');
const backToLobbyBtn = document.getElementById('back-to-lobby-btn');

/**
 * Format duration in minutes and seconds
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

/**
 * Render final results
 */
function renderResults() {
    if (!currentGame.data) {
        console.error('No game data available');
        navigateTo('lobby');
        return;
    }

    const game = currentGame.data;
    const players = game.players || {};

    // Calculate winner
    const { winnerId, maxCards, isTie, tiedPlayers } = calculateWinner(players);

    // Display winner announcement
    if (isTie) {
        const tiedNames = tiedPlayers.map(id => players[id].name).join(' and ');
        winnerText.textContent = `🤝 It's a Tie!`;
        winnerText.style.color = '#ff9800';
        gameSummary.innerHTML = `${tiedNames} tied with ${maxCards} cards each!`;
    } else {
        const winnerName = players[winnerId]?.name || 'Unknown';
        winnerText.textContent = `🎉 ${winnerName} Wins!`;
        winnerText.style.color = '#4CAF50';
        gameSummary.innerHTML = `Congratulations! ${winnerName} collected <strong>${maxCards} cards</strong>!`;
    }

    // Calculate game duration
    const startTime = game.startedAt || game.createdAt;
    const endTime = game.finishedAt || Date.now();
    const duration = endTime - startTime;
    const durationText = formatDuration(duration);

    // Add duration to summary
    const durationSpan = document.createElement('div');
    durationSpan.style.marginTop = '10px';
    durationSpan.style.fontSize = '0.875rem';
    durationSpan.style.color = '#666';
    durationSpan.textContent = `Game duration: ${durationText}`;
    gameSummary.appendChild(durationSpan);

    // Render score table
    renderScoreTable(players);
}

/**
 * Render score table
 * @param {Object} players - Players object
 */
function renderScoreTable(players) {
    scoreTableBody.innerHTML = '';

    // Sort players by cards won (descending)
    const sortedPlayers = Object.entries(players)
        .sort((a, b) => (b[1].cardsWon || 0) - (a[1].cardsWon || 0));

    // Render each player
    sortedPlayers.forEach(([playerId, player], index) => {
        const row = document.createElement('tr');

        // Rank
        const rankCell = document.createElement('td');
        let rankText = '';
        if (index === 0) {
            rankText = '🥇';
        } else if (index === 1) {
            rankText = '🥈';
        } else if (index === 2) {
            rankText = '🥉';
        } else {
            rankText = `${index + 1}`;
        }
        rankCell.textContent = rankText;
        rankCell.style.textAlign = 'center';
        rankCell.style.fontSize = '1.25rem';

        // Player name
        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;

        // Cards won
        const scoreCell = document.createElement('td');
        scoreCell.textContent = player.cardsWon || 0;

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);

        scoreTableBody.appendChild(row);
    });
}

/**
 * Handle back to lobby button click
 */
function handleBackToLobby() {
    clearCurrentGame();
    navigateTo('lobby');
}

/**
 * Initialize screen
 */
function init() {
    // Event listener
    backToLobbyBtn.addEventListener('click', handleBackToLobby);

    // Listen to screen changes
    window.addEventListener('screen-changed', (e) => {
        if (e.detail.screen === 'game-over') {
            renderResults();
        }
    });

    console.log('Game over screen initialized');
}

// Initialize on load
init();
