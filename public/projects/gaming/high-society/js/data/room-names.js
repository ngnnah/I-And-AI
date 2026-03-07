/**
 * Display name generator for High Society game rooms.
 * Themed around luxury and aristocracy.
 *
 * IMPORTANT: This file is in js/data/ which is globally gitignored.
 * Always force-add: git add -f js/data/room-names.js
 */

const ADJECTIVES = [
  'VELVET', 'GOLDEN', 'ROYAL', 'GRAND', 'SILVER', 'OPULENT', 'MAJESTIC', 'REGAL',
  'NOBLE', 'IMPERIAL', 'GILDED', 'IVORY', 'EMERALD', 'SAPPHIRE', 'CRIMSON', 'AMBER',
  'SCARLET', 'AZURE', 'LAVENDER', 'JADE', 'PEARL', 'ONYX', 'PLATINUM', 'BRONZE',
  'ILLUSTRIOUS', 'DISTINGUISHED', 'EXQUISITE', 'RESPLENDENT', 'MAGNIFICENT', 'GLORIOUS',
];

const NOUNS = [
  'MANOR', 'ESTATE', 'PALACE', 'SALON', 'VILLA', 'CHATEAU', 'COURT', 'GALLERY',
  'BALLROOM', 'GARDEN', 'GALA', 'SOIREE', 'BANQUET', 'AUCTION', 'AFFAIR', 'SOCIETY',
  'CLUB', 'HALL', 'LOUNGE', 'PARLOUR', 'TERRACE', 'PAVILION', 'TOWER', 'SUITE',
  'COLLECTION', 'TREASURY', 'VAULT', 'CHAMBER', 'ARCHIVES', 'RESERVE',
];

function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

export function generateDisplayName() {
  const seed = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  const adjective = ADJECTIVES[Math.floor(seededRandom(seed) * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(seededRandom(seed + 1) * NOUNS.length)];
  return `${adjective} ${noun}`;
}
