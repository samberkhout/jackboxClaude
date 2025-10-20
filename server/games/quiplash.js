// Quiplash Game Logic
// Phase flow: INPUT -> VOTE -> LAST_LASH -> REVEAL -> LEADERBOARD

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

const FINAL_PROMPTS = [
  "The most awkward thing to happen during a first date",
  "A terrible last words before a dramatic moment",
  "The worst way to start a speech at the United Nations",
  "Something you definitely shouldn't bring to a job interview",
  "The most embarrassing ringtone to go off during a funeral"
];

export function initRound(room) {
  const playerIds = Array.from(room.players.keys());
  const numPlayers = playerIds.length;
  const prompts = {};
  const promptPairs = {}; // Track which players get which prompt

  // Initialize empty arrays for each player
  playerIds.forEach(id => {
    prompts[id] = [];
  });

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

      // Calculate scores - check for "Quiplash!" (100% unanimous)
      const scores = {};
      matchups.forEach(matchup => {
        const totalVotes = matchup.votes.A + matchup.votes.B;
        const winnerA = matchup.votes.A > matchup.votes.B;
        const winnerB = matchup.votes.B > matchup.votes.A;
        const quiplashA = matchup.votes.A === totalVotes && totalVotes > 0;
        const quiplashB = matchup.votes.B === totalVotes && totalVotes > 0;

        if (winnerA) {
          // Quiplash bonus for 100% votes
          const points = quiplashA ? 1000 : matchup.votes.A * 100;
          scores[matchup.optionA.playerId] = (scores[matchup.optionA.playerId] || 0) + points;
          matchup.quiplash = quiplashA ? 'A' : null;
        }
        if (winnerB) {
          const points = quiplashB ? 1000 : matchup.votes.B * 100;
          scores[matchup.optionB.playerId] = (scores[matchup.optionB.playerId] || 0) + points;
          matchup.quiplash = quiplashB ? 'B' : null;
        }
      });

      // Select a final prompt for Last Lash
      const finalPrompt = FINAL_PROMPTS[Math.floor(Math.random() * FINAL_PROMPTS.length)];

      return {
        nextPhase: 'LAST_LASH',
        roundData: { ...roundData, results: matchups, finalPrompt },
        scores
      };
    }

    case 'LAST_LASH': {
      // Fase 3: The finale - everyone answers the same question
      const { finalPrompt, votes } = roundData;
      const finalAnswers = [];

      // Collect all answers to the final prompt
      players.forEach((player, id) => {
        const input = player.submissions.LAST_LASH;
        if (input && input.answer) {
          finalAnswers.push({
            playerId: id,
            answer: input.answer,
            votes: 0
          });
        }
      });

      // Aggregate votes (players can vote for top 3)
      const voteCount = {};
      (roundData.lastLashVotes || []).forEach(vote => {
        vote.choices.forEach((answerId, rank) => {
          if (!voteCount[answerId]) voteCount[answerId] = 0;
          // Weight: 1st choice = 3 points, 2nd = 2 points, 3rd = 1 point
          voteCount[answerId] += (3 - rank);
        });
      });

      // Calculate scores (triple points!)
      const scores = {};
      finalAnswers.forEach((answer, idx) => {
        const votes = voteCount[idx] || 0;
        answer.votes = votes;
        scores[answer.playerId] = votes * 100 * 3; // Triple points!
      });

      return {
        nextPhase: 'REVEAL',
        roundData: { ...roundData, finalAnswers },
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
