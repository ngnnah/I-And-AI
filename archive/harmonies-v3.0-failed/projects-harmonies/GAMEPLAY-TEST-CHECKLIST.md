# Harmonies v3.0 - Gameplay Test Checklist

## Test Date: 2026-02-16

## Tester: [Your Name]

---

## ✅ Phase 1: Player Login & Lobby

### Test 1.1: Username Login

- [ ] Navigate to `http://localhost:8080/index.html`
- [ ] Enter username (3-20 characters, alphanumeric + underscore)
- [ ] Click "Continue" button
- [ ] **Expected**: Redirected to lobby with username displayed

### Test 1.2: Create Game

- [ ] Click "Create Game" button (leave room code blank for random)
- [ ] **Expected**: Game created with 4-letter code (e.g., "ABC1")
- [ ] **Expected**: Automatically redirected to game room
- [ ] **Expected**: Game status shows "waiting" until started

### Test 1.3: Join Game (Second Window)

- [ ] Open incognito window
- [ ] Enter different username (e.g., "Bob")
- [ ] Enter room code from first window
- [ ] Click "Join Game"
- [ ] **Expected**: Successfully joined game
- [ ] **Expected**: Both players visible in game

---

## ✅ Phase 2: Game Start & Setup

### Test 2.1: Start Game

- [ ] In first window, verify "Start Game" button appears
- [ ] Click "Start Game"
- [ ] **Expected**: Status changes to "playing"
- [ ] **Expected**: Central board shows 5 spaces with 3 tokens each
- [ ] **Expected**: Animal cards row shows 5 cards with emojis
- [ ] **Expected**: Turn indicator shows "🟢 Your Turn" or "⏱️ Waiting for [player]"

### Test 2.2: Initial Board State

- [ ] Verify hex grid shows single starting hex (0,0)
- [ ] Verify expansion hexes (6 neighbors) shown with dashed borders
- [ ] Verify score displays "0 points"
- [ ] Verify progress indicator hidden

---

## ✅ Phase 3: Core Gameplay - Turn 1

### Test 3.1: Select Central Space

- [ ] Verify turn phase shows "Select 3 tokens"
- [ ] Click any central space with tokens
- [ ] **Expected**: Space highlights with green border
- [ ] **Expected**: Turn phase changes to "Place token 1/3"
- [ ] **Expected**: Progress indicator appears
- [ ] **Expected**: Haptic feedback (on mobile)

### Test 3.2: Place First Token (Ground Level)

- [ ] Verify valid hexes highlighted (green glow)
- [ ] Click starting hex (0,0) or any expansion hex
- [ ] **Expected**: Token animates into place
- [ ] **Expected**: Hex updates with token color
- [ ] **Expected**: Terrain updates (e.g., "water" for blue)
- [ ] **Expected**: Progress shows "Token 1/3"
- [ ] **Expected**: Toast shows "Token placed! 2 remaining"

### Test 3.3: Place Second Token (Stacking Rules)

- [ ] Note the color of second token
- [ ] Verify valid hexes highlighted (follows stacking rules)
- [ ] Try placing on invalid hex (e.g., blue on blue)
- [ ] **Expected**: Error toast "Cannot place token here"
- [ ] **Expected**: Shake animation on invalid hex
- [ ] Click valid hex
- [ ] **Expected**: Token placed successfully
- [ ] **Expected**: Progress shows "Token 2/3"

### Test 3.4: Place Third Token (Complete Mandatory Phase)

- [ ] Place third token on valid hex
- [ ] **Expected**: Progress shows "Token 3/3"
- [ ] **Expected**: Turn phase changes to "Optional actions"
- [ ] **Expected**: Score recalculates automatically
- [ ] **Expected**: Score updates in header (e.g., "0" → "1" for single green)
- [ ] **Expected**: "End Turn" button becomes enabled

---

## ✅ Phase 4: Scoring Verification

### Test 4.1: Tree Scoring (Official Rules)

**Setup:** Place brown, then green on same hex

- [ ] Create 1-brown + 1-green tree
- [ ] Click "Details" button for score breakdown
- [ ] **Expected**: Trees = 3 points ✅

### Test 4.2: Mountain Scoring (GRAY tokens)

**Setup:** Place gray tokens adjacent to each other

- [ ] Place 2 gray tokens on adjacent hexes
- [ ] Verify terrain shows "rock" or "mountain"
- [ ] **Expected**: Mountains score (1pt + 1pt = 2pts) ✅

### Test 4.3: Field Scoring (Flat 5pts per cluster)

**Setup:** Place 2 yellow tokens adjacent

- [ ] Create cluster of 2+ yellow tokens
- [ ] **Expected**: Fields = 5 points (not progressive) ✅

### Test 4.4: Building Scoring (RED tokens, binary)

**Setup:** Place red token surrounded by 3+ different colors

- [ ] Place red on gray (building foundation)
- [ ] Surround with 3+ different terrain types
- [ ] **Expected**: Buildings = 5 points (binary, not proportional) ✅

### Test 4.5: Water Scoring (Longest river only)

**Setup:** Create 2 separate rivers (3 blue + 4 blue)

- [ ] Create river of 3 blue tokens (5 pts)
- [ ] Create river of 4 blue tokens (8 pts)
- [ ] **Expected**: Water = 8 points (not 5+8=13) ✅

---

## ✅ Phase 5: Optional Actions

### Test 5.1: Take Animal Card

- [ ] During "optional" phase, click any animal card
- [ ] Modal appears: "Take Card" or "View Only"
- [ ] Click "Take Card"
- [ ] **Expected**: Card added to player hand (not yet visible in UI - Phase 4 feature)
- [ ] **Expected**: New card drawn from deck to replace
- [ ] **Expected**: Toast "Animal card taken"

### Test 5.2: End Turn

- [ ] Click "End Turn" button
- [ ] Confirmation modal appears
- [ ] Click "Confirm"
- [ ] **Expected**: Turn passes to next player
- [ ] **Expected**: Empty central space refilled with 3 new tokens
- [ ] **Expected**: Turn number increments
- [ ] **Expected**: Second window shows "🟢 Your Turn"

---

## ✅ Phase 6: Multiplayer Sync

### Test 6.1: Real-Time Updates (Window 1 → Window 2)

- [ ] In Window 1, place tokens
- [ ] **Expected**: Window 2 shows tokens appearing in real-time
- [ ] **Expected**: Score updates sync across windows
- [ ] **Expected**: Turn indicator updates

### Test 6.2: Turn Management

- [ ] Verify only current player can interact
- [ ] In waiting window, try clicking central space
- [ ] **Expected**: Toast "Not your turn to select tokens"
- [ ] **Expected**: No unintended actions

---

## ✅ Phase 7: End Game Conditions

### Test 7.1: Board Full (≤2 empty hexes)

- [ ] Play multiple turns until board nearly full
- [ ] When ≤2 empty hexes remain
- [ ] **Expected**: Game status changes to "finished"
- [ ] **Expected**: End game screen appears

### Test 7.2: Pouch Empty

- [ ] Continue playing until pouch cannot refill central board
- [ ] **Expected**: Game ends automatically
- [ ] **Expected**: End game screen shows final scores

### Test 7.3: Winner Declaration

- [ ] Verify end game screen shows:
  - [ ] Winner name with 🏆 trophy
  - [ ] Final scores sorted (highest first)
  - [ ] "Back to Lobby" button works

---

## ✅ Phase 8: UI/UX Verification

### Test 8.1: Mobile Touch Targets

- [ ] Open Chrome DevTools → Device Mode
- [ ] Test on iPhone 14 (390×844px)
- [ ] Verify tap targets ≥ 44px:
  - [ ] Central spaces
  - [ ] Hex cells
  - [ ] Buttons
  - [ ] Animal cards
- [ ] **Expected**: All tappable elements easy to hit

### Test 8.2: Pinch-Zoom

- [ ] On mobile viewport, pinch-zoom hex grid
- [ ] **Expected**: Grid zooms smoothly (max 2×)
- [ ] Pan around zoomed grid
- [ ] **Expected**: Smooth panning

### Test 8.3: Visual Feedback

- [ ] Verify animations work:
  - [ ] Token placement (300ms ease-out)
  - [ ] Hex hover (scale 1.05)
  - [ ] Valid placement glow
  - [ ] Central space pulse when selected
  - [ ] Score increase animation

### Test 8.4: Accessibility

- [ ] Font size ≥ 16px (prevents iOS zoom)
- [ ] Contrast ratio WCAG AA (4.5:1 for text)
- [ ] Keyboard navigation works (Tab key)
- [ ] Screen reader announces elements

---

## ✅ Phase 9: Error Handling

### Test 9.1: Invalid Token Placement

- [ ] Try stacking blue on blue (ground-level token)
- [ ] **Expected**: Error toast "Cannot place token here"
- [ ] **Expected**: Shake animation
- [ ] **Expected**: No placement

### Test 9.2: Empty Central Space

- [ ] After selecting, try clicking already-empty space
- [ ] **Expected**: Error toast "Selected space is empty"

### Test 9.3: Network Disconnect

- [ ] Disable network while in game
- [ ] **Expected**: Error toast "Failed to sync"
- [ ] Re-enable network
- [ ] **Expected**: Game recovers automatically

---

## ✅ Phase 10: Edge Cases

### Test 10.1: Expansion Hex Placement

- [ ] Verify expansion hexes (dashed borders) are clickable
- [ ] Place token on expansion hex
- [ ] **Expected**: Becomes regular hex with token
- [ ] **Expected**: New expansion hexes appear around it

### Test 10.2: Animal Cube Blocking

- [ ] (Phase 4 feature - pattern matching not yet implemented)
- [ ] Once animals work, verify tokens cannot stack on animal cubes

### Test 10.3: Rapid Clicking

- [ ] Rapidly click multiple hexes during placement
- [ ] **Expected**: Only one token places
- [ ] **Expected**: No race conditions

---

## 🎯 Success Criteria

### Core Gameplay ✅

- [ ] **All 10 phases pass without errors**
- [ ] Game is playable end-to-end
- [ ] Multiplayer sync works smoothly
- [ ] Scoring matches official rules exactly

### Performance ✅

- [ ] Page loads in <2 seconds
- [ ] Token placement feels instant (<200ms)
- [ ] No lag when rendering large hex grids
- [ ] Smooth animations (60fps)

### Mobile-First ✅

- [ ] All touch targets ≥ 44px
- [ ] No 300ms tap delay
- [ ] Pinch-zoom works
- [ ] Responsive layout (mobile → tablet → desktop)

### Bug-Free ✅

- [ ] No console errors
- [ ] No visual glitches
- [ ] No data loss on refresh (localStorage)
- [ ] No multiplayer desync

---

## 📝 Test Results

### Bugs Found:

1. [Bug description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce:
   - Expected vs Actual:

### Notes:

- [Any observations or suggestions]

---

## ✅ Final Verdict

- [ ] **PASS** - Game is production-ready
- [ ] **CONDITIONAL PASS** - Minor issues, can deploy with known limitations
- [ ] **FAIL** - Critical bugs, requires fixes before deployment

**Tester Signature:** ********\_********
**Date:** 2026-02-16
