// Utility functions

// Confetti effect
export function createConfetti() {
  const colors = ['#FFCB05', '#3D7DCA', '#FF0000', '#22C55E', '#9333EA'];
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const conf = document.createElement('div');
      conf.className = 'confetti';
      conf.style.left = Math.random() * 100 + '%';
      conf.style.background = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 3000);
    }, i * 50);
  }
}

// Fix iOS 100vh issue
export function setVH() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

// Initialize viewport height fix
export function initViewportFix() {
  setVH();
  window.addEventListener('resize', setVH);
}

// Screen management
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) {
    screen.classList.add('active');
  }
}

// Get DOM element safely
export function $(id) {
  return document.getElementById(id);
}

// Random choice from array
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
