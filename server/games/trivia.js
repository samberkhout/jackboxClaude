// Trivia Murder Party (Light version)

const QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correct: 2
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3
  },
  {
    question: "In what year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correct: 2
  }
];

export function initRound(room) {
  return {
    questions: QUESTIONS.slice(0, 3),
    currentQuestion: 0,
    answers: {},
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      // Check answers
      const scores = {};
      players.forEach((player, id) => {
        const answer = player.submissions.INPUT;
        if (answer && answer.answers) {
          let correct = 0;
          answer.answers.forEach((ans, idx) => {
            if (ans === roundData.questions[idx].correct) {
              correct++;
            }
          });
          scores[id] = correct * 200;
        }
      });

      return {
        nextPhase: 'REVEAL',
        roundData: { ...roundData, results: scores },
        scores
      };
    }

    case 'REVEAL': {
      return { nextPhase: 'LEADERBOARD' };
    }

    case 'LEADERBOARD': {
      return { nextPhase: 'LOBBY' };
    }

    default:
      return { error: 'Invalid phase' };
  }
}
