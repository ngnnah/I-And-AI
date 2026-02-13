/**
 * Clue word suggestions for Codenames: Pictures
 * 
 * These words work well with surreal/abstract images by focusing on:
 * - Visual attributes (color, shape, size, texture)
 * - Concepts and themes (nature, technology, emotions)
 * - Actions and movements
 * - Abstract ideas that can link multiple visual elements
 */

export const PICTURE_CLUES = [
  // Colors & Visual
  "BLUE", "RED", "GREEN", "YELLOW", "BLACK", "WHITE", "GOLD", "SILVER",
  "ORANGE", "PURPLE", "PINK", "BROWN", "GRAY", "COLORFUL", "BRIGHT", "DARK",
  "STRIPED", "SPOTTED", "SHINY", "TRANSPARENT", "OPAQUE",
  
  // Shapes & Forms
  "ROUND", "SQUARE", "TRIANGLE", "CIRCLE", "CURVED", "STRAIGHT", "ANGULAR",
  "SPIRAL", "POINTED", "FLAT", "SPHERE", "CUBE", "CONE", "TWISTED",
  
  // Size & Scale
  "BIG", "SMALL", "TINY", "HUGE", "TALL", "SHORT", "WIDE", "NARROW",
  "GIANT", "MINI", "LONG", "THICK", "THIN",
  
  // Nature & Elements
  "WATER", "FIRE", "EARTH", "AIR", "WIND", "SKY", "CLOUD", "SUN",
  "MOON", "STAR", "RAIN", "SNOW", "ICE", "WAVE", "FOREST", "TREE",
  "FLOWER", "LEAF", "SEED", "PLANT", "NATURAL", "ORGANIC", "WILD",
  
  // Animals (general categories)
  "BIRD", "FISH", "ANIMAL", "CREATURE", "WING", "FIN", "SCALE", "FUR",
  "FEATHER", "TAIL", "HORN", "CLAW", "WILD", "DOMESTIC",
  
  // Human Elements
  "FACE", "EYE", "HAND", "HEAD", "BODY", "SMILE", "PORTRAIT", "FIGURE",
  "HUMAN", "PERSON", "CHILD", "ADULT",
  
  // Textures & Materials
  "SMOOTH", "ROUGH", "SOFT", "HARD", "METAL", "WOOD", "GLASS", "STONE",
  "FABRIC", "PAPER", "PLASTIC", "LIQUID", "SOLID", "CRYSTAL",
  
  // Movement & Action
  "FLYING", "FALLING", "RISING", "FLOATING", "SPINNING", "FLOWING",
  "JUMPING", "RUNNING", "DANCING", "MOVING", "STILL", "FROZEN",
  "SWIFT", "SLOW", "FAST",
  
  // Directions & Position
  "UP", "DOWN", "LEFT", "RIGHT", "TOP", "BOTTOM", "CENTER", "CORNER",
  "ABOVE", "BELOW", "INSIDE", "OUTSIDE", "FRONT", "BACK", "VERTICAL",
  "HORIZONTAL",
  
  // Numbers & Quantity
  "ONE", "TWO", "THREE", "FOUR", "MANY", "FEW", "SINGLE", "DOUBLE",
  "TRIPLE", "MULTIPLE", "PAIR", "GROUP", "CLUSTER",
  
  // Emotions & Concepts
  "HAPPY", "SAD", "ANGRY", "CALM", "PEACE", "CHAOS", "JOY", "FEAR",
  "LOVE", "DREAM", "MAGIC", "MYSTERY", "WONDER", "STRANGE", "WEIRD",
  "ODD", "NORMAL", "SURREAL", "FANTASY",
  
  // Time & Weather
  "DAY", "NIGHT", "MORNING", "EVENING", "SUNNY", "CLOUDY", "STORMY",
  "AUTUMN", "WINTER", "SPRING", "SUMMER", "SEASONAL",
  
  // Places & Spaces (broad)
  "HOME", "CITY", "COUNTRY", "SPACE", "ROOM", "OUTDOOR", "INDOOR",
  "GARDEN", "STREET", "BUILDING", "BRIDGE", "TOWER",
  
  // Technology & Modern
  "MACHINE", "ROBOT", "DIGITAL", "ELECTRONIC", "MECHANICAL", "TECH",
  "MODERN", "FUTURE", "VINTAGE", "OLD", "NEW", "RETRO",
  
  // Art & Style
  "ARTISTIC", "ABSTRACT", "PATTERN", "DESIGN", "SYMMETRY", "ASYMMETRY",
  "MINIMAL", "COMPLEX", "SIMPLE", "ELEGANT", "BOLD", "SUBTLE",
  
  // Food & Organic (general)
  "FOOD", "FRUIT", "VEGETABLE", "SWEET", "SAVORY", "FRESH", "RIPE",
  "EDIBLE", "TASTY",
  
  // Objects (broad categories)
  "TOOL", "TOY", "CONTAINER", "BOX", "BAG", "BOTTLE", "CUP", "BOWL",
  "FURNITURE", "VEHICLE", "INSTRUMENT", "DEVICE", "GADGET",
  
  // Light & Shadow
  "LIGHT", "SHADOW", "GLOW", "RADIANT", "DIM", "LUMINOUS", "GLEAMING",
  "REFLECTION", "MIRROR", "SHINE",
  
  // Patterns & Repetition
  "REPEAT", "PATTERN", "SERIES", "SYMMETRY", "GRID", "LINE", "DOT",
  "STRIPE", "CHECKERED", "GRADIENT",
  
  // Abstract Qualities
  "SOFT", "LOUD", "QUIET", "GENTLE", "AGGRESSIVE", "DELICATE", "STRONG",
  "WEAK", "POWERFUL", "FRAGILE", "SOLID", "HOLLOW", "DENSE", "LIGHT",
  "HEAVY", "EMPTY", "FULL",
  
  // Concepts & Ideas
  "UNITY", "DIVIDE", "BALANCE", "CONTRAST", "HARMONY", "CONFLICT",
  "TOGETHER", "APART", "CONNECTED", "SEPARATE", "RELATED", "OPPOSITE",
  "SIMILAR", "DIFFERENT",
  
  // States & Conditions
  "OPEN", "CLOSED", "BROKEN", "WHOLE", "COMPLETE", "INCOMPLETE",
  "PERFECT", "FLAWED", "CLEAN", "DIRTY", "NEAT", "MESSY",
  
  // Cultural & Universal
  "MUSIC", "ART", "SPORT", "GAME", "PLAY", "WORK", "REST", "SLEEP",
  "WAKE", "CELEBRATE", "FESTIVAL", "PARTY", "RITUAL",
];

/**
 * Get N random picture clue suggestions
 * @param {number} count - Number of clues to generate (default 3)
 * @returns {string[]} Array of random clue words
 */
export function getRandomPictureClues(count = 3) {
  const shuffled = [...PICTURE_CLUES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
