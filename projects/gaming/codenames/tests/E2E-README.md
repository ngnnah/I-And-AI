# Codenames E2E Tests

**End-to-end tests using Playwright** to test multiplayer Duet mode with 2 real browser contexts.

## Running Tests

```bash
cd projects/gaming/codenames

# Install dependencies (first time only)
npm install
npx playwright install chromium

# Run tests
npm run test:e2e           # Headless (fast)
npm run test:e2e:headed    # See browsers in action
npm run test:e2e:ui        # Interactive UI mode
```

## What Gets Tested

### Test 1: Complete Turn Cycle
Simulates 2 players (P1 and P2) playing Duet mode:
1. P1 creates game, P2 joins
2. P1 gives clue → currentPlayer switches to P2
3. P2 guesses → currentPlayer STAYS as P2 (bug to verify)
4. P2 gives clue → currentPlayer switches to P1
5. P1 guesses → currentPlayer STAYS as P1
6. Back to P1 giving clue (cycle repeats)

**Expected flow:** `P1clue → P2guess → P2clue → P1guess → P1clue`

### Test 2: Color Map Usage
Verifies that card reveals check the **clue giver's color map** (not the guesser's):
- When P2 is guessing, uses P1's colorMap (P1 gave the clue)
- When P1 is guessing, uses P2's colorMap (P2 gave the clue)

## Test Environment

- **Target:** https://ngnnah.github.io/I-And-AI/projects/gaming/codenames/
- **Browser:** Chromium (headless or headed)
- **Workers:** 1 (sequential to avoid Firebase race conditions)
- **Timeout:** 60s per test

## Debugging

Tests capture:
- Console logs from both P1 and P2 browsers
- Screenshots on failure
- Trace files on retry (view with `npx playwright show-trace`)
- HTML report (auto-opens on failure)

## Known Issues Being Tested

1. **Turn switching bug:** currentPlayer switches to P1 after P2 guesses (should stay P2)
2. **Color map bug:** Card reveals check guesser's map instead of clue giver's map

These bugs pass in unit tests but fail in actual multiplayer gameplay.
