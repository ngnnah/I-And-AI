/**
 * Word dictionary for generating unique game room names
 * Using top ~500 common, interesting English words to minimize collisions
 */

export const ADJECTIVES = [
  "ANCIENT", "ARCTIC", "ATOMIC", "BOLD", "BRAVE", "BRIGHT", "BRILLIANT", "CALM",
  "CLEVER", "COSMIC", "CRYSTAL", "DARK", "DEEP", "DIVINE", "ELECTRIC", "EPIC",
  "ETERNAL", "FAST", "FIERCE", "FINAL", "FROZEN", "GENTLE", "GIANT", "GOLDEN",
  "GRAND", "GREAT", "HAPPY", "HIDDEN", "HOLY", "HUMBLE", "IRON", "JADE",
  "JOLLY", "MIGHTY", "MYSTIC", "NOBLE", "PERFECT", "PRIME", "PROUD", "PURE",
  "QUICK", "RAPID", "ROYAL", "SACRED", "SECRET", "SHINY", "SILENT", "SILVER",
  "SMOOTH", "SOLID", "STELLAR", "STRONG", "SWIFT", "THUNDER", "TINY", "TRUE",
  "ULTIMATE", "VITAL", "WILD", "WISE", "YOUNG", "AGILE", "AMBER", "ASTRAL",
  "AZURE", "BLAZING", "BOLD", "BRONZE", "CARBON", "CELESTIAL", "COBALT", "CRIMSON",
  "CYBER", "DARING", "DIAMOND", "DYNAMIC", "EMERALD", "ENDLESS", "EXOTIC", "FEARLESS",
  "FIERY", "FLAMING", "FROSTY", "GILT", "GLOWING", "GORGEOUS", "GRACEFUL", "GRAND",
  "GUARDIAN", "HEROIC", "INFINITE", "IVORY", "LEGENDARY", "LUNAR", "MAJESTIC", "MARBLE",
  "MYSTIC", "NEON", "NOVA", "OCEAN", "ONYX", "OPAL", "PEARL", "PHANTOM", "PLASMA",
  "PLATINUM", "POLAR", "PRISM", "QUANTUM", "RADIANT", "REGAL", "RUBY", "SAPPHIRE",
  "SCARLET", "SHADOW", "SHINING", "SKY", "SOLAR", "SONIC", "SPARK", "SPECTRAL",
  "STARLIT", "STEEL", "STELLAR", "STORM", "SUPREME", "TITAN", "TOPAZ", "TURBO",
  "TWILIGHT", "ULTRA", "VALIANT", "VELVET", "VIOLET", "VIVID", "VOLT", "WICKED"
];

export const NOUNS = [
  "EAGLE", "DRAGON", "PHOENIX", "LION", "TIGER", "WOLF", "HAWK", "FALCON",
  "RAVEN", "COBRA", "VIPER", "SHARK", "PANTHER", "BEAR", "FOX", "OWL",
  "COMET", "METEOR", "GALAXY", "NEBULA", "STAR", "MOON", "SUN", "PLANET",
  "COSMOS", "VOID", "HORIZON", "SUMMIT", "PEAK", "RIDGE", "CANYON", "VALLEY",
  "OCEAN", "RIVER", "LAKE", "STORM", "THUNDER", "LIGHTNING", "WIND", "FROST",
  "FLAME", "BLAZE", "EMBER", "SPARK", "CRYSTAL", "PRISM", "DIAMOND", "RUBY",
  "EMERALD", "SAPPHIRE", "PEARL", "JADE", "OPAL", "QUARTZ", "AMBER", "TOPAZ",
  "KNIGHT", "WARRIOR", "GUARDIAN", "SENTINEL", "CHAMPION", "HERO", "LEGEND", "TITAN",
  "GIANT", "COLOSSUS", "ATLAS", "ORION", "PHOENIX", "GRIFFON", "CHIMERA", "HYDRA",
  "ARROW", "BLADE", "SWORD", "SHIELD", "SPEAR", "HAMMER", "AXE", "BOW",
  "FORTRESS", "CASTLE", "TOWER", "CITADEL", "BASTION", "GATE", "VAULT", "TEMPLE",
  "FORGE", "ANVIL", "FLAME", "BEACON", "TORCH", "LANTERN", "LIGHT", "GLOW",
  "SHADOW", "GHOST", "SPIRIT", "SOUL", "ECHO", "WHISPER", "DREAM", "VISION",
  "ANGEL", "DEMON", "WRAITH", "SPECTER", "PHANTOM", "SHADE", "ROGUE", "ASSASSIN",
  "HUNTER", "RANGER", "SCOUT", "SNIPER", "PILOT", "CAPTAIN", "COMMANDER", "GENERAL",
  "ADMIRAL", "MARSHAL", "CHIEF", "LEADER", "MASTER", "SAGE", "WIZARD", "SORCERER",
  "NINJA", "SAMURAI", "MONK", "PALADIN", "CLERIC", "DRUID", "BARD", "THIEF",
  "BANDIT", "OUTLAW", "REBEL", "PIRATE", "RAIDER", "VIKING", "SPARTAN", "TROJAN",
  "RUNNER", "RIDER", "FLYER", "GLIDER", "DRIFTER", "VOYAGER", "NOMAD", "TRAVELER",
  "SEEKER", "FINDER", "KEEPER", "WATCHER", "ORACLE", "PROPHET", "MYSTIC", "SHAMAN",
  "ALCHEMIST", "ARTIFICER", "ENGINEER", "ARCHITECT", "BUILDER", "CRAFTER", "MAKER", "SMITH",
  "RACER", "DASHER", "SPRINTER", "BOLT", "FLASH", "ZOOM", "RUSH", "SURGE",
  "WAVE", "TIDE", "CURRENT", "FLOW", "DRIFT", "GALE", "BREEZE", "ZEPHYR",
  "CYCLONE", "TYPHOON", "HURRICANE", "TORNADO", "TEMPEST", "MAELSTROM", "VORTEX", "WHIRL",
  "QUAKE", "TREMOR", "RUMBLE", "CRASH", "BOOM", "BANG", "STRIKE", "SMASH",
  "BLAST", "BURST", "NOVA", "SUPERNOVA", "PULSAR", "QUASAR", "MAGNETAR", "BLACKHOLE",
  "ORBIT", "ECLIPSE", "AURORA", "SOLSTICE", "EQUINOX", "MERIDIAN", "ZENITH", "APEX",
  "VERTEX", "NEXUS", "CORE", "HEART", "CENTER", "HUB", "NODE", "LINK",
  "CHAIN", "RING", "CIRCLE", "SPHERE", "ORB", "GLOBE", "DOME", "ARC",
  "MATRIX", "VECTOR", "PIXEL", "BYTE", "BIT", "CODE", "DATA", "SIGNAL",
  "PULSE", "RHYTHM", "BEAT", "TEMPO", "GROOVE", "MELODY", "HARMONY", "CHORD",
  "NOTE", "TONE", "PITCH", "SOUND", "VOICE", "SONG", "HYMN", "ANTHEM"
];

/**
 * Simple seeded random number generator (Mulberry32)
 * @param {number} seed - Integer seed
 * @returns {number} Random number between 0 and 1
 */
function seededRandom(seed) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * Generate a unique display name for a game room
 * Uses time-based seed to reduce collisions during same time period
 * @returns {string} Format: "ADJECTIVE NOUN" (e.g., "COSMIC DRAGON")
 */
export function generateDisplayName() {
  // Use current timestamp in seconds as seed (changes every second)
  const timeSeed = Math.floor(Date.now() / 1000);
  
  // Add some additional entropy from milliseconds and random
  const entropy = Math.floor(Math.random() * 1000);
  const seed = timeSeed + entropy;
  
  // Generate two random numbers from seed
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);
  
  const adjective = ADJECTIVES[Math.floor(rand1 * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(rand2 * NOUNS.length)];
  
  return `${adjective} ${noun}`;
}
