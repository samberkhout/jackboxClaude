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
  const numPlayers = playerIds.length;
  const prompts = {};
  const promptPairs = {}; // Track which players get which prompt

  // Select random prompts (need as many prompts as players)
  const shuffledPrompts = [...PROMPTS].sort(() => Math.random() - 0.5).slice(0, numPlayers);

  // Assign prompts to players in pairs
  // Each player gets 2 different prompts, each prompt goes to exactly 2 players
  for (let i = 0; i < numPlayers; i++) {
    const prompt1Index = i;
    const prompt2Index = (i + 1) % numPlayers;

    prompts[playerIds[i]] = [
      shuffledPrompts[prompt1Index],
      shuffledPrompts[prompt2Index]
    ];

    // Track prompt pairs
    if (!promptPairs[shuffledPrompts[prompt1Index]]) {
      promptPairs[shuffledPrompts[prompt1Index]] = [];
    }
    promptPairs[shuffledPrompts[prompt1Index]].push(playerIds[i]);

    if (!promptPairs[shuffledPrompts[prompt2Index]]) {
      promptPairs[shuffledPrompts[prompt2Index]] = [];
    }
    promptPairs[shuffledPrompts[prompt2Index]].push(playerIds[i]);
  }

  return {
    prompts,
    promptPairs,
    matchups: [],
    votes: [],
    currentMatchupIndex: 0,
    matchupVotes: {}, // Track votes per matchup
    results: null
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
      // Calculate results from matchup votes
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
