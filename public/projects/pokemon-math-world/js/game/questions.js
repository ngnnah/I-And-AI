// Question generation utilities

export function generateChoices(answer, count) {
  const choices = new Set([answer]);
  while (choices.size < count) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const wrong = answer + (Math.random() > 0.5 ? offset : -offset);
    if (wrong > 0 && wrong !== answer) choices.add(wrong);
  }
  return [...choices].sort(() => Math.random() - 0.5);
}

export function generateWordProblem() {
  const problems = [
    { text: "Ash has 12 Pokeballs. He catches 5 Pokemon. How many Pokeballs are left?", answer: 7 },
    { text: "Misty has 3 teams of 4 Pokemon each. How many Pokemon does she have?", answer: 12 },
    { text: "Brock baked 20 cookies. He gave away 8. How many does he have now?", answer: 12 },
    { text: "There are 5 Pikachu. Each knows 2 moves. How many moves in total?", answer: 10 },
    { text: "15 Pokemon are playing. 6 go home. How many are still playing?", answer: 9 },
    { text: "You have 18 berries. You split them equally among 2 Pokemon. How many does each get?", answer: 9 },
    { text: "A trainer walks 25 steps, then 15 more. How many steps total?", answer: 40 },
    { text: "There are 10 Rattata in 2 equal groups. How many in each group?", answer: 5 },
    { text: "Pikachu used Thunderbolt 8 times. Raichu used it 7 times. How many times total?", answer: 15 },
    { text: "You caught 5 Pokemon on Monday and 5 on Tuesday. How many in 2 days?", answer: 10 },
    { text: "Gary has 24 Pokemon cards. He gives 6 to a friend. How many does he have left?", answer: 18 },
    { text: "There are 4 nests. Each nest has 3 Pidgey eggs. How many eggs total?", answer: 12 },
    { text: "You need 50 coins for a Pokeball. You have 35 coins. How many more do you need?", answer: 15 },
    { text: "A gym has 30 trainers. 12 are battling. How many are waiting?", answer: 18 },
    { text: "Professor Oak has 6 boxes. Each box holds 5 Pokeballs. How many Pokeballs total?", answer: 30 }
  ];
  const p = problems[Math.floor(Math.random() * problems.length)];
  return {
    question: p.text,
    answer: p.answer,
    choices: generateChoices(p.answer, 4),
    isWordProblem: true
  };
}

export const CORRECT_MESSAGES = [
  "Super effective! 💥",
  "Critical hit! ⚡",
  "Amazing! 🌟",
  "Math master! 🎓",
  "Fantastic! ✨",
  "Brilliant! 🧠",
  "Perfect! 🎯"
];

export const ENCOURAGE_MESSAGES = [
  "Try again! 💪",
  "You can do it! 🌟",
  "Keep going! 🎯",
  "Almost there! ✨"
];
