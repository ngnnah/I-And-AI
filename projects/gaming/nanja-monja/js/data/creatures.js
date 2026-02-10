// 12 creature definitions for Nanja Monja game (PRODUCTION MODE)
export const CREATURES = [
  { id: 0, name: "Cat Box", imgPath: "assets/creatures/cat-box.png" },
  { id: 1, name: "Cat Dino", imgPath: "assets/creatures/cat-dino.png" },
  { id: 2, name: "Chameleon", imgPath: "assets/creatures/chameleon.png" },
  { id: 3, name: "Cloud", imgPath: "assets/creatures/cloud.png" },
  { id: 4, name: "Dinosaur", imgPath: "assets/creatures/dinosaur.png" },
  { id: 5, name: "Frog", imgPath: "assets/creatures/frog.png" },
  { id: 6, name: "Hedgehog", imgPath: "assets/creatures/hedgehog.png" },
  { id: 7, name: "Ice Cream", imgPath: "assets/creatures/ice-cream.png" },
  { id: 8, name: "Panda", imgPath: "assets/creatures/panda.png" },
  { id: 9, name: "Penguin", imgPath: "assets/creatures/penguin.png" },
  { id: 10, name: "Sun", imgPath: "assets/creatures/sun.png" },
  { id: 11, name: "Turtle", imgPath: "assets/creatures/turtle.png" },
];

/**
 * Get creature image path by ID
 * @param {number} id - Creature ID (0-11)
 * @returns {string} Image path
 */
export function getCreatureImage(id) {
  if (id < 0 || id >= CREATURES.length) {
    throw new Error(`Invalid creature ID: ${id}`);
  }
  return CREATURES[id].imgPath;
}

/**
 * Get creature data by ID
 * @param {number} id - Creature ID (0-11)
 * @returns {object} Creature object
 */
export function getCreature(id) {
  if (id < 0 || id >= CREATURES.length) {
    throw new Error(`Invalid creature ID: ${id}`);
  }
  return CREATURES[id];
}
