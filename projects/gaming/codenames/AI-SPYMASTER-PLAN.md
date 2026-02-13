# AI Spymaster Implementation Plan
## Codenames Picture Mode - 2-Player Support

**Goal**: Enable 2 human players to enjoy Codenames together with AI assistance

**Game Mode**: Picture Mode (280 official cards, 20 cards per game)

**Status**: Planning Phase

---

## 🎯 Problem Statement

Current Codenames requires minimum 4 players:
- Red Team: 1 Spymaster + 1+ Operatives
- Blue Team: 1 Spymaster + 1+ Operatives

**Challenge**: Both teams MUST have a spymaster (operatives can't guess without clues)

---

## 🎮 Proposed 2-Player Modes

### **Mode 1: Competitive (Recommended)**
**Setup**: Each human has their own AI spymaster helper

```
Team Red:              Team Blue:
- Human Operative      - Human Operative
- AI Spymaster        - AI Spymaster
```

**Gameplay**:
1. Red AI gives clue → Human 1 guesses
2. Blue AI gives clue → Human 2 guesses
3. Repeat until one team wins

**Why this is fun**:
- Direct player competition
- Each player gets AI assistance
- Feels like human vs human (bots are helpers)
- Balanced (both players have same AI difficulty)

---

### **Mode 2: Cooperative** 
**Setup**: 2 humans vs AI team

```
Team Red (Humans):     Team Blue (AI):
- Human Operative 1    - AI Spymaster
- Human Operative 2    - AI Operative(s)
- AI Spymaster
```

**Gameplay**:
1. Red AI gives clue → Humans discuss & guess together
2. Blue AI gives clue to Blue AI operatives → Auto-guess
3. Repeat until one team wins

**Why this is fun**:
- Cooperative teamwork
- Humans vs machine challenge
- Good for teaching new players

---

### **Mode 3: Solo Practice**
**Setup**: 1 human vs full AI team

```
Team Red:              Team Blue (AI):
- Human Operative      - AI Spymaster
- AI Spymaster        - AI Operative(s)
```

**Use case**: Practice, learning, testing

---

## 🏗️ Architecture Design

### **1. Bot Player System**

```javascript
// js/ai/bot-player.js

class BotPlayer {
  constructor(id, name, team, role) {
    this.id = id;
    this.name = name;
    this.team = team;           // 'red' | 'blue'
    this.role = role;           // 'spymaster' | 'operative'
    this.isBot = true;
    this.difficulty = 'medium'; // 'easy' | 'medium' | 'hard'
  }
  
  // Join game like a normal player
  async joinGame(gameId) {
    await joinGame(gameId, this.name, this.id);
    await handleTeamJoin(gameId, this.id, this.team, this.role);
  }
}

// Bot registry
const BOTS = {
  redSpymaster: new BotPlayer('bot-red-spy', 'Ada (AI)', 'red', 'spymaster'),
  blueSpymaster: new BotPlayer('bot-blue-spy', 'Bob (AI)', 'blue', 'spymaster'),
  redOperative: new BotPlayer('bot-red-op', 'Charlie (AI)', 'red', 'operative'),
  blueOperative: new BotPlayer('bot-blue-op', 'Diana (AI)', 'blue', 'operative')
};
```

---

### **2. Picture Card Metadata System**

```javascript
// js/data/card-metadata.js

/**
 * Metadata for all 280 picture cards
 * Structured for easy clue generation
 */
export const CARD_METADATA = {
  // card-0.jpg
  0: {
    primaryCategory: 'animal',
    tags: ['dog', 'pet', 'mammal', 'domestic'],
    colors: ['brown', 'black'],
    difficulty: 1, // 1=easy, 3=hard
    relatedCards: [5, 12, 34] // Similar images
  },
  
  // card-1.jpg
  1: {
    primaryCategory: 'food',
    tags: ['apple', 'fruit', 'red', 'healthy'],
    colors: ['red', 'green'],
    difficulty: 1,
    relatedCards: [15, 23, 67]
  },
  
  // ... Continue for all 280 cards
};

/**
 * Category definitions for clue generation
 */
export const CATEGORIES = {
  animal: { words: ['ANIMAL', 'CREATURE', 'BEAST', 'WILDLIFE'], strength: 'high' },
  food: { words: ['FOOD', 'EDIBLE', 'MEAL', 'DISH'], strength: 'high' },
  vehicle: { words: ['VEHICLE', 'TRANSPORT', 'RIDE'], strength: 'medium' },
  nature: { words: ['NATURE', 'OUTDOOR', 'EARTH'], strength: 'medium' },
  object: { words: ['THING', 'ITEM', 'OBJECT'], strength: 'low' },
  color: { words: ['RED', 'BLUE', 'GREEN', 'YELLOW'], strength: 'medium' },
  // ... more categories
};

/**
 * Tag-to-clue-word mapping (100-150 common words)
 */
export const TAG_TO_CLUE = {
  'dog': ['PET', 'ANIMAL', 'CANINE', 'LOYAL'],
  'cat': ['PET', 'FELINE', 'MEOW'],
  'apple': ['FRUIT', 'RED', 'HEALTHY', 'TREE'],
  'car': ['VEHICLE', 'DRIVE', 'WHEELS', 'ROAD'],
  // ... extensive mapping
};
```

---

### **3. AI Clue Generation Algorithm**

```javascript
// js/ai/clue-generator.js

/**
 * Core AI logic: Generate optimal clue for picture mode
 */
export function generateClue(gameState, botTeam, difficulty = 'medium') {
  const { board, gameState: gs, players } = gameState;
  const { colorMap, cardIds, revealedCards } = board;
  
  // 1. Find unrevealed cards for bot's team
  const teamCards = cardIds
    .map((id, idx) => ({ id, idx, color: colorMap[idx] }))
    .filter(c => c.color === botTeam && !revealedCards[c.idx]);
  
  if (teamCards.length === 0) return null; // No cards left
  
  // 2. Group cards by metadata (tags, categories, colors)
  const clueOptions = [];
  
  // Strategy A: Find cards with common tags
  const tagGroups = groupCardsByTags(teamCards);
  for (const [tag, cards] of Object.entries(tagGroups)) {
    if (cards.length >= 2) {
      const risk = assessRisk(cards, colorMap, revealedCards, botTeam, cardIds);
      const score = calculateScore(cards.length, risk, difficulty);
      const clueWords = TAG_TO_CLUE[tag] || [tag.toUpperCase()];
      
      clueOptions.push({
        word: selectBestWord(clueWords, gameState),
        number: cards.length,
        targetCards: cards,
        score,
        risk
      });
    }
  }
  
  // Strategy B: Find cards in same category
  const categoryGroups = groupCardsByCategory(teamCards);
  for (const [category, cards] of Object.entries(categoryGroups)) {
    if (cards.length >= 2) {
      const risk = assessRisk(cards, colorMap, revealedCards, botTeam, cardIds);
      const score = calculateScore(cards.length, risk, difficulty);
      const categoryWords = CATEGORIES[category].words;
      
      clueOptions.push({
        word: selectBestWord(categoryWords, gameState),
        number: cards.length,
        targetCards: cards,
        score,
        risk
      });
    }
  }
  
  // Strategy C: Color-based clues
  const colorGroups = groupCardsByColor(teamCards);
  for (const [color, cards] of Object.entries(colorGroups)) {
    if (cards.length >= 2) {
      const risk = assessRisk(cards, colorMap, revealedCards, botTeam, cardIds);
      const score = calculateScore(cards.length, risk, difficulty);
      
      clueOptions.push({
        word: color.toUpperCase(),
        number: cards.length,
        targetCards: cards,
        score,
        risk
      });
    }
  }
  
  // 3. Sort by score and pick best
  clueOptions.sort((a, b) => b.score - a.score);
  
  // 4. Apply difficulty filter
  const safeClues = filterByDifficulty(clueOptions, difficulty);
  
  // 5. Return best clue (or fallback to safe 1-card clue)
  return safeClues[0] || generateSafeOneCardClue(teamCards[0]);
}

/**
 * Calculate risk score for a set of target cards
 */
function assessRisk(targetCards, colorMap, revealed, myTeam, allCardIds) {
  let risk = 0;
  
  // Check if related words might trick operative into wrong cards
  for (let i = 0; i < colorMap.length; i++) {
    if (revealed[i]) continue;
    
    const cardId = allCardIds[i];
    const color = colorMap[i];
    
    // If card is similar to targets but wrong color, high risk
    const similarity = checkSimilarity(cardId, targetCards.map(c => c.id));
    
    if (similarity > 0.5) {
      if (color === 'assassin') risk += 100;  // NEVER risk assassin
      else if (color === 'neutral') risk += 1;
      else if (color !== myTeam) risk += 3;    // Opponent card
    }
  }
  
  return risk;
}

/**
 * Score calculation based on difficulty
 */
function calculateScore(numCards, risk, difficulty) {
  const DIFFICULTY_PARAMS = {
    easy: { cardsWeight: 1, riskWeight: 3, maxCards: 2 },
    medium: { cardsWeight: 2, riskWeight: 2, maxCards: 3 },
    hard: { cardsWeight: 3, riskWeight: 1, maxCards: 4 }
  };
  
  const params = DIFFICULTY_PARAMS[difficulty];
  
  // Limit card count by difficulty
  if (numCards > params.maxCards) return -1000; // Invalid
  
  // Score = benefit - cost
  const benefit = numCards * params.cardsWeight;
  const cost = risk * params.riskWeight;
  
  return benefit - cost;
}

/**
 * Helper: Group cards by shared tags
 */
function groupCardsByTags(cards) {
  const tagGroups = {};
  
  for (const card of cards) {
    const metadata = CARD_METADATA[card.id];
    for (const tag of metadata.tags) {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(card);
    }
  }
  
  return tagGroups;
}

// Similar helpers for category, color grouping...
```

---

### **4. Turn Automation System**

```javascript
// js/ai/turn-handler.js

/**
 * Auto-play when it's a bot's turn
 */
export class BotTurnHandler {
  constructor() {
    this.isProcessing = false;
    this.thinkingDelay = null; // Random 2-5 seconds
  }
  
  /**
   * Check if current turn belongs to a bot
   */
  shouldBotPlay(gameState, currentGame) {
    const { gameState: gs, players } = gameState;
    const { currentTurn, phase } = gs;
    
    // Find active player for current phase
    const activePlayers = Object.values(players).filter(p => 
      p.team === currentTurn && 
      ((phase === 'clue' && p.role === 'spymaster') ||
       (phase === 'guess' && p.role === 'operative'))
    );
    
    return activePlayers.some(p => p.isBot);
  }
  
  /**
   * Execute bot turn
   */
  async executeBotTurn(gameState, botPlayer) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    try {
      const { gameState: gs } = gameState;
      
      // Show thinking indicator
      showBotThinking(botPlayer.name);
      
      // Random delay (feels more human)
      const delay = Math.random() * 3000 + 2000; // 2-5 seconds
      await sleep(delay);
      
      if (gs.phase === 'clue') {
        // Bot is spymaster - give clue
        const clue = generateClue(gameState, botPlayer.team, botPlayer.difficulty);
        if (clue) {
          await handleGiveClue(
            gameState.id, 
            clue.word, 
            clue.number, 
            botPlayer.name,
            botPlayer.team
          );
        }
      } else {
        // Bot is operative - make guess
        const guessIndex = selectBestGuess(gameState, botPlayer.team);
        if (guessIndex !== null) {
          await handleCardReveal(gameState.id, guessIndex, botPlayer.name);
        } else {
          // No good guess - pass
          await handleEndGuessing(gameState.id);
        }
      }
    } finally {
      hideBotThinking();
      this.isProcessing = false;
    }
  }
}

// Initialize global handler
export const botTurnHandler = new BotTurnHandler();
```

---

### **5. UI Integration**

```javascript
// js/screens/game-room.js (additions)

import { botTurnHandler } from '../ai/turn-handler.js';
import { BOTS } from '../ai/bot-player.js';

// In handleGameUpdate()
function handleGameUpdate(data) {
  // ... existing code ...
  
  // Check if bot should play
  if (data.status === 'playing' && botTurnHandler.shouldBotPlay(data)) {
    const botPlayer = findActiveBot(data);
    if (botPlayer) {
      botTurnHandler.executeBotTurn(data, botPlayer);
    }
  }
}

// Bot thinking indicator
function showBotThinking(botName) {
  const indicator = document.createElement('div');
  indicator.id = 'bot-thinking';
  indicator.className = 'bot-thinking-indicator';
  indicator.innerHTML = `
    <span class="bot-icon">🤖</span>
    <span class="bot-text">${botName} is thinking...</span>
    <span class="loader">●●●</span>
  `;
  actionPrompt.appendChild(indicator);
}
```

---

## 📦 Implementation Phases

### **Phase 1: Bot Infrastructure** (4-5 hours)
**Goal**: Add bots as players without AI logic

- [x] Create `BotPlayer` class structure
- [ ] Modify Firebase schema to support `isBot` flag
- [ ] Add "Play with AI" lobby option with mode selector
- [ ] Bot auto-join on game start
- [ ] Bot name generation (Ada, Bob, Charlie, Diana...)
- [ ] Update player roster to show bot badge (🤖)

**Deliverable**: Bots join game and appear in player list

---

### **Phase 2: Card Metadata Foundation** (6-8 hours)
**Goal**: Tag enough cards to enable basic clue generation

#### **Option A: Manual Tagging** (Faster start)
- [ ] Tag 50 most obvious cards manually
  - Animals: 10 cards (dogs, cats, birds...)
  - Food: 10 cards (fruits, vegetables...)
  - Vehicles: 10 cards (cars, planes...)
  - Nature: 10 cards (trees, mountains...)
  - Objects: 10 cards (tools, furniture...)
- [ ] Create `CARD_METADATA` structure
- [ ] Write helper functions (category lookup, tag search)
- [ ] Test with 50-card subset

#### **Option B: Crowdsourced Tagging** (Better quality)
- [ ] Create tagging tool (web form)
- [ ] Recruit 5-10 people to tag 50-60 cards each
- [ ] Validate and merge tags
- [ ] Export to `card-metadata.js`

**Deliverable**: 50 tagged cards + metadata system

---

### **Phase 3: Spymaster AI** (8-10 hours)
**Goal**: AI can give reasonable clues in picture mode

- [ ] Implement `generateClue()` core algorithm
- [ ] Tag-based grouping (find cards with common tags)
- [ ] Category-based grouping (animals, food, etc.)
- [ ] Color-based clues (red items, blue items)
- [ ] Risk assessment (avoid assassin, neutrals, opponent)
- [ ] Scoring system (numCards - risk)
- [ ] Word selection (pick best synonym for clue)
- [ ] Fallback logic (safe 1-card clues)
- [ ] Difficulty tuning (easy/medium/hard)

**Testing**:
```javascript
// Unit tests for clue generation
describe('generateClue', () => {
  it('finds 2-card clues for animals', () => {
    const clue = generateClue(mockGameWithAnimals, 'red', 'medium');
    expect(clue.word).toMatch(/ANIMAL|PET|CREATURE/);
    expect(clue.number).toBe(2);
  });
  
  it('avoids assassin cards', () => {
    // ... test risk avoidance
  });
});
```

**Deliverable**: Working spymaster bot for Mode 1 (Competitive)

---

### **Phase 4: Operative AI** (6-8 hours)
**Goal**: AI can guess cards based on clues (for Mode 2: Cooperative)

- [ ] Implement `selectBestGuess()` algorithm
- [ ] Parse clue word and number
- [ ] Match clue to card metadata (tag similarity)
- [ ] Rank unrevealed cards by relevance
- [ ] Apply conservative strategy (avoid risky guesses)
- [ ] Random variation (don't always pick #1 match)
- [ ] Know when to pass (low confidence → pass early)

**Algorithm**:
```javascript
function selectBestGuess(gameState, team) {
  const { currentClue, revealedCards } = gameState.gameState;
  const { word, number } = currentClue;
  
  // Find unrevealed cards
  const candidates = gameState.board.cardIds
    .map((id, idx) => ({ id, idx }))
    .filter((_, idx) => !revealedCards[idx]);
  
  // Score each card based on clue
  const scores = candidates.map(card => {
    const metadata = CARD_METADATA[card.id];
    let score = 0;
    
    // Check if tags match clue word
    if (metadata.tags.includes(word.toLowerCase())) score += 10;
    if (metadata.primaryCategory === word.toLowerCase()) score += 8;
    
    // Check tag similarities (fuzzy matching)
    const clueTags = TAG_TO_CLUE[word.toLowerCase()] || [];
    for (const tag of metadata.tags) {
      if (clueTags.includes(tag.toUpperCase())) score += 5;
    }
    
    return { ...card, score };
  });
  
  // Sort by score
  scores.sort((a, b) => b.score - a.score);
  
  // Pick top match (with small randomness)
  const topScores = scores.filter(s => s.score >= scores[0].score * 0.8);
  return topScores[Math.floor(Math.random() * topScores.length)].idx;
}
```

**Deliverable**: Working operative bot (enables Mode 2 & 3)

---

### **Phase 5: Turn Automation** (3-4 hours)
**Goal**: Bots play automatically on their turn

- [x] Detect bot's turn in `handleGameUpdate()`
- [ ] Add 2-5 second thinking delay (feels natural)
- [ ] Auto-trigger clue/guess actions
- [ ] Show visual indicator ("🤖 Ada is thinking...")
- [ ] Handle edge cases (bot disconnected, game ended)
- [ ] Prevent double-triggering (debounce)

**Deliverable**: Fully autonomous bot gameplay

---

### **Phase 6: UI/UX Polish** (4-5 hours)
**Goal**: Clear, delightful bot experience

- [ ] Lobby: Add "Play with AI" button + mode selector
- [ ] Setup: Show bot slots with "🤖 AI" badge
- [ ] Playing: Bot thinking animation (pulsing dots)
- [ ] Playing: Highlight bot's target cards (for testing)
- [ ] Playing: Bot personality touches (varied delays, comments?)
- [ ] Finished: Show bot stats (clues given, accuracy)
- [ ] Mobile: Optimize bot indicators for small screens
- [ ] Accessibility: Screen reader support for bot actions

**Visual mockup**:
```
┌─────────────────────────────────────┐
│ 🤖 Ada (AI) is giving a clue...    │
│ ●●● (thinking animation)             │
└─────────────────────────────────────┘

Then becomes:

┌─────────────────────────────────────┐
│ 🤖 Ada gave clue: ANIMALS - 2      │
│ Red team's turn to guess            │
└─────────────────────────────────────┘
```

---

### **Phase 7: Testing & Balancing** (5-6 hours)
**Goal**: Fun, balanced AI difficulty

- [ ] Play 20+ full games (Mode 1, 2, 3)
- [ ] Track AI win rate (target 40-50% for medium)
- [ ] Tune difficulty parameters
  - Easy: Conservative, 1-2 cards
  - Medium: Balanced, 2-3 cards
  - Hard: Aggressive, 3-4 cards
- [ ] Fix edge cases (no valid clues, stuck states)
- [ ] Performance testing (bot response time)
- [ ] User testing (recruit 3-5 people)
- [ ] Iterate based on feedback

**Metrics to track**:
- AI clue quality (% of guesses correct)
- Average cards per clue
- Win rate by difficulty
- Fun factor (subjective survey)

---

### **Phase 8: Metadata Expansion** (10-15 hours)
**Goal**: Full 280-card support

- [ ] Tag remaining 230 cards
- [ ] Improve tag consistency
- [ ] Add more categories (emotions, actions, abstract)
- [ ] Build similarity matrix (card-to-card relationships)
- [ ] Refine TAG_TO_CLUE mappings
- [ ] Test with full card pool

**Can be done post-MVP** - 50 cards is enough for initial launch

---

## 📊 Effort Summary

| Phase                        | Hours         | Priority | Complexity    |
| ---------------------------- | ------------- | -------- | ------------- |
| 1. Bot Infrastructure        | 4-5           | P0       | Low ⭐         |
| 2. Card Metadata (50 cards)  | 6-8           | P0       | Medium ⭐⭐     |
| 3. Spymaster AI              | 8-10          | P0       | High ⭐⭐⭐      |
| 4. Operative AI              | 6-8           | P1       | Medium ⭐⭐     |
| 5. Turn Automation           | 3-4           | P0       | Low ⭐         |
| 6. UI/UX Polish              | 4-5           | P1       | Medium ⭐⭐     |
| 7. Testing & Balancing       | 5-6           | P0       | Medium ⭐⭐     |
| 8. Full Metadata (280 cards) | 10-15         | P2       | Low ⭐         |
| **MVP Total (P0)**           | **25-32 hrs** |          |               |
| **Full Feature (P0+P1)**     | **35-45 hrs** |          | **Large (L)** |

---

## 🎯 MVP Scope (Mode 1: Competitive)

**Minimum viable 2-player game** (25-32 hours):

✅ **What's included**:
- 2 human operatives compete against each other
- Each has their own AI spymaster helper
- 50 tagged cards (enough variety)
- Medium difficulty only
- Basic turn automation
- Core UI indicators

❌ **What's deferred**:
- Operative AI (Mode 2, 3)
- Easy/Hard difficulty
- Full 280 cards
- Personality/randomness
- Advanced similarity matching

**MVP Success Criteria**:
1. 2 humans can complete a full game
2. AI gives sensible clues 80%+ of the time
3. Game feels fun (subjective but measurable)
4. No game-breaking bugs

---

## 🚀 Getting Started

### **Recommended Approach**:

1. **Week 1**: Phases 1-2 (Bot infrastructure + Tag 50 cards)
2. **Week 2**: Phase 3 (Spymaster AI core algorithm)
3. **Week 3**: Phases 5, 7 (Turn automation + Testing)
4. **Week 4**: Phase 6 (Polish) + Launch MVP

### **First Milestone** (5-6 hours):
1. Create dummy bot player system
2. Tag 10 obvious cards (5 animals, 5 foods)
3. Write simplest clue generator (picks random tag)
4. Test with manual Firebase updates
5. **Goal**: Prove concept works end-to-end

### **Quick Win Test** (2 hours):
```javascript
// Hard-coded test bot
const TEST_CLUES = {
  red: ['ANIMAL', 2],
  blue: ['FOOD', 2]
};

function testBotClue(team) {
  const [word, number] = TEST_CLUES[team];
  return { word, number };
}

// Manually trigger in console
generateTestClue('red'); // Returns { word: 'ANIMAL', number: 2 }
```

---

## 🔮 Future Enhancements (Post-MVP)

**V2 Features**:
- [ ] Voice synthesis ("The clue is: ANIMALS, 3")
- [ ] Bot personality (Ada = cautious, Bob = aggressive)
- [ ] Learning system (bot improves over time)
- [ ] Custom bot names/avatars
- [ ] Bot difficulty selector in-game
- [ ] Replay with bot commentary
- [ ] Multi-language clue generation

**V3 Features (Advanced AI)**:
- [ ] ML-based image similarity (using CLIP or similar)
- [ ] Contextual clues (based on previous guesses)
- [ ] Adaptive difficulty (adjusts to player skill)
- [ ] Tournament mode (AI vs AI)

---

## ⚠️ Risks & Mitigation

### **Risk 1: AI gives nonsensical clues**
- **Mitigation**: Extensive tag vocabulary, fallback to simple clues
- **Fallback**: Always have 1-card safe clues ready

### **Risk 2: 50 cards not enough variety**
- **Mitigation**: Prioritize most common/recognizable cards
- **Monitoring**: Track card repeat frequency

### **Risk 3: Tagging is too time-consuming**
- **Mitigation**: Start with 20 cards, expand gradually
- **Alternative**: Use AI vision API for auto-tagging (GPT-4V)

### **Risk 4: Image similarity is hard to encode**
- **Mitigation**: Start with explicit categories, refine later
- **Alternative**: Use vector embeddings (but adds complexity)

### **Risk 5: Bot too easy/hard to beat**
- **Mitigation**: Playtesting with parameter tuning
- **Solution**: Multiple difficulty levels with different weights

---

## 📏 Success Metrics

**Technical**:
- ✅ Bots complete 100% of games without crashes
- ✅ Clue generation < 2 seconds
- ✅ No Firebase sync errors

**Gameplay**:
- 🎯 AI clues lead to correct guesses 70%+ of time (medium)
- 🎯 Human win rate 45-55% (balanced between teams)
- 🎯 Average game time: 10-15 minutes

**User Satisfaction**:
- 😊 5/5 stars: "Bot clues made sense"
- 😊 4/5 stars: "Game was fun with AI"
- 😊 3+/5 stars: "Would play again with AI"

---

## 🏁 Final Recommendation

**Size Estimate**: **Large (L)** - 35-45 hours full feature, 25-32 hours MVP

**Go/No-Go**: **✅ STRONG GO**

**Reasoning**:
- High value: Solves "not enough players" problem
- Differentiator: Most online Codenames clones don't have AI
- Reusable: Bot system can extend to other game modes
- Learning: Good exercise in AI game strategy

**Next Action**:
1. Tag 10 cards manually (1 hour)
2. Build simplest bot clue generator (2 hours)
3. Test end-to-end with console commands (1 hour)
4. **Decision point**: If prototype feels promising → proceed with full plan

---

## 📚 Resources

**Similar Games with AI**:
- Codenames Duet (official app) - has solo mode
- Just One (BoardGameArena) - simple word association
- Decrypto - pattern matching AI

**AI Techniques**:
- Word2Vec for semantic similarity
- CLIP for image-text matching
- Decision trees for risk assessment
- Monte Carlo for move evaluation

**Development Tools**:
- VSCode + Copilot for rapid prototyping
- Firebase Emulator for local testing
- Vitest for unit testing
- Manual playtesting sheets (track metrics)

---

## 📝 Notes & Ideas

**Random thoughts**:
- Could bot "learn" from human guesses? (Store which words worked)
- Should bot apologize for bad clues? ("Sorry, that was risky!")
- Multi-bot tournament mode? (4 AIs compete)
- Difficulty via persona (Teacher bot = easy, Genius bot = hard)

**Community features**:
- Share funny bot clues ("Bot said HAPPINESS for a dog and ice cream")
- Leaderboard for humans who beat hard AI
- User-submitted card tags (improve metadata)

---

**Last Updated**: February 13, 2026  
**Author**: GitHub Copilot + Human Collaboration  
**Status**: Ready for implementation
