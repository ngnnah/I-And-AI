/**
 * Codenames word lists
 * 200+ English words suitable for Codenames clue-giving
 */

export const WORD_LIST = [
  // Classic Codenames words
  "AFRICA", "AGENT", "AIR", "ALIEN", "AMAZON", "AMBULANCE", "ANGEL", "APPLE",
  "BAND", "BANK", "BAR", "BARK", "BAT", "BATTERY", "BEACH", "BEAR",
  "BEAT", "BED", "BELL", "BERLIN", "BERRY", "BOARD", "BOLT", "BOMB",
  "BOND", "BOOT", "BOW", "BOX", "BRIDGE", "BRUSH", "BUCK", "BUFFALO",
  "BUG", "BUTTON", "CAB", "CAMP", "CANADA", "CAPITAL", "CAR", "CARD",
  "CARROT", "CASTLE", "CAT", "CELL", "CENTER", "CHAIR", "CHANGE", "CHARGE",
  "CHECK", "CHEST", "CHINA", "CHURCH", "CIRCLE", "CLIFF", "CLOAK", "CLUB",
  "CODE", "COLD", "COMIC", "COMPOUND", "CONCERT", "CONDUCTOR", "CONTRACT", "COOK",
  "COPPER", "COTTON", "COURT", "COVER", "CRANE", "CRASH", "CRICKET", "CROSS",
  "CROWN", "CYCLE", "CZECH", "DANCE", "DATE", "DAY", "DEATH", "DECK",
  "DEGREE", "DIAMOND", "DICE", "DINOSAUR", "DISEASE", "DOCTOR", "DOG", "DRAFT",
  "DRAGON", "DRESS", "DRILL", "DROP", "DRUM", "DUCK", "DWARF", "EAGLE",
  "EGYPT", "ENGINE", "ENGLAND", "EUROPE", "EYE", "FACE", "FAIR", "FALL",
  "FAN", "FENCE", "FIELD", "FIGHTER", "FIGURE", "FILE", "FILM", "FIRE",
  "FISH", "FLY", "FOOT", "FORCE", "FOREST", "FORK", "FOX", "FRAME",
  "FRANCE", "FROST", "GAME", "GAS", "GENIUS", "GERMANY", "GHOST", "GIANT",
  "GLASS", "GLOVE", "GOLD", "GRACE", "GRASS", "GREECE", "GREEN", "GROUND",
  "HAM", "HAND", "HAWK", "HEAD", "HEART", "HELICOPTER", "HOOD", "HOOK",
  "HORN", "HORSE", "HOSPITAL", "HOTEL", "ICE", "INDIA", "IRON", "IVORY",
  "JACK", "JAM", "JET", "JUPITER", "KANGAROO", "KETCHUP", "KEY", "KID",
  "KING", "KITE", "KNIFE", "KNIGHT", "LAB", "LAP", "LASER", "LAWYER",
  "LEAD", "LEMON", "LETTER", "LINE", "LINK", "LION", "LOCK", "LOG",
  "LONDON", "LUCK", "MAIL", "MAMMOTH", "MAPLE", "MARCH", "MASS", "MATCH",
  "MERCURY", "MICROSCOPE", "MILL", "MINE", "MINT", "MISSILE", "MODEL", "MOLE",
  "MOON", "MOSCOW", "MOUNT", "MOUSE", "MOUTH", "MUG", "NAIL", "NEEDLE",
  "NET", "NEW YORK", "NIGHT", "NINJA", "NOTE", "NOVEL", "NURSE", "NUT",
  "OCTOPUS", "OIL", "OLIVE", "OLYMPUS", "OPERA", "ORANGE", "ORGAN", "PALM",
  "PAN", "PANTS", "PAPER", "PARACHUTE", "PARK", "PART", "PASS", "PASTE",
  "PENGUIN", "PHOENIX", "PIANO", "PIE", "PILOT", "PIN", "PIPE", "PIRATE",
  "PISTOL", "PIT", "PITCH", "PLANE", "PLATE", "PLAY", "PLOT", "POINT",
  "POISON", "POLE", "POOL", "PORT", "POST", "PRESS", "PRINCE", "PRINCESS",
  "PUMPKIN", "PUPIL", "PYRAMID", "QUEEN", "RABBIT", "RACE", "RAY", "REVOLUTION",
  "RING", "ROBIN", "ROBOT", "ROCK", "ROME", "ROOT", "ROSE", "ROUND",
  "ROW", "RULER", "SATELLITE", "SATURN", "SCALE", "SCHOOL", "SCIENTIST", "SCORPION",
  "SCREEN", "SEAL", "SERVER", "SHADOW", "SHAKESPEARE", "SHARK", "SHIP", "SHOCK",
  "SHOE", "SHOP", "SHOT", "SINK", "SKYSCRAPER", "SLIP", "SLUG", "SMUGGLER",
  "SNOW", "SNOWMAN", "SOCK", "SOLDIER", "SOUL", "SOUND", "SPACE", "SPELL",
  "SPIDER", "SPIKE", "SPOT", "SPRING", "SPY", "SQUARE", "STADIUM", "STAFF",
  "STAR", "STATE", "STICK", "STOCK", "STORM", "STRAW", "STREAM", "STRIKE",
  "STRING", "SUB", "SUIT", "SUPER", "SWING", "SWITCH", "TABLE", "TAIL",
  "TAP", "TEACHER", "TEMPLE", "THEATER", "THIEF", "THUMB", "TICK", "TIE",
  "TIME", "TOKYO", "TOOTH", "TORCH", "TOWER", "TRACK", "TRAIN", "TRIANGLE",
  "TRIP", "TRUNK", "TUBE", "TURKEY", "UNDERTAKER", "UNICORN", "VAN", "VET",
  "VIRUS", "VOLCANO", "WALL", "WAR", "WASH", "WASHINGTON", "WATCH", "WATER",
  "WAVE", "WEB", "WELL", "WHALE", "WHIP", "WIND", "WITCH", "WORM",
  "YARD"
];

/**
 * Pick N random unique words from the word list
 * @param {number} count - Number of words to pick (default 25)
 * @returns {string[]} Array of random words
 */
export function getRandomWords(count = 25) {
  const shuffled = [...WORD_LIST];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
