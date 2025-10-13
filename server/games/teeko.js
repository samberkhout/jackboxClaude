// Tee K.O. Game Logic (Drawing + Slogan combos)

export function initRound(room) {
  return {
    drawings: {},
    slogans: {},
    combinations: {},
    duels: [],
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      // Collect drawings and slogans
      const drawings = [];
      const slogans = [];

      players.forEach((player, id) => {
        const input = player.submissions.INPUT;
        if (input) {
          if (input.drawing) {
            drawings.push({ playerId: id, data: input.drawing });
          }
          if (input.slogan) {
            slogans.push({ playerId: id, text: input.slogan });
          }
        }
      });

      return {
        nextPhase: 'MATCHUP',
        roundData: { ...roundData, drawings, slogans, votes: [] }
      };
    }

    case 'MATCHUP': {
      // Players should have created combinations in MATCHUP phase
      const combinations = [];
      players.forEach((player, id) => {
        const combo = player.submissions.MATCHUP;
        if (combo) {
          combinations.push({
            playerId: id,
            drawingIdx: combo.drawingIdx,
            sloganIdx: combo.sloganIdx,
            drawing: roundData.drawings[combo.drawingIdx],
            slogan: roundData.slogans[combo.sloganIdx]
          });
        }
      });

      // Create duels (pairs)
      const duels = [];
      for (let i = 0; i < combinations.length - 1; i += 2) {
        duels.push({
          id: duels.length,
          comboA: combinations[i],
          comboB: combinations[i + 1],
          votes: { A: 0, B: 0 }
        });
      }

      return {
        nextPhase: 'VOTE',
        roundData: { ...roundData, combinations, duels, votes: [] }
      };
    }

    case 'VOTE': {
      // Calculate results
      const { duels, votes } = roundData;

      votes.forEach(vote => {
        const duel = duels.find(d => d.id === vote.targetId);
        if (duel) {
          duel.votes[vote.choice]++;
        }
      });

      const scores = {};
      duels.forEach(duel => {
        const winnerA = duel.votes.A > duel.votes.B;
        const winnerB = duel.votes.B > duel.votes.A;

        if (winnerA && duel.comboA) {
          scores[duel.comboA.playerId] = (scores[duel.comboA.playerId] || 0) + 600;
        }
        if (winnerB && duel.comboB) {
          scores[duel.comboB.playerId] = (scores[duel.comboB.playerId] || 0) + 600;
        }
        // Runner-up
        if (!winnerA && duel.comboA) {
          scores[duel.comboA.playerId] = (scores[duel.comboA.playerId] || 0) + 300;
        }
        if (!winnerB && duel.comboB) {
          scores[duel.comboB.playerId] = (scores[duel.comboB.playerId] || 0) + 300;
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
