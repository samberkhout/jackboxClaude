// Fibbage Game Logic (Bluff + Truth)

const QUESTIONS = [
  { question: "The world's oldest piece of chewing gum is over _____ years old.", truth: "9,000" },
  { question: "A group of flamingos is called a _____.", truth: "flamboyance" },
  { question: "The shortest war in history lasted _____ minutes.", truth: "38" },
  { question: "A jiffy is an actual unit of time equal to _____ of a second.", truth: "1/100" },
  { question: "The unicorn is the national animal of _____.", truth: "Scotland" }
];

export function initRound(room) {
  const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  return {
    question: question.question,
    truth: question.truth,
    lies: {},
    allOptions: [],
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      // Collect lies
      const lies = [];
      players.forEach((player, id) => {
        const input = player.submissions.INPUT;
        if (input && input.lie) {
          lies.push({ playerId: id, text: input.lie });
        }
      });

      // Mix with truth
      const allOptions = [
        { type: 'truth', text: roundData.truth },
        ...lies.map(l => ({ type: 'lie', playerId: l.playerId, text: l.text }))
      ];

      // Shuffle
      allOptions.sort(() => Math.random() - 0.5);

      return {
        nextPhase: 'VOTE',
        roundData: { ...roundData, lies, allOptions, votes: [] }
      };
    }

    case 'VOTE': {
      const { allOptions, votes, truth } = roundData;
      const scores = {};

      votes.forEach(vote => {
        const option = allOptions[vote.choice];
        if (option.type === 'truth') {
          // Correct answer
          scores[vote.voterId] = (scores[vote.voterId] || 0) + 500;
        } else if (option.type === 'lie') {
          // Fooled by a lie - liar gets points
          scores[option.playerId] = (scores[option.playerId] || 0) + 300;
        }
      });

      return {
        nextPhase: 'REVEAL',
        roundData: { ...roundData, results: allOptions },
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
