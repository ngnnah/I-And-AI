/**
 * Game mode configurations for Codenames
 */

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
    totalImages: 0, // set when user populates directory
  },
};

export const DEFAULT_MODE = 'words';

export function getModeConfig(mode) {
  return GAME_MODES[mode] || GAME_MODES[DEFAULT_MODE];
}
