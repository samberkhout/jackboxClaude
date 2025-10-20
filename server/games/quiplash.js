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

const FINALE_PROMPTS = [
  "The most awkward thing to happen during a job interview",
  "A product that should never be advertised on TV",
  "The worst possible last words",
  "Something you should never Google at work",
  "A terrible idea for a theme park",
  "The worst possible wedding gift",
  "Something aliens would be confused about if they visited Earth",
  "A bad slogan for a political campaign"
];

export function initRound(room, isFinale = false) {
  const playerIds = Array.from(room.players.keys());
  const numPlayers = playerIds.length;
  const prompts = {};
  const promptPairs = {}; // Track which players get which prompt

  // Initialize empty arrays for each player
  playerIds.forEach(id => {
    prompts[id] = [];
  });

  if (isFinale) {
    // FINALE MODE: All players get the same single prompt
    const finalePrompt = FINALE_PROMPTS[Math.floor(Math.random() * FINALE_PROMPTS.length)];

    playerIds.forEach(playerId => {
      prompts[playerId] = [finalePrompt]; // Single prompt for finale
    });

    promptPairs[finalePrompt] = playerIds; // All players answer this prompt

    return {
      prompts,
      promptPairs,
      matchups: [],
      votes: [],
      currentMatchupIndex: 0,
      matchupVotes: {},
      finaleVotes: {}, // Track finale votes: { voterId: [playerId1, playerId2, playerId3] }
      results: null,
      isFinale: true
    };
  }

  // NORMAL MODE: Paired prompts
  // Create slots: each player needs 2 prompts
  const slots = [];
  playerIds.forEach(playerId => {
    slots.push({ playerId, slotIndex: 0 });
    slots.push({ playerId, slotIndex: 1 });
  });

  // Shuffle slots randomly
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  // Select random prompts (need as many prompts as players, since each prompt goes to 2 players)
  const shuffledPrompts = [...PROMPTS].sort(() => Math.random() - 0.5).slice(0, numPlayers);

  // Assign prompts to pairs of slots
  for (let i = 0; i < numPlayers; i++) {
    const prompt = shuffledPrompts[i];
    const slot1 = slots[i * 2];
    const slot2 = slots[i * 2 + 1];

    // Assign prompt to both players
    prompts[slot1.playerId].push(prompt);
    prompts[slot2.playerId].push(prompt);

    // Track prompt pairs
    if (!promptPairs[prompt]) {
      promptPairs[prompt] = [];
    }
    promptPairs[prompt].push(slot1.playerId, slot2.playerId);
  }

  return {
    prompts,
    promptPairs,
    matchups: [],
    votes: [],
    currentMatchupIndex: 0,
    matchupVotes: {}, // Track votes per matchup
    results: null,
    isFinale: false
  };
}

// Check if current matchup voting is complete
export function isMatchupVotingComplete(room) {
  const { roundData, players } = room;
  const { matchups, currentMatchupIndex, matchupVotes } = roundData;

  if (!matchups || matchups.length === 0 || currentMatchupIndex >= matchups.length) {
    return false;
  }

  const currentMatchup = matchups[currentMatchupIndex];
  const votesForCurrentMatchup = matchupVotes[currentMatchupIndex] || [];

  // Count eligible voters (all players except the two who answered this prompt)
  const eligibleVoters = Array.from(players.keys()).filter(
    id => id !== currentMatchup.optionA.playerId && id !== currentMatchup.optionB.playerId
  );

  // Check if all eligible voters have voted
  return eligibleVoters.every(voterId =>
    votesForCurrentMatchup.some(vote => vote.voterId === voterId)
  );
}

// Move to next matchup or complete voting phase
export function advanceMatchup(room) {
  const { roundData } = room;
  const { matchups, currentMatchupIndex } = roundData;

  if (currentMatchupIndex < matchups.length - 1) {
    // Move to next matchup
    roundData.currentMatchupIndex++;
    return { matchupAdvanced: true, votingComplete: false };
  } else {
    // All matchups done
    return { matchupAdvanced: false, votingComplete: true };
  }
}

// Check if finale voting is complete
export function isFinaleVotingComplete(room) {
  const { roundData, players } = room;
  const { finaleVotes } = roundData;

  if (!finaleVotes) return false;

  // All players should have voted (voted means they submitted their top 3)
  const allVoted = Array.from(players.keys()).every(playerId => {
    return finaleVotes[playerId] && finaleVotes[playerId].length > 0;
  });

  return allVoted;
}

// Calculate finale scores
export function calculateFinaleScores(room) {
  const { roundData, players } = room;
  const { finaleVotes } = roundData;
  const scores = {};

  // Initialize scores for all players
  Array.from(players.keys()).forEach(playerId => {
    scores[playerId] = 0;
  });

  // Count votes for each player
  const voteCounts = {};
  Object.values(finaleVotes).forEach(votes => {
    votes.forEach(votedPlayerId => {
      voteCounts[votedPlayerId] = (voteCounts[votedPlayerId] || 0) + 1;
    });
  });

  // Calculate total votes
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  // Award points based on percentage of votes (triple points)
  Object.entries(voteCounts).forEach(([playerId, voteCount]) => {
    const percentage = totalVotes > 0 ? voteCount / totalVotes : 0;
    scores[playerId] = Math.round(percentage * 1000 * 3); // Triple points for finale
  });

  return scores;
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      if (roundData.isFinale) {
        // FINALE MODE: Collect all answers for finale voting
        const finaleAnswers = [];
        players.forEach((player, id) => {
          const input = player.submissions.INPUT;
          if (input && input.answers && input.answers[0]) {
            finaleAnswers.push({
              playerId: id,
              playerName: player.name,
              answer: input.answers[0],
              votes: 0
            });
          }
        });

        return {
          nextPhase: 'VOTE',
          roundData: { ...roundData, finaleAnswers }
        };
      }

      // NORMAL MODE: Collect all submissions and create matchups
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
      if (roundData.isFinale) {
        // FINALE MODE: Calculate scores from finale votes
        const scores = calculateFinaleScores(room);

        return {
          nextPhase: 'REVEAL',
          roundData: { ...roundData, results: roundData.finaleAnswers },
          scores
        };
      }

      // NORMAL MODE: Calculate results from matchup votes
      const { matchups, matchupVotes } = roundData;

      // Aggregate votes into matchup.votes
      matchups.forEach((matchup, idx) => {
        const votesForThisMatchup = matchupVotes[idx] || [];
        matchup.votes = { A: 0, B: 0 };

        votesForThisMatchup.forEach(vote => {
          if (vote.choice === 'A') {
            matchup.votes.A++;
          } else if (vote.choice === 'B') {
            matchup.votes.B++;
          }
        });
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
