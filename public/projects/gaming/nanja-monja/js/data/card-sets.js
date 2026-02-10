/**
 * Card Sets for Nanja Monja Game
 * Multiple themed sets of cards for variety
 */

export const CARD_SETS = {
  creatures: {
    id: 'creatures',
    name: 'Creatures',
    description: 'Strange and wonderful creatures',
    cards: [
      { id: 0, name: 'Cat Box', imgPath: 'assets/creatures/cat-box.png' },
      { id: 1, name: 'Cat Dino', imgPath: 'assets/creatures/cat-dino.png' },
      { id: 2, name: 'Chameleon', imgPath: 'assets/creatures/chameleon.png' },
      { id: 3, name: 'Cloud', imgPath: 'assets/creatures/cloud.png' },
      { id: 4, name: 'Dinosaur', imgPath: 'assets/creatures/dinosaur.png' },
      { id: 5, name: 'Frog', imgPath: 'assets/creatures/frog.png' },
      { id: 6, name: 'Hedgehog', imgPath: 'assets/creatures/hedgehog.png' },
      { id: 7, name: 'Ice Cream', imgPath: 'assets/creatures/ice-cream.png' },
      { id: 8, name: 'Panda', imgPath: 'assets/creatures/panda.png' },
      { id: 9, name: 'Penguin', imgPath: 'assets/creatures/penguin.png' },
      { id: 10, name: 'Sun', imgPath: 'assets/creatures/sun.png' },
      { id: 11, name: 'Turtle', imgPath: 'assets/creatures/turtle.png' },
    ]
  },
  animals: {
    id: 'animals',
    name: 'Animals',
    description: 'Wild animals from around the world',
    cards: [
      { id: 0, name: 'Bear', imgPath: 'assets/animals/bear.png' },
      { id: 1, name: 'Cow', imgPath: 'assets/animals/cow.png' },
      { id: 2, name: 'Crocodile', imgPath: 'assets/animals/crocodile.png' },
      { id: 3, name: 'Elephant', imgPath: 'assets/animals/elephant.png' },
      { id: 4, name: 'Giraffe', imgPath: 'assets/animals/giraffe.png' },
      { id: 5, name: 'Hedgehog', imgPath: 'assets/animals/hedgehog.png' },
      { id: 6, name: 'Hippopotamus', imgPath: 'assets/animals/hippopotamus.png' },
      { id: 7, name: 'Horse', imgPath: 'assets/animals/horse.png' },
      { id: 8, name: 'Panda Bear', imgPath: 'assets/animals/panda-bear.png' },
      { id: 9, name: 'Pig', imgPath: 'assets/animals/pig.png' },
      { id: 10, name: 'Tiger', imgPath: 'assets/animals/tiger.png' },
      { id: 11, name: 'Zebra', imgPath: 'assets/animals/zebra.png' },
    ]
  }
};

/**
 * Get all available card sets
 * @returns {Array} Array of card set objects
 */
export function getAllCardSets() {
  return Object.values(CARD_SETS);
}

/**
 * Get a specific card set by ID
 * @param {string} setId - Card set ID (e.g., 'creatures', 'animals')
 * @returns {object} Card set object
 */
export function getCardSet(setId) {
  if (!CARD_SETS[setId]) {
    throw new Error(`Card set not found: ${setId}`);
  }
  return CARD_SETS[setId];
}

/**
 * Get card image path by set ID and card ID
 * @param {string} setId - Card set ID
 * @param {number} cardId - Card ID (0-11)
 * @returns {string} Image path
 */
export function getCardImage(setId, cardId) {
  const cardSet = getCardSet(setId);
  if (cardId < 0 || cardId >= cardSet.cards.length) {
    throw new Error(`Invalid card ID: ${cardId} for set: ${setId}`);
  }
  return cardSet.cards[cardId].imgPath;
}

/**
 * Get card data by set ID and card ID
 * @param {string} setId - Card set ID
 * @param {number} cardId - Card ID (0-11)
 * @returns {object} Card object
 */
export function getCard(setId, cardId) {
  const cardSet = getCardSet(setId);
  if (cardId < 0 || cardId >= cardSet.cards.length) {
    throw new Error(`Invalid card ID: ${cardId} for set: ${setId}`);
  }
  return cardSet.cards[cardId];
}

/**
 * Get number of cards in a set
 * @param {string} setId - Card set ID
 * @returns {number} Number of cards
 */
export function getSetSize(setId) {
  const cardSet = getCardSet(setId);
  return cardSet.cards.length;
}

// For backward compatibility, export default creatures set
export const CREATURES = CARD_SETS.creatures.cards;

// Legacy functions that use default creatures set
export function getCreatureImage(id) {
  return getCardImage('creatures', id);
}

export function getCreature(id) {
  return getCard('creatures', id);
}
