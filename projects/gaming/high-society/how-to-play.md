# High Society — How to Play

> A bidding game by Reiner Knizia for 3–5 players.
> Compete for the most prestigious collection — but don't go broke doing it.

---

## Overview

Players bid against each other to acquire luxury status cards using a hand of money cards. At game end, the player with the least money remaining is **eliminated** before scoring. The player with the highest total prestige wins.

**Key tension:** You must spend money to win valuable cards, but running out of money disqualifies you entirely.

---

## Components

### Status Cards (16 total)

The shared deck has three kinds of cards:

| Type         | Count | Border | Effect                                      |
| ------------ | ----- | ------ | ------------------------------------------- |
| **Luxury**   | 10    | White  | Values 1–10 — add to your prestige score    |
| **Prestige** | 3     | Red    | "Promotion to Peerage" — doubles your score |
| **Disgrace** | 3     | Red    | Negative effects (see below)                |

**Prestige cards (x2 multiplier):** Each one doubles your final score.

- 1 prestige = ×2 your score
- 2 prestige = ×4 your score
- 3 prestige = ×8 your score

**Disgrace cards:**

- **Thief** — You must discard one of your luxury cards. If you have none, the next luxury you win is immediately discarded.
- **Scandale** — Your final score is halved.
- **Passée** — Subtract 5 from your final score.

### Money Cards (per player)

Each player receives **11 money cards** in their unique color:

> **1, 2, 3, 4, 6, 8, 10, 12, 15, 20, 25** (totalling 106)

Denominations 5, 7, 9, 11 are intentionally missing — this limits how precisely you can hit certain bid targets.

---

## Setup

1. Shuffle the 16 status cards into a face-down deck in the center.
2. Each player takes 11 money cards (the full set above) in their unique color.
3. Randomly choose who starts — they will reveal and open the first auction.

---

## Game End Trigger

The game ends **immediately** when the **4th red-bordered card** (prestige or disgrace) is **revealed**. That card is not auctioned. The 3 red cards revealed before it were auctioned normally.

---

## Turn Structure

Each round:

1. Reveal the top status card from the deck.
2. If it's the **4th red card** → game ends (see Scoring).
3. Otherwise, run an **auction** for the revealed card.
4. The winner of the auction starts the next round.

---

## Auctions

There are two types of auctions depending on the card revealed.

### Luxury/Prestige Auction (you WANT the card)

You want to win this card to boost your score.

**Mechanics:**

1. The player who won the last auction (or the start player for the first round) opens bidding.
2. On your turn, you must either:
   - **Raise:** Add one or more money cards to your current bid, making it higher than the current highest total. Cards placed on the table **cannot be taken back** until the auction ends.
   - **Fold:** Withdraw from this auction and take back **all** your bid cards (including any previously committed cards).
3. You may fold on your turn **without adding any new cards** — you are never forced to raise.
4. Play continues clockwise until only one player hasn't folded.
5. **That player wins the card** and permanently loses all their bid money (spent cards go out of the game).
6. All other players get their bid money back.

**Bids are cumulative:** Each raise adds to your committed cards — you cannot withdraw earlier cards. Your total bid grows each time you raise.

**Example:** Alice bids 8 (plays her 8-card, on table). Bob bids 10. Alice raises to 14 (adds 6 to her 8 — both on table). Bob folds, retrieves his 10. Alice wins the card; her 8 and 6 are gone.

---

### Disgrace Auction (you DON'T want the card)

You want to AVOID taking this card. Someone must take it.

**Mechanics:**

1. Same structure — the previous winner opens, play goes clockwise.
2. On your turn, you must either:
   - **Bid:** Play money cards face-up (committing to not take the card yet). Increases pressure on others.
   - **Pass:** Immediately take the disgrace card and **retrieve all your bid money** (no financial loss — just the bad card).
3. The **first player to pass** takes the card and gets their money back.
4. **All players who bid** during this auction (but did not pass first) **lose their bid money** permanently.
5. Auction ends as soon as one player passes.

**Strategy:** Bidding raises the stakes — if you commit money and someone else passes, you lose that money. But if you pass too early, you take the card. It's a game of chicken.

**Example:** Alice bids 6, Bob bids 8, Charlie passes (takes Scandale, gets his 0 back). Alice loses 6, Bob loses 8, Charlie has the card but no money loss.

---

## Scoring

When the 4th red card triggers game end:

### Step 1: Eliminate the poorest player

Count each player's remaining money. The player with the **least total money** is **eliminated** — they cannot win, regardless of their card collection.

_Tiebreaker for elimination: the player who joined the game earlier is eliminated._

### Step 2: Score the remaining players

```
Score = (sum of luxury card values) × (2 ^ number of prestige cards)
      - 5 per Passée card held
      ÷ 2 if holding Scandale (applied after prestige multiplier)
```

**Examples:**

- Luxury cards 3, 7, 10 (sum = 20), no prestige → Score = 20
- Luxury 3, 7, 10 (sum = 20), 1 prestige card → Score = 40
- Luxury 3, 7, 10 (sum = 20), 2 prestige cards → Score = 80
- Score 80 + Scandale → Final score = 40
- Score 80 + Passée → Final score = 75

### Step 3: Determine the winner

Highest score wins. **Tiebreaker:** most money remaining.

---

## Special Rules

### Thief Card — Deferred Effect

If you take the Thief but have no luxury cards yet, mark it as unresolved. The **next luxury card you win** is immediately discarded. (The Thief resolves one luxury card.)

### Running Out of Money

You cannot be forced to bid if you have no money cards. If it is your turn and you have no money, you must pass or fold.

### All Players Fold (Luxury)

Theoretically impossible if one player remains — that player wins.

### All Players Bid (Disgrace) with No One Passing

Eventually someone must pass on their turn. The last player in an auction always has the option to pass.

---

## Quick Reference

| Auction Type      | You want to... | Winner        | Winner's money | Bidders' money |
| ----------------- | -------------- | ------------- | -------------- | -------------- |
| Luxury / Prestige | WIN the card   | Last bidder   | Lost           | Returned       |
| Disgrace          | AVOID the card | First to pass | Returned       | Lost           |

---

## Playing on the App

### Getting Started

1. Open the app and enter your name.
2. Create a new game (you'll get a 6-character room code) or join an existing one.
3. Share the room code with friends. The host starts the game when 3–5 players have joined.

### In-Game UI

**Current Card Panel (top):** Shows the card up for auction — its name, value, type, and whether this is a luxury or disgrace auction.

**Bid Area (middle):** Shows all players' current bids as colored money stacks. Grayed-out players have already folded/passed.

**Your Hand (bottom):** Your money cards as clickable tiles. Click a card to stage it for your next raise. Click again to remove it from the staged pile.

**On Table (locked):** Cards you've already committed in a previous raise are shown here — they cannot be taken back. Your total bid is the sum of committed + staged cards.

**Staged Bid Panel:** New cards being added this turn. Tap "Confirm Bid" to lock in the raise (total must exceed current highest). Tap "Pass/Fold" to withdraw — you'll get all your committed cards back.

### Important Notes

- **Bids are visible to all players** — real-time sync means everyone sees everyone's bids.
- **Your money total is visible** — plan around what opponents can afford.
- **Mobile-friendly** — plays well on phones; share a room code over chat.
- It is your turn when the bid area highlights your player color.

---

## Tips for New Players

- **Don't hoard money** — the highest score wins, not the most cash. You just can't run out.
- **Prestige cards are incredibly powerful** — 3 prestige cards turns a score of 20 into 160.
- **Disgrace cards hurt most when others have prestige** — Scandale halving a score of 160 is catastrophic.
- **Spread spending** — if you're richest, you can afford to win costly luxury cards.
- **Watch opponents' hands** — when someone is low on money, they may be desperate to fold.
