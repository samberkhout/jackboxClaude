// Drawful Game Logic
// Phase flow: DRAWING -> DECEIVE -> VOTE -> REVEAL -> LEADERBOARD

const PROMPTS = [
  "Death by trombone",
  "A confused refrigerator",
  "Vampire dentist",
  "Sad robot uprising",
  "Underwater basketball",
  "Pizza archaeologist",
  "Time-traveling potato",
  "Ninja librarian",
  "Breakdancing dinosaur",
  "Quantum mechanic",
  "Philosophical hotdog",
  "Disco werewolf",
  "Astronaut farmer",
  "Medieval smartphone",
  "Psychic hamster",
  "Corporate dragon",
  "Zombie marathon",
  "Invisible karaoke",
  "Romantic tornado",
  "Sleepy volcano"
];

export function initRound(room) {
  const playerIds = Array.from(room.players.keys());

  // Assign unique prompts to each player
  const shuffledPrompts = [...PROMPTS].sort(() => Math.random() - 0.5);
  const playerPrompts = {};

  playerIds.forEach((id, index) => {
    playerPrompts[id] = shuffledPrompts[index % shuffledPrompts.length];
  });

  return {
    playerPrompts,
    drawings: {},
    currentDrawingIndex: 0,
    fakeAnswers: {}, // Maps drawingId -> array of fake titles
    votes: {},
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'DRAWING': {
      // Fase 1: Collect all terrible drawings
      const drawings = [];

      players.forEach((player, id) => {
        const input = player.submissions.DRAWING;
        if (input && input.drawing) {
          drawings.push({
            playerId: id,
            prompt: roundData.playerPrompts[id],
            drawing: input.drawing,
            color1: input.color1 || 'blue',
            color2: input.color2 || 'orange'
          });
        }
      });

      return {
        nextPhase: 'DECEIVE',
        roundData: {
          ...roundData,
          drawings,
          currentDrawingIndex: 0,
          fakeAnswers: {}
        }
      };
    }

    case 'DECEIVE': {
      // Fase 2: Collect fake titles for each drawing
      const { drawings } = roundData;
      const fakeAnswers = {};

      // Organize fake answers by drawing
      players.forEach((player, playerId) => {
        const input = player.submissions.DECEIVE;
        if (input && input.fakeAnswers) {
          // Each player submits fake answers for drawings (not their own)
          Object.entries(input.fakeAnswers).forEach(([drawingIdx, fakeTitle]) => {
            const idx = parseInt(drawingIdx);
            if (!fakeAnswers[idx]) {
              fakeAnswers[idx] = [];
            }
            fakeAnswers[idx].push({
              playerId,
              text: fakeTitle
            });
          });
        }
      });

      return {
        nextPhase: 'VOTE',
        roundData: {
          ...roundData,
          fakeAnswers,
          currentDrawingIndex: 0,
          votes: {}
        }
      };
    }

    case 'VOTE': {
      // Fase 3 & 4: Tally votes and calculate scores
      const { drawings, fakeAnswers, votes } = roundData;
      const scores = {};

      drawings.forEach((drawing, drawingIdx) => {
        const realPrompt = drawing.prompt;
        const fakes = fakeAnswers[drawingIdx] || [];

        // Create options list (real + fakes)
        const options = [
          { type: 'real', text: realPrompt },
          ...fakes.map(f => ({ type: 'fake', text: f.text, playerId: f.playerId }))
        ];

        // Count votes for this drawing
        const votesForDrawing = votes[drawingIdx] || [];

        votesForDrawing.forEach(vote => {
          const votedOption = options[vote.choice];

          if (votedOption.type === 'real') {
            // Voted for the correct answer
            scores[vote.voterId] = (scores[vote.voterId] || 0) + 1000;

            // Artist gets points when people guess correctly
            scores[drawing.playerId] = (scores[drawing.playerId] || 0) + 250;
          } else if (votedOption.type === 'fake') {
            // Fooled by a fake - the liar gets points
            scores[votedOption.playerId] = (scores[votedOption.playerId] || 0) + 500;
          }
        });
      });

      return {
        nextPhase: 'REVEAL',
        roundData: {
          ...roundData,
          results: drawings
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
