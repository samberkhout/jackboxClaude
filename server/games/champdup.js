// Champ'd Up Game Logic (Champion vs Challenger)

export function initRound(room) {
  return {
    champions: {},
    challengers: {},
    duels: [],
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      // Collect champion drawings
      const champions = [];
      players.forEach((player, id) => {
        const input = player.submissions.INPUT;
        if (input && input.drawing && input.name) {
          champions.push({
            playerId: id,
            drawing: input.drawing,
            name: input.name
          });
        }
      });

      return {
        nextPhase: 'MATCHUP',
        roundData: { ...roundData, champions, votes: [] }
      };
    }

    case 'MATCHUP': {
      // Each player draws a challenger for a random champion (not their own)
      const challengers = [];
      players.forEach((player, id) => {
        const challenge = player.submissions.MATCHUP;
        if (challenge) {
          challengers.push({
            playerId: id,
            championIdx: challenge.championIdx,
            drawing: challenge.drawing
          });
        }
      });

      // Create duels
      const duels = [];
      roundData.champions.forEach((champion, idx) => {
        const challenger = challengers.find(c => c.championIdx === idx);
        if (challenger) {
          duels.push({
            id: duels.length,
            champion,
            challenger,
            votes: { champion: 0, challenger: 0 }
          });
        }
      });

      return {
        nextPhase: 'VOTE',
        roundData: { ...roundData, challengers, duels, votes: [] }
      };
    }

    case 'VOTE': {
      const { duels, votes } = roundData;

      votes.forEach(vote => {
        const duel = duels.find(d => d.id === vote.targetId);
        if (duel) {
          duel.votes[vote.choice]++;
        }
      });

      const scores = {};
      duels.forEach(duel => {
        const championWins = duel.votes.champion > duel.votes.challenger;
        if (championWins) {
          scores[duel.champion.playerId] = (scores[duel.champion.playerId] || 0) + 400;
        } else {
          scores[duel.challenger.playerId] = (scores[duel.challenger.playerId] || 0) + 400;
        }
      });

      return {
        nextPhase: 'REVEAL',
        roundData: { ...roundData, results: duels },
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
