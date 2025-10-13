// Job Job Game Logic (Word bank building)

export function initRound(room) {
  return {
    question: "What's the best advice you can give someone?",
    initialAnswers: {},
    wordBank: [],
    finalAnswers: {},
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      // Collect initial text submissions
      const answers = [];
      players.forEach((player, id) => {
        const input = player.submissions.INPUT;
        if (input && input.text) {
          answers.push(...input.text.split(' '));
        }
      });

      // Build word bank
      const wordBank = [...new Set(answers)].filter(w => w.length > 0);

      return {
        nextPhase: 'MATCHUP',
        roundData: { ...roundData, wordBank, votes: [] }
      };
    }

    case 'MATCHUP': {
      // Collect final answers built from word bank
      const finalAnswers = [];
      players.forEach((player, id) => {
        const answer = player.submissions.MATCHUP;
        if (answer && answer.text) {
          finalAnswers.push({ playerId: id, text: answer.text });
        }
      });

      return {
        nextPhase: 'VOTE',
        roundData: { ...roundData, finalAnswers, votes: [] }
      };
    }

    case 'VOTE': {
      const { finalAnswers, votes } = roundData;
      const scores = {};

      votes.forEach(vote => {
        if (!scores[vote.targetId]) scores[vote.targetId] = 0;
        scores[vote.targetId] += 300;
      });

      return {
        nextPhase: 'REVEAL',
        roundData: { ...roundData, results: finalAnswers },
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
