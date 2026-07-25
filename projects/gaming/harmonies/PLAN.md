# PLAN — Harmonies art & UX pass

Working handoff for the **next session**. Mechanics are frozen & verified; this is the
art / design / layout / UX backlog. Read `CLAUDE.md` first for architecture, the design system, and
the code touchpoints — this doc assumes it. Delete or trim items here as they ship (keep it living).

## Guiding principles (don't drift from these)

- **Calm & harmonious above all** — soft/translucent, light colors, minimal motion, subtle > flashy.
  When a change makes the screen busier or louder, it's probably wrong. This now applies literally:
  SFX volumes are capped in test (`< 0.05` per part) and ambience at `AMBIENCE_CAP` 0.06 — a level
  calibrated by measuring RMS, not guessed (see the Sound system section in `CLAUDE.md`).
- **Mechanics are frozen.** Visual/interaction work only; don't alter rules or scoring.
- **No build step, self-contained.** New art = SVG or inline data URIs in `assets/`. No pipeline.
- **One source of truth for size:** `--hex-w`. Never hard-code hex px elsewhere.

## Art direction — settled

**Tier B done; we are now in Tier C** (board/hex texture, backgrounds, animal-card art, header
scene). Tier A polish still runs alongside. Decisions locked in, don't re-litigate without a reason:

- **Hand-authored SVG for tokens, raster for illustration.** The pre-generated art in
  `~/Downloads/harmonies-assets/` is reference, not shippable pixels. Anything rendered small
  (tokens, 22px card patterns) gets authored as SVG paths — tracing the PNGs gives wobbly
  anti-aliased paths, baked-in `[cite: N]` watermarks, and opaque discs that fight the hex fill.
  Anything rendered large where the watercolour look *is* the art (animal cards, sun medallions,
  backgrounds) stays raster: crop → downscale → PNG/WebP in `assets/`. Don't trace those.
- **No discs behind glyphs.** The hex carries the terrain colour. See `CLAUDE.md`.

## Backlog (prioritized)

### 1. ✅ Token art — shipped 2026-07-25
Nine original SVG glyphs replace the emoji on board, token chips, and card mini-patterns, sharing one
`<symbol>` sheet so they can't diverge. Iterate in `dev-token-lab.html`. Details + authoring gotchas
in `CLAUDE.md`. Two follow-ups it surfaced:
- **22px legibility (the real remaining gap).** At card-mini size every detailed glyph degrades to a
  smudge — leaf is a sliver, brick is a blur, and that's exactly where animal patterns must be read
  at a glance. Proposed fix: a second, minimal `<symbol>` per terrain (bold silhouette, no interior
  detail) used only by `renderMiniPattern()`. It already takes `hexW`, so switch on it.
- **Glyph contrast vs the calm principle.** The new glyphs are bright fills + dark outlines, which
  reads crisp but pushes the board *more* saturated, against "soft/translucent, subtle > flashy".
  Worth an audit of glyph fills together with the terrain gradients in #2 rather than in isolation.

### 1b. Backgrounds & scene (Tier C, next up)
Owner reference (2026-07-25): a dawn **Alpe di Siusi / Dolomites** photo — warm hazy sky, soft rolling
green meadows, tiny dark cabins, pale distant peaks, very low contrast. Also
`~/Downloads/harmonies-assets/background.png` and the four browser mockups (`IMG_3539-great-layout`,
`IMG_3540-background2`). The mood is *atmospheric perspective*: light, desaturated, receding — it must
sit behind the board without competing with it. Keep the board legible; this is wallpaper, not art
direction for the hexes.

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
- ✅ **Sound shipped** (2026-07-25). Procedural WebAudio, zero asset bytes: per-token-colour
  placement voices on a D-pentatonic ladder (pitch climbs with stack height), 9 event cues, and 3
  crossfaded ambience scenes behind the header 🔊 popover. SFX on / ambience off by default. See the
  Sound system section in `CLAUDE.md` and `docs/superpowers/specs/2026-07-25-harmonies-sound-design.md`.
  Audition with `dev-sound-lab.html`. **Open: tune by ear** — the mix was verified for
  signal + headroom by test, not for taste.
- Turn-boundary clarity (start → place 3 → optional card → end) without adding chrome. Sound now
  marks it (soft exhale + pouch shuffle); the *visual* side is still open.
- Possible follow-ons if the sound lands well: a distinct cue when a card enters/leaves hand, and
  making the ambience react faintly to the board (more water tokens → more lapping).

### 5. Branding & polish (Tier C tail)
- Header scene, favicon set, and `assets/harmonies-icon.svg` cohesion.
- Optional: PWA/installable (manifest + service worker) so it opens like an app on phones. Nice for
  touch-and-go; confirm with owner before building — it's scope beyond pure art.
  **Also the only real fix for the iOS storage-eviction risk below.**

## Non-art backlog (validated 2026-07-25, neither urgent)

Investigated Firebase anonymous auth as a per-device identity for saved games. **Verdict: don't
build it.** Tab-close/refresh/browser-restart persistence already works via the localStorage save
(`saveGame()`/`loadGame()`), covered by the resume test in `tests/ui.spec.js`. An anonymous `uid`
lives in that same browser storage, so it adds a network dependency for zero durability gain, gives
no cross-device resume, and Firebase auto-deletes unlinked anonymous accounts after 30 days. Two
findings from that investigation are worth remembering:

- **The `scores` node is world-writable.** DB rules are `".read": true, ".write": true` and the
  client authenticates with nothing, so anyone reading the live page's source can push junk or wipe
  every score. Blast radius is small (re-finish a couple of games). The real fix if it ever gets
  vandalized: anonymous auth + rules requiring `auth != null`. This is the *one* thing anon auth is
  actually good for — a vandalism fix, not a save fix.
- **iOS Safari evicts all script-writable storage after 7 days *of Safari use* without a first-party
  interaction** (localStorage *and* the IndexedDB Firebase would use). Note "days of Safari use", not
  calendar days — idle phone days don't count — and any tap/click on the page resets the counter to a
  fresh 7, which playing a turn inherently does. **A touch-and-go cadence of every 2–3 days is safe
  with wide margin.** The risk is only real for multi-week abandonment while the phone stays in daily
  use. Firebase cannot help either way. Home-screen PWA install is exempt (it gets its own use
  counter) → see item 5 above.

Cross-device resume ("start on laptop, finish on phone") is out of reach for anon auth entirely —
it would need a shareable sync code or a real Google sign-in. Not requested; don't build on spec.

## Start-of-session checklist

```bash
cd projects/gaming/harmonies && python3 -m http.server 8001   # play at localhost:8001
npm test && npx playwright test                                # baseline: all green before art work
```
1. Read `CLAUDE.md` (design system + gotchas).
2. Pick the next backlog item (art direction is settled — see above).
3. Work one visual element end-to-end (board **and** card), screenshot, eyeball for calm, commit.
   Visual work goes in a `dev-*.html` lab first, then gets copied into `index.html`.
4. Deploy via the rsync in `CLAUDE.md` (excludes `*.md` and `dev-*`); verify live + those files 404.

## Open questions for the owner

- Tune the sound mix by ear (capped for safety, not yet for taste)?
- The 22px card-pattern legibility fix — worth doing before backgrounds?
- Is PWA/installable wanted, or keep it a plain web page?
