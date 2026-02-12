/**
 * Game mode configurations for Codenames
 */

import { DIY_CARDS } from './diy-cards.js';

export const GAME_MODES = {
  words: {
    label: 'Words',
    description: 'Classic 5×5, 25 word cards',
    gridCols: 5,
    totalCards: 25,
    startingCount: 9,
    otherCount: 8,
    neutralCount: 7,
    assassinCount: 1,
    cardType: 'text',
    imageDir: null,
    totalImages: null,
    cardList: null,
  },
  pictures: {
    label: 'Pictures',
    description: '5×4, 20 picture cards',
    gridCols: 5,
    totalCards: 20,
    startingCount: 8,
    otherCount: 7,
    neutralCount: 4,
    assassinCount: 1,
    cardType: 'image',
    imageDir: 'images/cards/',
    totalImages: 280,
    cardList: null,
  },
  diy: {
    label: 'DIY',
    description: '5×4, custom images',
    gridCols: 5,
    totalCards: 20,
    startingCount: 8,
    otherCount: 7,
    neutralCount: 4,
    assassinCount: 1,
    cardType: 'image',
    imageDir: 'images/diy/',
    totalImages: DIY_CARDS.length,
    cardList: DIY_CARDS,
  },
};

export const DEFAULT_MODE = 'words';

export function getModeConfig(mode) {
  return GAME_MODES[mode] || GAME_MODES[DEFAULT_MODE];
}
