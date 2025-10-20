// Trivia Murder Party
// Phase flow: QUESTION -> MINIGAME -> (repeat) -> ESCAPE -> REVEAL -> LEADERBOARD

const QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correct: 2
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3
  },
  {
    question: "In what year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correct: 2
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct: 2
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correct: 2
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Dickens", "Shakespeare", "Austen", "Hemingway"],
    correct: 1
  }
];

const MINIGAMES = [
  { type: 'MATH', name: 'Deadly Math' },
  { type: 'MEMORY', name: 'Memory Lane' },
  { type: 'FINGERS', name: 'Finger Counting' },
  { type: 'DICTATION', name: 'Dictation' }
];

const ESCAPE_CATEGORIES = [
  "Things in a kitchen",
  "Types of animals",
  "Countries in Europe",
  "Movie genres",
  "Colors"
];

export function initRound(room) {
  const playerIds = Array.from(room.players.keys());

  // Initialize player states
  const playerStates = {};
  playerIds.forEach(id => {
    playerStates[id] = {
      alive: true,
      money: 0,
      ghostScore: 0
    };
  });

  return {
    questions: [...QUESTIONS].sort(() => Math.random() - 0.5),
    currentQuestionIndex: 0,
    playerStates,
    wrongAnswerers: [],
    minigameResults: {},
    escapePositions: {},
    escapeCategory: null,
    results: null
  };
}

export function nextPhase(room) {
  const { phase, roundData, players } = room;

  switch (phase) {
    case 'QUESTION': {
      // Fase 1: Quiz question - check who got it right/wrong
      const { currentQuestionIndex, questions, playerStates } = roundData;
      const currentQuestion = questions[currentQuestionIndex];
      const wrongAnswerers = [];
      const scores = {};

      players.forEach((player, id) => {
        const answer = player.submissions.QUESTION;
        const state = playerStates[id];

        if (answer !== undefined && answer !== null) {
          if (answer === currentQuestion.correct) {
            // Correct answer - earn money (if alive)
            if (state.alive) {
              state.money += 1000;
              scores[id] = 1000;
            } else {
              // Ghosts earn ghost score
              state.ghostScore += 100;
            }
          } else {
            // Wrong answer - go to killing floor (if alive)
            if (state.alive) {
              wrongAnswerers.push(id);
            }
          }
        }
      });

      // Check if we should go to escape phase
      const alivePlayers = Object.entries(playerStates).filter(([id, state]) => state.alive);

      if (alivePlayers.length <= 1) {
        // Start escape phase
        const escapePositions = {};
        Object.keys(playerStates).forEach(id => {
          escapePositions[id] = 0;
        });

        const escapeCategory = ESCAPE_CATEGORIES[Math.floor(Math.random() * ESCAPE_CATEGORIES.length)];

        return {
          nextPhase: 'ESCAPE',
          roundData: {
            ...roundData,
            escapePositions,
            escapeCategory
          },
          scores
        };
      }

      // If no one got it wrong, move to next question
      if (wrongAnswerers.length === 0) {
        return {
          nextPhase: 'QUESTION',
          roundData: {
            ...roundData,
            currentQuestionIndex: currentQuestionIndex + 1,
            wrongAnswerers: []
          },
          scores
        };
      }

      // Move to minigame
      const minigame = MINIGAMES[Math.floor(Math.random() * MINIGAMES.length)];

      return {
        nextPhase: 'MINIGAME',
        roundData: {
          ...roundData,
          wrongAnswerers,
          currentMinigame: minigame,
          minigameResults: {}
        },
        scores
      };
    }

    case 'MINIGAME': {
      // Fase 2: Killing Floor - determine who dies
      const { wrongAnswerers, currentMinigame, minigameResults, playerStates } = roundData;

      // Process minigame results based on type
      let loser = null;

      switch (currentMinigame.type) {
        case 'MATH': {
          // Slowest correct answer loses
          let slowestTime = -1;
          wrongAnswerers.forEach(id => {
            const result = minigameResults[id];
            if (result && result.time > slowestTime) {
              slowestTime = result.time;
              loser = id;
            }
          });
          break;
        }

        case 'MEMORY': {
          // First mistake loses
          wrongAnswerers.forEach(id => {
            const result = minigameResults[id];
            if (result && result.mistakes > 0 && !loser) {
              loser = id;
            }
          });
          break;
        }

        case 'FINGERS': {
          // Closest to sum without going over wins, furthest loses
          const fingerCounts = wrongAnswerers.map(id => ({
            id,
            fingers: minigameResults[id]?.fingers || 0
          }));
          const totalFingers = fingerCounts.reduce((sum, f) => sum + f.fingers, 0);

          // Find who was furthest from total
          let maxDiff = -1;
          fingerCounts.forEach(({ id, fingers }) => {
            const diff = Math.abs(totalFingers - fingers);
            if (diff > maxDiff) {
              maxDiff = diff;
              loser = id;
            }
          });
          break;
        }

        case 'DICTATION': {
          // Most errors loses
          let maxErrors = -1;
          wrongAnswerers.forEach(id => {
            const result = minigameResults[id];
            const errors = result?.errors || 0;
            if (errors > maxErrors) {
              maxErrors = errors;
              loser = id;
            }
          });
          break;
        }
      }

      // If no clear loser, pick random
      if (!loser && wrongAnswerers.length > 0) {
        loser = wrongAnswerers[Math.floor(Math.random() * wrongAnswerers.length)];
      }

      // Kill the loser
      if (loser) {
        playerStates[loser].alive = false;
      }

      // Move to next question
      return {
        nextPhase: 'QUESTION',
        roundData: {
          ...roundData,
          currentQuestionIndex: roundData.currentQuestionIndex + 1,
          wrongAnswerers: [],
          killedPlayer: loser
        }
      };
    }

    case 'ESCAPE': {
      // Fase 4: The escape finale
      const { escapePositions, playerStates, escapeCategory } = roundData;
      const FINISH_LINE = 10;

      // Process escape answers
      players.forEach((player, id) => {
        const answer = player.submissions.ESCAPE;
        if (answer && answer.correct) {
          escapePositions[id] = (escapePositions[id] || 0) + 1;
        }
      });

      // Check for winner
      let winner = null;
      Object.entries(escapePositions).forEach(([id, position]) => {
        if (position >= FINISH_LINE) {
          winner = id;
        }
      });

      // Check for ghost takeover
      const livingPlayers = Object.entries(playerStates)
        .filter(([id, state]) => state.alive)
        .map(([id]) => id);

      const ghostPlayers = Object.entries(playerStates)
        .filter(([id, state]) => !state.alive)
        .map(([id]) => id);

      ghostPlayers.forEach(ghostId => {
        livingPlayers.forEach(livingId => {
          if (escapePositions[ghostId] > escapePositions[livingId]) {
            // Ghost takes over body!
            playerStates[ghostId].alive = true;
            playerStates[livingId].alive = false;
          }
        });
      });

      if (winner) {
        // Game over!
        const scores = {};
        scores[winner] = 5000;

        return {
          nextPhase: 'REVEAL',
          roundData: { ...roundData, winner },
          scores
        };
      }

      // Continue escape
      return {
        nextPhase: 'ESCAPE',
        roundData: { ...roundData, escapePositions }
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
