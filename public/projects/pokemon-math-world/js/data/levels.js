// Level configurations with chapters
import { generateChoices, generateWordProblem } from '../game/questions.js';

export const LEVELS = {
  'trainer-school': {
    name: 'Trainer School',
    storageKey: 'pokemon-trainer-school',
    icon: '🎒',
    chapters: [
      {
        id: 1, name: 'Lesson 1', title: 'First Steps',
        desc: 'Learn to add small numbers!',
        env: 'env-route', icon: '📚', pokemon: 10, // Caterpie as chapter icon
        enemies: ['caterpie', 'rattata', 'pidgey'],
        difficulty: 1, questionsToWin: 3
      },
      {
        id: 2, name: 'Lesson 2', title: 'Practice Time',
        desc: 'More addition practice!',
        env: 'env-route', icon: '🌳', pokemon: 13, // Weedle
        enemies: ['weedle', 'oddish', 'pikachu'],
        difficulty: 1, questionsToWin: 4
      },
      {
        id: 3, name: 'Graduation', title: 'Graduation Day',
        desc: 'Show what you learned!',
        env: 'env-gym', icon: '🎓', pokemon: 133, // Eevee
        enemies: ['eevee', 'jigglypuff', 'clefairy'],
        difficulty: 1, questionsToWin: 5,
        isGym: true, badge: '📜'
      }
    ],
    generateQuestion: (difficulty) => {
      const a = Math.floor(Math.random() * 6) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const answer = a + b;
      const wrong = answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
      return {
        question: `${a} + ${b} = ?`,
        answer,
        choices: Math.random() > 0.5 ? [answer, wrong] : [wrong, answer]
      };
    }
  },

  'pokemon-league': {
    name: 'Pokemon League',
    storageKey: 'pokemon-league-save',
    icon: '🏆',
    chapters: [
      {
        id: 1, name: 'Route 1', title: 'First Steps',
        desc: 'Your Pokemon journey begins!',
        env: 'env-route', icon: '🌿', pokemon: 19, // Rattata
        enemies: ['rattata', 'pidgey', 'caterpie'],
        difficulty: 1, questionsToWin: 4
      },
      {
        id: 2, name: 'Route 1 Deep', title: 'Deeper Path',
        desc: 'More Pokemon! Bigger numbers.',
        env: 'env-route', icon: '🌲', pokemon: 16, // Pidgey
        enemies: ['pidgey', 'weedle', 'rattata'],
        difficulty: 1, questionsToWin: 4
      },
      {
        id: 3, name: 'Pewter Gym', title: 'Brock',
        desc: 'Your first gym battle!',
        env: 'env-gym', icon: '🪨', pokemon: 95, // Onix
        enemies: ['onix'],
        difficulty: 2, questionsToWin: 5,
        isGym: true, gymLeader: 'brock', badge: '🪨'
      },
      {
        id: 4, name: 'Route 2', title: 'Waterside',
        desc: 'Addition and subtraction!',
        env: 'env-water', icon: '🌊', pokemon: 54, // Psyduck
        enemies: ['psyduck', 'oddish', 'pikachu'],
        difficulty: 2, questionsToWin: 4
      },
      {
        id: 5, name: 'Mt. Moon', title: 'Dark Cave',
        desc: 'Rare Pokemon in the dark!',
        env: 'env-cave', icon: '🦇', pokemon: 41, // Zubat
        enemies: ['zubat', 'geodude', 'machop'],
        difficulty: 2, questionsToWin: 5
      },
      {
        id: 6, name: 'Cerulean Gym', title: 'Misty',
        desc: 'Water gym! Subtraction!',
        env: 'env-gym', icon: '💧', pokemon: 120, // Staryu
        enemies: ['staryu'],
        difficulty: 2, questionsToWin: 5,
        isGym: true, gymLeader: 'misty', badge: '💧'
      },
      {
        id: 7, name: 'Route 3', title: 'Rare Pokemon',
        desc: 'Find missing numbers!',
        env: 'env-route', icon: '✨', pokemon: 133, // Eevee
        enemies: ['eevee', 'jigglypuff', 'clefairy', 'abra'],
        difficulty: 3, questionsToWin: 5
      },
      {
        id: 8, name: 'Pokemon Tower', title: 'Spooky Tower',
        desc: 'Ghost Pokemon! All math types!',
        env: 'env-cave', icon: '👻', pokemon: 92, // Gastly
        enemies: ['gastly', 'dratini', 'magikarp'],
        difficulty: 3, questionsToWin: 5
      },
      {
        id: 9, name: 'Vermilion Gym', title: 'Lt. Surge',
        desc: 'The final gym!',
        env: 'env-electric', icon: '⚡', pokemon: 26, // Raichu
        enemies: ['raichu'],
        difficulty: 3, questionsToWin: 6,
        isGym: true, gymLeader: 'surge', badge: '⚡'
      }
    ],
    generateQuestion: (difficulty) => {
      const types = difficulty === 1 ? ['add'] : difficulty === 2 ? ['add', 'sub'] : ['add', 'sub', 'missing'];
      const type = types[Math.floor(Math.random() * types.length)];
      const max = difficulty === 1 ? 10 : difficulty === 2 ? 15 : 25;

      if (type === 'add') {
        const a = Math.floor(Math.random() * max) + 1;
        const b = Math.floor(Math.random() * (max - a)) + 1;
        const answer = a + b;
        return { question: `${a} + ${b} = ?`, answer, choices: generateChoices(answer, 4) };
      } else if (type === 'sub') {
        const answer = Math.floor(Math.random() * max) + 1;
        const b = Math.floor(Math.random() * answer) + 1;
        const a = answer + b;
        return { question: `${a} - ${b} = ?`, answer, choices: generateChoices(answer, 4) };
      } else {
        const a = Math.floor(Math.random() * max) + 1;
        const b = Math.floor(Math.random() * max) + 1;
        const sum = a + b;
        if (Math.random() > 0.5) {
          return { question: `${a} + ? = ${sum}`, answer: b, choices: generateChoices(b, 4) };
        } else {
          return { question: `? + ${b} = ${sum}`, answer: a, choices: generateChoices(a, 4) };
        }
      }
    }
  },

  'champions-road': {
    name: "Champion's Road",
    storageKey: 'pokemon-champions-road',
    icon: '👑',
    chapters: [
      {
        id: 1, name: 'Training', title: 'Training Grounds',
        desc: 'Warm up with larger numbers!',
        env: 'env-route', icon: '🏋️', pokemon: 66, // Machop
        enemies: ['machop', 'geodude', 'pikachu'],
        difficulty: 1, questionsToWin: 4
      },
      {
        id: 2, name: 'Math Dojo', title: 'Times Tables',
        desc: 'Learn 2s and 5s times tables!',
        env: 'env-gym', icon: '🥋', pokemon: 52, // Meowth
        enemies: ['machop', 'meowth', 'psyduck'],
        difficulty: 2, questionsToWin: 5
      },
      {
        id: 3, name: 'Victory Road', title: 'Mixed Math',
        desc: 'Mixed operations ahead!',
        env: 'env-cave', icon: '🛤️', pokemon: 41, // Zubat
        enemies: ['zubat', 'geodude', 'gastly'],
        difficulty: 2, questionsToWin: 5
      },
      {
        id: 4, name: 'Elite Lorelei', title: 'Lorelei',
        desc: 'Ice-type! Division challenge!',
        env: 'env-elite', icon: '❄️', pokemon: 131, // Lapras
        enemies: ['lapras'],
        difficulty: 3, questionsToWin: 5,
        isGym: true, gymLeader: 'lorelei', badge: '❄️'
      },
      {
        id: 5, name: 'Word Problems', title: 'Story Time',
        desc: 'Solve word problems!',
        env: 'env-route', icon: '📖', pokemon: 65, // Alakazam
        enemies: ['alakazam', 'abra', 'eevee'],
        difficulty: 3, questionsToWin: 5,
        wordProblems: true
      },
      {
        id: 6, name: 'Elite Bruno', title: 'Bruno',
        desc: 'Fighting-type trainer!',
        env: 'env-elite', icon: '💪', pokemon: 68, // Machamp
        enemies: ['machamp'],
        difficulty: 3, questionsToWin: 5,
        isGym: true, gymLeader: 'bruno', badge: '💪'
      },
      {
        id: 7, name: 'Legendary', title: 'Legendary Pokemon',
        desc: 'Catch legendary Pokemon!',
        env: 'env-champion', icon: '🌟', pokemon: 144, // Articuno
        enemies: ['articuno', 'zapdos', 'moltres'],
        difficulty: 4, questionsToWin: 6
      },
      {
        id: 8, name: 'Champion', title: 'Champion Lance',
        desc: 'The final battle!',
        env: 'env-champion', icon: '🐉', pokemon: 149, // Dragonite
        enemies: ['dragonite'],
        difficulty: 4, questionsToWin: 6,
        isGym: true, gymLeader: 'lance', badge: '🏆'
      }
    ],
    generateQuestion: (difficulty, isWordProblem = false) => {
      if (isWordProblem) {
        return generateWordProblem();
      }

      const operations = difficulty <= 2 ? ['add', 'sub', 'mult2', 'mult5', 'missing'] :
                        difficulty === 3 ? ['add', 'sub', 'mult', 'div', 'missing'] :
                        ['add', 'sub', 'mult', 'div', 'mixed', 'missing'];
      const type = operations[Math.floor(Math.random() * operations.length)];

      if (type === 'add') {
        const a = Math.floor(Math.random() * 50) + 10;
        const b = Math.floor(Math.random() * 50) + 10;
        return { question: `${a} + ${b} = ?`, answer: a + b, choices: generateChoices(a + b, 4) };
      } else if (type === 'sub') {
        const answer = Math.floor(Math.random() * 50) + 10;
        const b = Math.floor(Math.random() * 30) + 5;
        const a = answer + b;
        return { question: `${a} - ${b} = ?`, answer, choices: generateChoices(answer, 4) };
      } else if (type === 'missing') {
        const a = Math.floor(Math.random() * 40) + 10;
        const b = Math.floor(Math.random() * 40) + 10;
        const sum = a + b;
        const variant = Math.floor(Math.random() * 4);
        if (variant === 0) {
          return { question: `${a} + ? = ${sum}`, answer: b, choices: generateChoices(b, 4) };
        } else if (variant === 1) {
          return { question: `? + ${b} = ${sum}`, answer: a, choices: generateChoices(a, 4) };
        } else if (variant === 2) {
          return { question: `${sum} - ? = ${a}`, answer: b, choices: generateChoices(b, 4) };
        } else {
          return { question: `${sum} - ${b} = ?`, answer: a, choices: generateChoices(a, 4) };
        }
      } else if (type === 'mult2') {
        const b = Math.floor(Math.random() * 10) + 1;
        return { question: `2 × ${b} = ?`, answer: 2 * b, choices: generateChoices(2 * b, 4) };
      } else if (type === 'mult5') {
        const b = Math.floor(Math.random() * 10) + 1;
        return { question: `5 × ${b} = ?`, answer: 5 * b, choices: generateChoices(5 * b, 4) };
      } else if (type === 'mult') {
        const a = Math.floor(Math.random() * 5) + 2;
        const b = Math.floor(Math.random() * 10) + 1;
        return { question: `${a} × ${b} = ?`, answer: a * b, choices: generateChoices(a * b, 4) };
      } else if (type === 'div') {
        const b = Math.floor(Math.random() * 5) + 2;
        const answer = Math.floor(Math.random() * 10) + 1;
        const a = b * answer;
        return { question: `${a} ÷ ${b} = ?`, answer, choices: generateChoices(answer, 4) };
      } else {
        const a = Math.floor(Math.random() * 20) + 5;
        const b = Math.floor(Math.random() * 5) + 2;
        const c = Math.floor(Math.random() * 5) + 1;
        const answer = a + b * c;
        return { question: `${a} + ${b} × ${c} = ?`, answer, choices: generateChoices(answer, 4), hint: 'Multiply first!' };
      }
    }
  }
};

export const LEVEL_KEYS = Object.keys(LEVELS);
