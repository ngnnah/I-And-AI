# Codenames Enhancement Plan v2

## Context

The Codenames multiplayer game (projects/gaming/codenames/) is a production-ready vanilla JS app with Firebase Realtime DB, 4 game modes (Words, Pictures, DIY, Duet), and solid test coverage. This plan adds 5 major feature areas designed for parallel implementation.

**Current stack:** Vanilla JS (ES6 modules), Firebase Realtime DB, plain CSS, no build step.

---

## Feature 1: UX — Dynamic Backgrounds + Sounds

### Dynamic Background (CSS-based, minimal JS)

Switch the full-page background tint based on whose turn it is.

**Competitive modes:**

- Red team's turn → warm red tint (`#1a0808`)
- Blue team's turn → cool blue tint (`#08081a`)

**Duet mode:**

- P1's turn → warm rose tint (`#1a0d0d`)
- P2's turn → cool slate-blue tint (`#0d0d1a`)

**Implementation:**

- Add `body { transition: background-color 0.8s ease; }` to `css/styles.css`
- Add `body[data-turn="red"] { background: #1a0808; }` etc. CSS rules
- In `js/screens/game-room.js`, set `document.body.setAttribute('data-turn', team)` on every state update
- No new files required — pure CSS data-attribute pattern

**Files to modify:**

- `css/styles.css` — add `[data-turn]` rules + background transition
- `js/screens/game-room.js` — set `data-turn` attribute in `updateUI()` / state render functions

---

### Sound System

**Architecture: `js/audio-manager.js` (new file, ~120 lines)**

```js
class AudioManager {
  constructor() {
    this.ctx = null; // lazy-init AudioContext on first user gesture
    this.enabled = true;
    this.sfx = {};  // preloaded .mp3 AudioBuffers
  }
  init() { this.ctx = new AudioContext(); }

  // Web Audio API — programmatic tones (no files needed)
  playTone(freq, duration, type = 'sine') { ... }

  // .mp3 playback
  async loadSfx(name, url) { ... }
  playSfx(name) { ... }

  // Named game events
  cardReveal(result) { ... }  // green=chime, neutral=thud, assassin→.mp3
  clueSubmitted()    { ... }  // ascending ding
  turnSwitch()       { ... }  // whoosh .mp3
  gameWin()          { ... }  // victory fanfare .mp3
  gameLoss()         { ... }  // doom-sting .mp3
  mistakeMade()      { ... }  // low buzz tone (Duet)
}
export const audio = new AudioManager();
```

**Sound event map:**

| Event                  | Source    | Sound                      |
| ---------------------- | --------- | -------------------------- |
| Card reveal — green    | Web Audio | Rising chime (440→880 Hz)  |
| Card reveal — neutral  | Web Audio | Dull thud (200 Hz, short)  |
| Card reveal — assassin | .mp3      | Doom-style death sting     |
| Clue submitted         | Web Audio | Quick ascending ding       |
| Turn switch            | .mp3      | Whoosh/fanfare ~1s         |
| Game win               | .mp3      | Victory fanfare ~3s        |
| Game loss              | .mp3      | Sad trombone or dark sting |
| Mistake (Duet)         | Web Audio | Low buzz 150 Hz            |

**Assets:** 4–5 royalty-free .mp3 files (~100KB total) from freesound.org or OpenGameArt, placed in `images/sfx/` (new folder).

**Sound toggle:** Mute button (🔊/🔇) in game header; persists in localStorage.

**Files to create/modify:**

- `js/audio-manager.js` — new file
- `js/screens/game-room.js` — import audio, call events on card reveal, clue submit, turn switch, game end
- `css/styles.css` — mute button styling
- `index.html` — mute button in `.game-header`
- `images/sfx/` — new folder with .mp3 files

---

## Feature 2: In-game Chat

### Firebase Schema (extends existing `/games/{gameId}`)

```
/games/{gameId}/chat/{messageId}
  playerId:    string
  playerName:  string
  team:        "red" | "blue" | "p1" | "p2" | null
  text:        string (max 200 chars)
  timestamp:   number (serverTimestamp)
```

Security: Firebase rules limit write rate + enforce max 200 chars.

### UI Design

- **Collapsed by default** — chat panel slides in from right (desktop) or bottom (mobile)
- **Toggle button** in game header: 💬 with unread badge count
- **Panel layout:**
  ```
  ┌─────────────────────┐
  │ 💬 Chat         [×] │
  ├─────────────────────┤
  │ PlayerA (Red): nice │
  │ PlayerB: good clue! │
  │                     │
  ├─────────────────────┤
  │ [_____________] [→] │  ← 200-char input
  └─────────────────────┘
  ```
- Messages colored by team (red/blue/duet player tint)
- Auto-scroll to latest; max 50 messages shown in view
- Timestamps shown on hover

### Firebase Functions

```js
// firebase-config.js — new function
export async function sendChatMessage(gameId, playerId, playerName, team, text) { ... }

// firebase-sync.js — new listener
export function listenToChat(gameId, onMessage) {
  const chatRef = ref(database, `games/${gameId}/chat`);
  return onChildAdded(chatRef, (snap) => onMessage(snap.val()));
}
```

**Files to create/modify:**

- `js/game/firebase-config.js` — add `sendChatMessage()`
- `js/game/firebase-sync.js` — add `listenToChat()`
- `js/screens/game-room.js` — chat panel rendering, input handling, unread badge
- `css/styles.css` — chat panel styles (slide-in, message bubbles, badge)
- `index.html` — chat panel HTML structure

---

## Feature 3: Game History & Analytics

### Firebase Schema (new dedicated collection)

```
/analytics/games/{gameId}
  gameId:          string
  mode:            "words" | "pictures" | "diy" | "duet"
  finishedAt:      timestamp
  durationMs:      number
  winner:          "red" | "blue" | "win" | "loss" | null
  winReason:       string
  playerCount:     number
  players:         [{name, team, role}]
  clueLog:         [{clue, number, cardsRevealed, accuracy, givenBy}]
  turnsUsed:       number
  mistakesMade:    number  (Duet only)
  greenRevealed:   number  (Duet only)
  avgCardsPerTurn: number  (computed before write)
  bestClue:        {clue, number, allFound: bool}
```

Existing `/gameHistory/{gameId}` untouched for backwards compat — we write to both.

### Analytics Computed on Client (before write)

```js
function computeAnalytics(gameState, clueLog, durationMs) {
  const avgCardsPerTurn = totalCardsRevealed / turnsUsed;
  const bestClue = clueLog.find(entry => entry.accuracy === 1.0); // all N guesses found
  return { avgCardsPerTurn, bestClue, ... };
}
```

### History UI

**Lobby "Recent Games" section (already exists):**

- Show 5 most recent games with expandable rows → clue log + stats
- "View All Stats" button → analytics page or modal

**Analytics Page/Modal:**

```
┌─────────────────────────────────────────┐
│ 📊 Game History & Stats                 │
├─────────────┬───────────────────────────┤
│ ⚡ Fastest  │ Last 5 games (expandable) │
│ 🎯 Best Clue│ [Game — 4:23 — Win]      │
│ 🔢 Efficient│ [Game — Duet, 8 turns]   │
│ 📈 Win Rate │ ...                      │
└─────────────┴───────────────────────────┘
```

**5 Analytics Cards:**

1. **Fastest wins** — top 5 by `durationMs` per mode
2. **Most efficient** — top 5 by fewest turns to win
3. **Best clues** — clues where accuracy = 1.0 (all guesses found)
4. **Avg cards/turn** — by mode
5. **Win rates** — simple CSS bar chart by mode (no library needed)

**Files to create/modify:**

- `js/game/firebase-config.js` — add `writeAnalytics()`, `fetchAnalytics()`
- `js/game/firebase-sync.js` — call `writeAnalytics()` on game end
- `js/screens/lobby.js` — expandable game history rows, analytics link
- `js/screens/analytics.js` — new file for analytics display logic
- `analytics.html` — new standalone analytics page
- `css/styles.css` — expandable rows, analytics cards, CSS bars

---

## Feature 4: AI Spymaster (Pre-computed Hint Database)

### Offline Build Process (Python, runs once)

```
tools/generate-ai-hints.py
```

1. Load all 400 Codenames words from `js/data/word-lists.js`
2. Generate semantic embeddings (`sentence-transformers all-MiniLM-L6-v2`)
3. For each board configuration: find word clusters (cosine similarity ≥ 0.65)
4. For each cluster of size 2–5: find centroid's nearest English word not on the board
5. Score candidates: `score = min(sim_to_targets) - max(sim_to_avoid)`
6. Store top 3 hints per word combination as JSON

**Database shape:**

```js
// js/data/ai-hints.js (generated, ~2–5 MB)
export const AI_HINTS = {
  // key = sorted word list (canonical join)
  "AFRICA,AMAZON": [
    { clue: "jungle",   count: 2, score: 0.82, topics: ["geography"] },
    { clue: "explorer", count: 2, score: 0.74, topics: ["adventure"] }
  ],
  "AFRICA,AMAZON,ANACONDA": [
    { clue: "snake",    count: 2, score: 0.88 },
    { clue: "wild",     count: 3, score: 0.71 }
  ],
  ...
}
```

### Runtime AI (`js/ai-spymaster.js`, ~200 lines)

```js
class AISpymaster {
  constructor(myCards, avoidCards, difficulty) { ... }

  findBestClue() {
    // 1. Based on difficulty: target 2 / 3 / 4+ cards
    // 2. Enumerate combinations of myCards
    // 3. Look up each combo key in AI_HINTS
    // 4. Filter: clue must not be in word list, not close to avoidCards
    // 5. Rank and select: Easy=random top-10, Medium=top-3, Hard=top-1
    return { clue, count };
  }

  explainClue(clue) {
    return AI_HINTS[key]?.find(h => h.clue === clue)?.topics ?? [];
  }
}
```

### Difficulty Levels

| Level  | Target cards | Selection          | Feel                             |
| ------ | ------------ | ------------------ | -------------------------------- |
| Easy   | 2 cards      | Random from top 10 | Occasionally suboptimal          |
| Medium | 3 cards      | Top 3 by score     | Reliable but not perfect         |
| Hard   | 4–5 cards    | Best overall score | Optimal, surprising associations |

### Game Integration

**Lobby UI:**

- "Include AI Spymaster" toggle with difficulty selector (Easy / Medium / Hard)
- AI takes Spymaster role; human players are Operatives
- Duet: AI can act as partner Spymaster for solo play

**In-game:**

- "🤖 AI thinking..." placeholder (400ms fake delay for UX)
- AI auto-submits clue, game continues as normal

### Post-game AI Insights (killer feature)

At game end, expandable "🤖 AI Analysis" card:

- Best clue AI would have given each turn (with topic tags)
- Missed connections: "AFRICA + JUNGLE → 'safari' (you never clued these together)"
- Fun facts from topic metadata: geography, pop culture, history connections

**Files to create:**

- `tools/generate-ai-hints.py` — offline script (Python, uv)
- `js/data/ai-hints.js` — generated DB (force-add to git)
- `js/ai-spymaster.js` — runtime logic
- Update `js/screens/game-room.js` — AI turn trigger, "thinking" UX, post-game panel
- `css/styles.css` — AI insights panel

**Python deps (add via uv):** `sentence-transformers`, `numpy`, `tqdm`

---

## Feature 5: How-to Pages

### Two New Standalone Pages

- **`how-to-play.html`** — Classic Codenames (Words, Pictures, DIY)
- **`how-to-duet.html`** — Duet Cooperative mode

Linked from: lobby "?" icon, game room header, `public/index.html` landing page.

### Content: how-to-play.html

1. Objective (find your team's agents first)
2. Setup: teams, Spymaster and Operative roles
3. Spymaster's turn: one-word clue + number
4. Operative's turn: guessing cards
5. Special clues: `0` (no connection), `∞` (unlimited guesses)
6. Assassin = instant loss
7. Differences between Words / Pictures / DIY modes
8. Beginner tips

### Content: how-to-duet.html

1. Cooperative goal (find all 15 green agents)
2. Dual-perspective board — **interactive diagram**
3. Cross-danger explained visually (P1's agent = P2's assassin)
4. Turn flow: give clue → partner guesses → switch roles
5. Win/loss conditions (9 turns, 9 mistakes, assassin hit)
6. Strategy tips: prioritize safe clues, manage mistake budget

### Interactive Board Diagram (Duet page)

Mini 5×5 board with a "P1 view / P2 view" toggle:

- Colors update live to show dual perspective
- Highlights cross-danger card pairs
- Pure HTML/CSS/JS, no dependencies

**Files to create:**

- `how-to-play.html`
- `how-to-duet.html`
- `css/how-to.css` — shared tutorial styles

---

## Firebase Schema Summary

### New paths:

```
/games/{gameId}/chat/{msgId}
  playerId, playerName, team, text, timestamp

/analytics/games/{gameId}
  mode, finishedAt, durationMs, winner, winReason,
  players[], clueLog[], turnsUsed, mistakesMade,
  avgCardsPerTurn, bestClue
```

Existing `/gameHistory/{gameId}` unchanged.

---

## Files Overview

### New Files

| File                         | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `js/audio-manager.js`        | Sound system (Web Audio API + .mp3)      |
| `js/ai-spymaster.js`         | AI clue generation at runtime            |
| `js/data/ai-hints.js`        | Pre-computed hint DB (generated offline) |
| `js/screens/analytics.js`    | Analytics page logic                     |
| `tools/generate-ai-hints.py` | Offline embedding script                 |
| `how-to-play.html`           | Classic mode tutorial                    |
| `how-to-duet.html`           | Duet mode tutorial                       |
| `css/how-to.css`             | Tutorial page styles                     |
| `images/sfx/*.mp3`           | 4–5 royalty-free sound files             |

### Modified Files

| File                                | Changes                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `css/styles.css`                    | Dynamic bg, chat panel, analytics cards, AI panel, mute btn |
| `index.html`                        | Chat toggle, mute btn, analytics link, how-to links         |
| `js/screens/game-room.js`           | Audio events, dynamic bg, chat, AI turn, insights panel     |
| `js/screens/lobby.js`               | Expandable history, analytics section, how-to links         |
| `js/game/firebase-config.js`        | `sendChatMessage()`, `writeAnalytics()`, `fetchAnalytics()` |
| `js/game/firebase-sync.js`          | `listenToChat()`, analytics write on game end               |
| `public/projects/gaming/codenames/` | rsync after each feature                                    |

---

## Implementation Phases

### Phase A — Quick Wins (~1–2 days)

1. Dynamic backgrounds (CSS rules + data-attribute in JS)
2. Web Audio tones (card reveal, clue submit, mistake)
3. How-to pages (static HTML, no backend)

### Phase B — Social + Data (~3–5 days)

4. In-game chat (Firebase schema + real-time UI)
5. Source + integrate .mp3 files (win/loss/turn sounds)
6. Analytics write path (computed on game end, Firebase write)
7. Analytics read path (lobby expandable rows, 5 recent games)

### Phase C — AI + Deep Stats (~1–2 weeks)

8. Full analytics page with leaderboard cards
9. Python offline script to generate `ai-hints.js`
10. AI Spymaster runtime + game mode toggle in lobby
11. Post-game AI insights panel

---

## Testing Plan

### New Unit Tests

- `tests/audio-manager.test.js` — mock AudioContext, test event routing
- `tests/ai-spymaster.test.js` — clue selection per difficulty, no-valid-clue edge case

### E2E Tests (Playwright)

- Chat: message sent by player A appears for player B
- Dynamic bg: `data-turn` attribute updates on turn change (all modes)

### Manual Checklist

- [ ] Background transitions smoothly in all 4 modes
- [ ] Mute preference persists after page reload
- [ ] Chat shows real-time messages with correct team colors
- [ ] Analytics are written at game end and readable in lobby
- [ ] AI gives valid clues (not in word list, safe from assassin)
- [ ] 3 AI difficulty levels feel distinctly different
- [ ] How-to pages render well on mobile
- [ ] Duet interactive diagram toggles P1/P2 view correctly

### Deploy Verification

```bash
rsync -av --delete --delete-excluded \
  --filter='+ /css/***' --filter='+ /images/***' \
  --filter='+ /js/***' --filter='+ *.html' --filter='- *' \
  projects/gaming/codenames/ public/projects/gaming/codenames/

git add -f public/projects/gaming/codenames/js/data/ai-hints.js
git add -f projects/gaming/codenames/js/data/ai-hints.js
# Verify: https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/
```
