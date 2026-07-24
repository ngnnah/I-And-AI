# PLAN — Harmonies art & UX pass

Working handoff for the **next session**. Mechanics are frozen & verified; this is the
art / design / layout / UX backlog. Read `CLAUDE.md` first for architecture, the design system, and
the code touchpoints — this doc assumes it. Delete or trim items here as they ship (keep it living).

## Guiding principles (don't drift from these)

- **Calm & harmonious above all** — soft/translucent, light colors, minimal motion, subtle > flashy.
  When a change makes the screen busier or louder, it's probably wrong.
- **Mechanics are frozen.** Visual/interaction work only; don't alter rules or scoring.
- **No build step, self-contained.** New art = SVG or inline data URIs in `assets/`. No pipeline.
- **One source of truth for size:** `--hex-w`. Never hard-code hex px elsewhere.

## The key fork — decide art direction first

Everything else depends on this. Pick one for the session (can escalate later):

- **Tier A — Refine, keep emoji.** Tune layout/spacing/palette/motion; emoji tokens stay. Lowest
  effort, keeps the current playful charm. Good if the game already "feels right."
- **Tier B — Custom token art.** Replace the 6 emoji + 2 composites (🌳 tree, 🏡 building) with
  original SVG art. This is what defines the game's identity. Medium effort; the highest-leverage
  visual upgrade.
- **Tier C — Full art pass.** Tier B + board/hex texture, backgrounds, animal-card art, header scene.
  Largest effort; do only after B lands and feels good.

Recommendation: **B**, one token at a time, verifying each on-board before moving on.

## Backlog (prioritized)

### 1. Token art — the main event (Tier B)
Replace emoji with original art. Touchpoints:
- `TOKEN_EMOJI` map + `updateHexDisplay()` (`index.html:1914`) — on-board rendering, incl. the
  composite logic (green-on-brown → tree, red-stacked → building, height badge suppression).
- `renderMiniPattern()` (`:1544`) / `getCompactPattern()` (`:1568`) — the mini honeycomb on animal
  cards. **Must mirror the board's token visuals** or cards and board diverge.
- Keep art readable at the smallest responsive `--hex-w` (46px) and in the ~22px card mini-pattern.
- Swap emoji strings in JS with node `.split().join()`, never perl/sed (silent multibyte failures).
- Suggested approach: one inline SVG symbol per terrain in `assets/`, referenced by `<use>`, so
  board + card share exactly one definition. Do water first (most visible), verify, then the rest.

### 2. Board & layout polish (Tier A, do alongside)
- Review desktop vs mobile balance at all three breakpoints (62/52/46px). Watch for the old
  "big center void" regression on wide screens.
- Hex grout/edge weight, empty-hex affordance, and the valid-placement highlight — should whisper,
  not shout. Confirm `prefers-reduced-motion` still fully quiets motion (`index.html:136`).
- Terrain gradients: audit for calm/cohesion as a set (palette table in `CLAUDE.md`); keep CSS and
  the JS `TERRAIN_GRADIENTS` map in sync if changed.

### 3. Animal card design
- Card layout, the paw marker (cube location), the height badge, and the scoring progression
  display — make the "more cubes = more points" progression legible at a glance.
- Ensure the mini-pattern uses the same token art as #1.

### 4. Micro-interactions & feedback (keep subtle)
- Placement/complete/error feedback: gentle, brief. There's a `playTone`/`sfxWin` sound system
  (`index.html:2431`) — consider a mute toggle + soft ambient cues, but default to restraint.
- Turn-boundary clarity (start → place 3 → optional card → end) without adding chrome.

### 5. Branding & polish (Tier C tail)
- Header scene, favicon set, and `assets/harmonies-icon.svg` cohesion.
- Optional: PWA/installable (manifest + service worker) so it opens like an app on phones. Nice for
  touch-and-go; confirm with owner before building — it's scope beyond pure art.

## Start-of-session checklist

```bash
cd projects/gaming/harmonies && python3 -m http.server 8001   # play at localhost:8001
npm test && npx playwright test                                # baseline: all green before art work
```
1. Read `CLAUDE.md` (design system + gotchas).
2. Pick the art tier (fork above).
3. Work one visual element end-to-end (board **and** card), screenshot, eyeball for calm, commit.
4. Deploy via the rsync in `CLAUDE.md` (excludes `*.md`); verify live + `.md` files 404.

## Open questions for the owner

- Art tier for this session (A / B / C)?
- Any reference art or mood (the current Fuji/Hokusai/sakura icon sets a Japanese-woodblock tone —
  extend that, or go a different direction)?
- Is PWA/installable wanted, or keep it a plain web page?
