/**
 * How to Play modal — accessible from lobby and game room headers.
 * Self-contained: no imports needed. Attach buttons via initHelp().
 */

const modal   = document.getElementById('help-modal');
const closeBtn = document.getElementById('help-close-btn');
const backdrop = modal.querySelector('.help-modal-backdrop');
const tabs     = modal.querySelectorAll('.help-tab');
const panels   = modal.querySelectorAll('.help-tab-panel');

// ── Open / Close ─────────────────────────────────────────────

export function openHelp() {
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  closeBtn.focus();
}

function closeHelp() {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

// ── Tab switching ─────────────────────────────────────────────

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
  });
});

// ── Close triggers ────────────────────────────────────────────

closeBtn.addEventListener('click', closeHelp);
backdrop.addEventListener('click', closeHelp);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeHelp();
  }
});

// ── Wire help buttons ─────────────────────────────────────────

export function initHelp() {
  const lobbyBtn = document.getElementById('lobby-help-btn');
  const gameBtn  = document.getElementById('game-help-btn');
  if (lobbyBtn) lobbyBtn.addEventListener('click', openHelp);
  if (gameBtn)  gameBtn.addEventListener('click', openHelp);
}
