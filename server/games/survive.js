// Survive the Internet Game Logic
// Phase flow: INPUT -> TWIST -> VOTE -> REVEAL -> LEADERBOARD

const INITIAL_QUESTIONS = [
  "What did you do this morning?",
  "What's your favorite hobby?",
  "What do you do to relax?",
  "What makes you happy?",
  "What's your best talent?",
  "What do you do on weekends?",
  "What's your secret skill?",
  "What did you do last night?",
  "What's your morning routine?",
  "What's your guilty pleasure?"
];

const TWIST_CONTEXTS = [
  {
    type: 'NEWS_HEADLINE',
    template: 'BREAKING NEWS',
    instruction: 'Write a shocking news headline using this quote'
  },
  {
    type: 'YOUTUBE_COMMENT',
    template: 'Video: "Extreme Animal Fights"',
    instruction: 'Write a YouTube comment on this video using their quote'
  },
  {
    type: 'DATING_PROFILE',
    template: 'Dating Profile Bio',
    instruction: 'Use their quote as a dating profile description'
  },
  {
    type: 'PRODUCT_REVIEW',
    template: 'Amazon Review',
    instruction: 'Write a product review incorporating their quote'
  },
  {
    type: 'FORUM_POST',
    template: 'Forum: "Parenting Advice"',
    instruction: 'Make a forum post with their quote as the main content'
  },
  {
    type: 'MEME',
    template: 'Image: House on fire',
    instruction: 'Caption this meme with their quote'
  },
  {
    type: 'TWEET',
    template: 'Twitter',
    instruction: 'Write a controversial tweet using their quote'
  },
  {
    type: 'TEXT_MESSAGE',
    template: 'Text to: Your Boss',
    instruction: 'Create a text message to your boss with their quote'
  },
  {
    type: 'OBITUARY',
    template: 'Obituary',
    instruction: 'Write an obituary with their quote as the final words'
  },
  {
    type: 'CONFESSION',
    template: 'Anonymous Confession',
    instruction: 'Turn their quote into a scandalous confession'
  }
];

export function initRound(room) {
  const playerIds = Array.from(room.players.keys());

  // Assign questions to players
  const playerQuestions = {};
  playerIds.forEach((id, idx) => {
    playerQuestions[id] = INITIAL_QUESTIONS[idx % INITIAL_QUESTIONS.length];
  });

  return {
    playerQuestions,
    innocentAnswers: {},
    twists: [],
    votes: [],
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'INPUT': {
      // Fase 1: Collect innocent answers
      const innocentAnswers = {};

      players.forEach((player, id) => {
        const input = player.submissions.INPUT;
        if (input && input.answer) {
          innocentAnswers[id] = {
            playerId: id,
            question: roundData.playerQuestions[id],
            answer: input.answer
          };
        }
      });

      // Assign each player someone else's answer to twist
      const playerIds = Array.from(players.keys());
      const answerAssignments = {};

      playerIds.forEach((twisterId, idx) => {
        // Assign the next player's answer (circular)
        const victimId = playerIds[(idx + 1) % playerIds.length];
        const context = TWIST_CONTEXTS[Math.floor(Math.random() * TWIST_CONTEXTS.length)];

        answerAssignments[twisterId] = {
          victimId,
          victimAnswer: innocentAnswers[victimId],
          context
        };
      });

      return {
        nextPhase: 'TWIST',
        roundData: {
          ...roundData,
          innocentAnswers,
          answerAssignments,
          twists: []
        }
      };
    }

    case 'TWIST': {
      // Fase 2: Collect twisted versions
      const { answerAssignments, innocentAnswers } = roundData;
      const twists = [];

      players.forEach((player, twisterId) => {
        const input = player.submissions.TWIST;
        const assignment = answerAssignments[twisterId];

        if (input && input.twist && assignment) {
          twists.push({
            twisterId,
            victimId: assignment.victimId,
            originalAnswer: innocentAnswers[assignment.victimId].answer,
            originalQuestion: innocentAnswers[assignment.victimId].question,
            context: assignment.context,
            twist: input.twist,
            votes: 0
          });
        }
      });

      return {
        nextPhase: 'VOTE',
        roundData: {
          ...roundData,
          twists,
          votes: []
        }
      };
    }

    case 'VOTE': {
      // Fase 3 & 4: Tally votes and calculate scores
      const { twists, votes } = roundData;
      const scores = {};

      // Count votes for each twist
      votes.forEach(vote => {
        const twist = twists[vote.twistIndex];
        if (twist) {
          twist.votes++;
        }
      });

      // Award points
      twists.forEach(twist => {
        // Twister gets points for votes (reward for meanness)
        scores[twist.twisterId] = (scores[twist.twisterId] || 0) + (twist.votes * 250);

        // Victim gets small "pity points" if their humiliation was popular
        if (twist.votes > 0) {
          scores[twist.victimId] = (scores[twist.victimId] || 0) + (twist.votes * 50);
        }
      });

      // Bonus for most voted twist
      const mostVoted = twists.reduce((max, twist) =>
        twist.votes > (max?.votes || 0) ? twist : max, null
      );

      if (mostVoted) {
        scores[mostVoted.twisterId] = (scores[mostVoted.twisterId] || 0) + 500;
      }

      return {
        nextPhase: 'REVEAL',
        roundData: {
          ...roundData,
          results: twists
        },
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
