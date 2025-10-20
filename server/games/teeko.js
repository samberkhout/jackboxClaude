// Tee K.O. Game Logic (Drawing + Slogan combos)
// Phase flow: DRAWING -> SLOGAN -> MATCHUP -> VOTE -> GAUNTLET -> REVEAL -> LEADERBOARD

export function initRound(room) {
  return {
    drawings: [],
    slogans: [],
    combinations: [],
    duels: [],
    currentDuelIndex: 0,
    duelVotes: {},
    gauntletDuels: [],
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'DRAWING': {
      // Fase 1: Collect all drawings (3 per player)
      const drawings = [];

      players.forEach((player, id) => {
        const input = player.submissions.DRAWING;
        if (input && input.drawings) {
          // Each player submits 3 drawings
          input.drawings.forEach(drawing => {
            drawings.push({ playerId: id, data: drawing });
          });
        }
      });

      return {
        nextPhase: 'SLOGAN',
        roundData: { ...roundData, drawings, votes: [] }
      };
    }

    case 'SLOGAN': {
      // Fase 2: Collect all slogans (multiple per player)
      const slogans = [];

      players.forEach((player, id) => {
        const input = player.submissions.SLOGAN;
        if (input && input.slogans) {
          // Each player submits multiple slogans
          input.slogans.forEach(slogan => {
            slogans.push({ playerId: id, text: slogan });
          });
        }
      });

      return {
        nextPhase: 'MATCHUP',
        roundData: { ...roundData, slogans, votes: [] }
      };
    }

    case 'MATCHUP': {
      // Fase 3: Players combine drawings and slogans (not their own)
      const combinations = [];

      players.forEach((player, id) => {
        const combo = player.submissions.MATCHUP;
        if (combo) {
          const drawing = roundData.drawings[combo.drawingIdx];
          const slogan = roundData.slogans[combo.sloganIdx];

          combinations.push({
            playerId: id,
            drawingIdx: combo.drawingIdx,
            sloganIdx: combo.sloganIdx,
            drawing: drawing,
            slogan: slogan
          });
        }
      });

      // Create tournament bracket (duels)
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
        roundData: {
          ...roundData,
          combinations,
          duels,
          currentDuelIndex: 0,
          duelVotes: {},
          votes: []
        }
      };
    }

    case 'VOTE': {
      // Fase 4: Tournament bracket voting - head to head battles
      const { duels, duelVotes } = roundData;

      // Aggregate votes for each duel
      Object.entries(duelVotes).forEach(([duelId, votes]) => {
        const duel = duels[parseInt(duelId)];
        if (duel) {
          votes.forEach(vote => {
            duel.votes[vote.choice]++;
          });
        }
      });

      // Calculate scores - points for votes received
      const scores = {};
      const losers = [];
      const winners = [];

      duels.forEach(duel => {
        const totalVotes = duel.votes.A + duel.votes.B;
        const winnerA = duel.votes.A > duel.votes.B;
        const winnerB = duel.votes.B > duel.votes.A;

        // Winner gets more points
        if (winnerA && duel.comboA) {
          scores[duel.comboA.playerId] = (scores[duel.comboA.playerId] || 0) + 600;
          winners.push(duel.comboA);
        } else if (duel.comboA) {
          losers.push(duel.comboA);
        }

        if (winnerB && duel.comboB) {
          scores[duel.comboB.playerId] = (scores[duel.comboB.playerId] || 0) + 600;
          winners.push(duel.comboB);
        } else if (duel.comboB) {
          losers.push(duel.comboB);
        }

        // Points for each vote received (even if you lose)
        if (duel.comboA) {
          scores[duel.comboA.playerId] = (scores[duel.comboA.playerId] || 0) + (duel.votes.A * 50);
        }
        if (duel.comboB) {
          scores[duel.comboB.playerId] = (scores[duel.comboB.playerId] || 0) + (duel.votes.B * 50);
        }
      });

      // Create gauntlet round from losers
      const gauntletDuels = [];
      for (let i = 0; i < losers.length - 1; i += 2) {
        gauntletDuels.push({
          id: gauntletDuels.length,
          comboA: losers[i],
          comboB: losers[i + 1],
          votes: { A: 0, B: 0 }
        });
      }

      return {
        nextPhase: 'GAUNTLET',
        roundData: { ...roundData, gauntletDuels, duelVotes: {}, results: duels, winners },
        scores
      };
    }

    case 'GAUNTLET': {
      // Fase 5: Second chance round for losers
      const { gauntletDuels, duelVotes } = roundData;

      // Aggregate votes for gauntlet duels
      Object.entries(duelVotes || {}).forEach(([duelId, votes]) => {
        const duel = gauntletDuels[parseInt(duelId)];
        if (duel) {
          votes.forEach(vote => {
            duel.votes[vote.choice]++;
          });
        }
      });

      // Calculate bonus scores for gauntlet
      const scores = {};
      gauntletDuels.forEach(duel => {
        const winnerA = duel.votes.A > duel.votes.B;
        const winnerB = duel.votes.B > duel.votes.A;

        if (winnerA && duel.comboA) {
          scores[duel.comboA.playerId] = (scores[duel.comboA.playerId] || 0) + 300;
        }
        if (winnerB && duel.comboB) {
          scores[duel.comboB.playerId] = (scores[duel.comboB.playerId] || 0) + 300;
        }

        // Smaller points for votes in gauntlet
        if (duel.comboA) {
          scores[duel.comboA.playerId] = (scores[duel.comboA.playerId] || 0) + (duel.votes.A * 25);
        }
        if (duel.comboB) {
          scores[duel.comboB.playerId] = (scores[duel.comboB.playerId] || 0) + (duel.votes.B * 25);
        }
      });

      return {
        nextPhase: 'REVEAL',
        roundData: { ...roundData, gauntletResults: gauntletDuels },
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
