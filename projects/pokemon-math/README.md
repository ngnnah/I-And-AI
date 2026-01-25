# Pokemon Math

A simple math game for 1st graders who love Pokemon. Designed to make addition fun and accessible for young learners just starting their math journey.

**Live Demo**: https://ngnnah.github.io/I-And-AI/projects/pokemon-math/

## Features

- **Simple Addition** (0-10) - perfect for beginners
- **2 Answer Choices** - higher success rate, less frustration
- **15 Pokemon** to catch and collect
- **Big Buttons** - easy to tap on mobile/tablet
- **Encouraging Messages** - positive reinforcement on every answer
- **Sound Effects** - optional audio feedback
- **Progress Tracking** - see your collection grow

## How Progress is Saved

All game progress is saved to **browser localStorage** automatically. No account or server needed.

**What's saved:**

| Data         | Description                   |
| ------------ | ----------------------------- |
| `score`      | Total correct answers         |
| `bestStreak` | Longest correct answer streak |
| `collection` | All Pokemon you've caught     |

**Storage keys:**

- `pokemon-math-save` - Main game state (JSON)
- `pokemon-math-sound` - Sound preference (boolean)

**Note**: Progress is per-browser and per-device. Clearing browser data will reset the game.

## Tech Stack

- **Single HTML file** (~1000 lines) - no build process, just open and play
- **Vanilla JavaScript** - no frameworks
- **CSS3** - animations, gradients, responsive design
- **localStorage API** - persistent game state
- **Web Audio API** - sound effects
- **PokeAPI sprites** - Pokemon images

## Tools Used

- **Claude Code** - AI pair programming for rapid development
- **GitHub Pages** - Free hosting with CI/CD
- **PokeAPI** - Pokemon sprite CDN

## Screenshots

![Start Screen](../../resources/screenshots/20260125-234432_pokemon-math_start-screen.png)

_Start screen with Charmander and collection progress_

## Related

- [Pokemon Math World](../pokemon-math-world/) - **NEW!** Combined version with 3 difficulty levels including Champion's Road
- [Pokemon Math Adventure](../pokemon-math-advanced/) - Advanced version with 9 chapters, gym battles, and 25+ Pokemon

## Credits

- Pokemon is a trademark of Nintendo/Game Freak
- Sprites from PokeAPI (fan resource)
- Built for educational purposes only
