# Pokemon Math Adventure

A math learning game for 1st-2nd graders who love Pokemon. Built for my 6-7 year old nephew who needed more challenge than basic addition.

**Live Demo**: https://ngnnah.github.io/I-And-AI/projects/pokemon-math-advanced/

## Features

- **9 Chapters** with progressive difficulty and storyline
- **3 Gym Battles** against Brock, Misty, and Lt. Surge
- **25+ Pokemon** to catch and collect
- **Math Operations**: Addition, subtraction, missing number problems (0-25)
- **Team Building**: Choose 3 Pokemon for battle from your collection
- **8 Trainer Characters**: Ash, Red, Blue, Green, Ethan, Lyra, Brendan, May
- **Personalization**: Enter your name, shown throughout the game
- **HP/Damage System**: Answer correctly to deal damage, wrong answers hurt your Pokemon
- **Badges & Stars**: Earn rewards for progress
- **Sound Effects**: Optional audio feedback

## How Progress is Saved

All game progress is saved to **browser localStorage** automatically. No account or server needed.

**What's saved:**
| Data | Description |
| ---------------- | ----------------------------- |
| `playerName` | Your custom name |
| `trainer` | Selected trainer character |
| `starter` | Your first Pokemon choice |
| `team` | Current 3-Pokemon battle team |
| `collection` | All Pokemon you've caught |
| `badges` | Gym badges earned |
| `stars` | Progress currency |
| `currentChapter` | Story progress |
| `bestStreak` | Longest correct answer streak |

**Storage keys:**

- `pokemon-adv-save` - Main game state (JSON)
- `pokemon-adv-sound` - Sound preference (boolean)

**Note**: Progress is per-browser and per-device. Clearing browser data will reset the game.

## Tech Stack

- **Single HTML file** (~1500 lines) - no build process, just open and play
- **Vanilla JavaScript** - no frameworks
- **CSS3** - animations, gradients, responsive design
- **localStorage API** - persistent game state
- **Web Audio API** - sound effects
- **PokeAPI sprites** - Pokemon images
- **Pokemon Showdown sprites** - Trainer avatars

## Tools Used

- **Claude Code** - AI pair programming for rapid development
- **GitHub Pages** - Free hosting with CI/CD
- **Pokemon Showdown** - Trainer sprite CDN
- **PokeAPI** - Pokemon sprite CDN

## Screenshots

![Start Screen](../../resources/screenshots/20260125-234411_pokemon-math-advanced_start-screen.png)

_Start screen with trainer selection, name input, and starter Pokemon choice_

## Related

- [Pokemon Math World](../pokemon-math-world/) - **NEW!** Combined version with 3 difficulty levels including Champion's Road
- [Pokemon Math (Beginner)](../pokemon-math/) - Simpler version for 1st graders (addition 0-10, 2 choices)

## Credits

- Pokemon is a trademark of Nintendo/Game Freak
- Sprites from PokeAPI and Pokemon Showdown (fan resources)
- Built for educational purposes only
