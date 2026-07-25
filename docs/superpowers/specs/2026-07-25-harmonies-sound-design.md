# Harmonies — Sound & Ambience Design

Date: 2026-07-25
Status: approved, ready to implement
Project: `projects/gaming/harmonies`

## Overview

- **Purpose:** make the game feel calmer and more tactile through sound — informative cues for
  actions/statuses, plus an optional procedural background soundscape.
- **Users:** the owner + wife, casual "touch-and-go" solo play, each on their own device (often
  phone).
- **Guiding constraint:** *calm above all.* Soft, subtle, restrained. If a change makes the game
  louder or busier, it is wrong. Mechanics stay frozen — this is pure feedback/atmosphere work.
- Addresses `PLAN.md` backlog item #4 ("consider a mute toggle + soft ambient cues, but default to
  restraint").

## Decisions (owner-approved)

| Question | Decision |
| --- | --- |
| Audio source | **Procedural WebAudio.** No sample files, no asset bytes. |
| Ambience model | **Pick-a-scene, 3 presets**, one active at a time, crossfaded. |
| Placement SFX | **Per-terrain timbre + pitch rising with stack height**, all in one pentatonic scale. |
| Other cues | Card complete + cube, gentle error, turn boundary + pouch refill, token select / Finish / game over. |
| Controls & default | Header 🔊 button → compact popover. **SFX on, ambience off** on a fresh load. |

### Why procedural, not sample files

- Ships **zero asset bytes** — no repo bloat, no extra GitHub Pages payload, no licensing to track.
- Fits the project's hard "no build step, self-contained" rule exactly.
- Randomly-timed events mean **no loop and no seam**, which a short sample loop can never achieve.
- Trade-off accepted: impressionistic rather than photoreal. Suits the calm aesthetic.

### Why ambience is off by default

Background audio that starts uninvited is jarring, especially on a phone in a quiet room. Browsers
also block audio before a user gesture, so an autostart would be unreliable anyway. Defaulting off
additionally covers reduced-stimulation accessibility without a special case.

Not "white noise": true broadband noise is fatiguing over a 20-minute game. Each scene is a quiet
noise **bed** plus **sparse random events**, which is what makes long listening comfortable.

## Architecture

Static app, no bundler. Audio logic goes in new `js/audio/` modules; only the popover UI lands in
`index.html`. This follows the project rule (logic in `js/`, DOM/rendering in `index.html`) and keeps
the already-large `index.html` from absorbing ~400 lines of synthesis.

```
js/audio/
├── sfx-palette.js       pure data + pure fns — terrain voices, pitches, event cues
├── ambience-scenes.js   pure data — 3 scenes as lists of layer specs
└── sound-engine.js      the ONLY file touching AudioContext; renders specs → sound
```

| Unit | Does | Depends on | Testable |
| --- | --- | --- | --- |
| `sfx-palette.js` | `cueForPlacement(terrain, height)` and `EVENT_CUES` return **spec objects**; makes no sound | nothing | fully, no WebAudio |
| `ambience-scenes.js` | exports `SCENES` — declarative layer specs | nothing | fully, no WebAudio |
| `sound-engine.js` | `createSoundEngine({ contextFactory })` → play specs, manage buses, crossfade, cancel timers | the two above | with a fake AudioContext |
| `index.html` | popover markup/CSS, `localStorage`, `visibilitychange`, call-site wiring | engine | Playwright |

The point of the split: **musical decisions live in testable pure data**, while the untestable
WebAudio plumbing is one dumb renderer that reads those specs.

### Data flow

```
game action (place token)
  → cueForPlacement('water', 2)          [pure]  → { voice:'droplet', freq: 369.99, dur, vol }
  → engine.playCue(spec)                 [side-effecting] → sfxBus → masterGain → destination

user picks scene
  → SCENES['cabin']                      [pure]  → [ {type:'noiseBed',…}, {type:'randomEvent',…} ]
  → engine.setScene('cabin')             → crossfade out old layers, cancel their timers,
                                           build new layers → ambienceBus → masterGain
```

## Key data models

### Placement instrument — D major pentatonic

All pitches come from **D E F# A B**. A pentatonic scale has no semitone clashes, so no two
placements can ever sound dissonant together — this is what makes a ~90-move game listenable rather
than grating. Existing `sfxPlace` is already 294 Hz (D4), so this continues the current palette.

| Terrain | Timbre | Base | Height 1 → 2 → 3 (+2 scale degrees each) |
| --- | --- | --- | --- |
| ⛰️ mountain | deep sine, slow attack | D3 | D3 → A3 → D4 |
| 🧱 brick | dry muted clack, short decay | F#3 | F#3 → D4 → F#4 |
| 🪵 trunk | hollow wood knock | A3 | A3 → F#4 → A4 |
| 🌼 field | light bell (sine + fifth) | D4 | D4 → A4 → D5 |
| 🌊 water | droplet (fast upward pitch blip) | A4 | A4 → F#5 → A5 |
| 🍃 leaves | airy bandpassed noise burst | D5 | filter centre shifts instead of tone |

Pitches overlap across terrains, but **timbre keeps them distinguishable** — so you hear both *what*
you placed and *how high* it now stands.

### Ambience scenes

Each layer is one of three spec types: `noiseBed` (steady filtered noise), `drone` (oscillator, may
be LFO-modulated), `randomEvent` (a cue fired on Poisson-ish random intervals).

- **🌙 Cabin by the Lake** — fire bed (brown noise → lowpass ~400 Hz) + fire crackle
  (`randomEvent`, 2–8 ms bandpassed noise bursts, 40–200 ms intervals — this is what reads as
  "crackle"); water lapping (pink noise → bandpass swept by 0.1 Hz LFO); wind (lowpassed noise,
  0.05 Hz cutoff LFO); rare loon call (sine glide 700→500 Hz with vibrato, every 30–90 s).
- **🦗 Summer Night** — insect chorus (4 voices, 3.5–4.5 kHz, ~40 Hz amplitude modulation, 60–120 ms
  chirps, staggered random timing, slow global swell); frogs (~200 Hz fast-AM pulse, every 4–12 s);
  breeze bed.
- **🌿 Morning Forest** — birdsong (2–4 note frequency-swept sine phrases, 2–4 kHz, sparse); leaf
  bed; faint stream (highpassed pink noise, static, very low).

### Event cues

| Event | Cue | Currently |
| --- | --- | --- |
| token placed | per-terrain voice (above) | single tone |
| token selected | very faint click | silent |
| cube placed | soft tick | silent |
| animal card completed | warm two-note resolve | `sfxAnimal` |
| invalid move / error | soft low muted thud — **not** a buzzer, quieter than success cues | silent |
| turn ended | soft exhale/breath sweep | silent |
| pouch refilled | faint granular shuffle | silent |
| Finish state entered | low resonant bell | silent |
| game over | gentle ascending flourish | `sfxWin` |

## Calm-preserving constraints

- Ambience sums into a bus **hard-capped at 0.18 gain** — it cannot overpower SFX or itself no
  matter what the layer math does.
- 800 ms crossfade on scene change; 400 ms fade-in on enable; 600 ms fade-out on disable.
- **AudioContext suspends on `visibilitychange`** when the tab hides. Essential for phone play — no
  battery drain, no ghost audio from a backgrounded tab.
- Volume slider is a single master control; SFX and ambience keep a fixed sensible balance beneath
  it, so there is nothing to mis-set.

## Error handling

- Every audio path wrapped in `try/catch`, matching the existing discipline. Audio failure degrades
  to **silence and never blocks a game action.**
- The engine latches an internal `dead` flag on first failure, so a broken context is not retried
  ~90 times per game.
- `localStorage` access wrapped (throws in private mode), falling back to in-memory defaults — same
  pattern as the existing `saveGame()`.
- **Random-event timers are held in a registry and explicitly cancelled** on scene change or
  disable. This is the primary bug risk: leaked timers would silently stack scenes on top of each
  other. It gets a dedicated test.
- Known limitation, not to be chased: iOS Safari honours the hardware mute switch for WebAudio.

## Testing

- `npm test` (`node --test`, no deps) — new `tests/sound.test.js`:
  - pitch rises monotonically with stack height;
  - every emitted pitch is a member of the pentatonic set (guards off-scale regressions);
  - unknown terrain falls back safely instead of throwing;
  - every scene layer has a known type, and layer gains respect the ambience cap.
- `sound-engine` tested against a **fake AudioContext**, asserting that a scene change cancels the
  previous scene's timers and that a context failure latches `dead` without throwing.
- Playwright (`tests/ui.spec.js`) — panel opens; SFX toggle and scene choice survive a reload; no
  uncaught errors. It **cannot** assert audible sound; this limit is stated rather than implied.
- **Manual audition:** a standalone `sound-lab.html` (scratchpad, not shipped) plays every cue and
  scene in isolation with live controls, so the sound can be judged by ear and rejected before it
  touches the game. For audio this is the verification that actually counts.

## Persistence

New key `harmonies_sound_prefs` alongside the existing `harmonies_solo_game` and
`harmonies_player_name`:

```json
{ "sfx": true, "scene": null, "volume": 0.6 }
```

`scene: null` means ambience off. Written on every change; read on load.

## Implementation phases

1. `js/audio/` modules + unit tests (pure data first, engine second).
2. `sound-lab.html` audition, tune by ear.
3. Wire into `index.html`: popover UI, persistence, `visibilitychange`, replace the 8 existing call
   sites, add the newly-sonified ones.
4. Extend Playwright smoke; run `npm test` + `npx playwright test` green.
5. Deploy via the `CLAUDE.md` rsync (excludes `*.md`); `js/audio/` ships automatically. Zero new
   asset bytes.

## Out of scope

- No sample/recording assets, now or as a fallback path.
- No per-layer mixer UI (rejected in favour of pick-a-scene — a fader panel would become the
  busiest thing on screen).
- No change to any game rule, score, or turn structure.
