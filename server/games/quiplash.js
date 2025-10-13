// Quiplash Game Logic

const PROMPTS = [
  "The worst thing to say at a wedding",
  "A terrible name for a boat",
  "The last thing you want to hear from your dentist",
  "A bad restaurant name",
  "Something you don't want to find in your bed",
  "The worst superpower",
  "A terrible movie sequel",
  "Something you shouldn't say to a police officer",
  "A bad fortune cookie message",
  "The worst pet name"
];

export function initRound(room) {
  const playerIds = Array.from(room.players.keys());
  const prompts = {};

  // Assign 2 prompts per player
  playerIds.forEach(id => {
    prompts[id] = [
      PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
      PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
    ];
  });

  return {
    prompts,
    matchups: [],
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      // Collect all submissions and create matchups
      const submissions = [];
      players.forEach((player, id) => {
        const input = player.submissions.INPUT;
        if (input && input.answers) {
          input.answers.forEach((answer, idx) => {
            submissions.push({
              playerId: id,
              promptIndex: idx,
              prompt: roundData.prompts[id][idx],
              answer
            });
          });
        }
      });

      // Group by prompt and create pairs
      const matchups = [];
      const grouped = {};

      submissions.forEach(sub => {
        const key = sub.prompt;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(sub);
      });

      Object.entries(grouped).forEach(([prompt, subs]) => {
        for (let i = 0; i < subs.length - 1; i += 2) {
          if (subs[i + 1]) {
            matchups.push({
              id: matchups.length,
              prompt,
              optionA: { playerId: subs[i].playerId, answer: subs[i].answer },
              optionB: { playerId: subs[i + 1].playerId, answer: subs[i + 1].answer },
              votes: { A: 0, B: 0 }
            });
          }
        }
      });

      return {
        nextPhase: 'VOTE',
        roundData: { ...roundData, matchups, votes: [] }
      };
    }

    case 'VOTE': {
      // Calculate results
      const { matchups, votes } = roundData;

      votes.forEach(vote => {
        const matchup = matchups.find(m => m.id === vote.targetId);
        if (matchup) {
          matchup.votes[vote.choice]++;
        }
      });

      // Calculate scores
      const scores = {};
      matchups.forEach(matchup => {
        const totalVotes = matchup.votes.A + matchup.votes.B;
        const winnerA = matchup.votes.A > matchup.votes.B;
        const winnerB = matchup.votes.B > matchup.votes.A;
        const unanimous = (matchup.votes.A === totalVotes) || (matchup.votes.B === totalVotes);

        if (winnerA) {
          scores[matchup.optionA.playerId] = (scores[matchup.optionA.playerId] || 0) +
            (unanimous ? 500 : matchup.votes.A * 100);
        }
        if (winnerB) {
          scores[matchup.optionB.playerId] = (scores[matchup.optionB.playerId] || 0) +
            (unanimous ? 500 : matchup.votes.B * 100);
        }
      });

      return {
        nextPhase: 'REVEAL',
        roundData: { ...roundData, results: matchups },
        scores
      };
    }

    case 'REVEAL': {
      return {
        nextPhase: 'LEADERBOARD'
      };
    }

    case 'LEADERBOARD': {
      return {
        nextPhase: 'LOBBY'
      };
    }

    default:
      return { error: 'Invalid phase' };
  }
}
