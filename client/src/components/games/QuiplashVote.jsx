import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function QuiplashVote({ matchups, playerId, currentMatchupIndex }) {
  const { submitVote } = useSocket();
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  if (!matchups || matchups.length === 0 || currentMatchupIndex >= matchups.length) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        <p className="text-gray-400">Waiting for voting to start...</p>
      </div>
    );
  }

  const currentMatchup = matchups[currentMatchupIndex];

  // Check if player is a participant in this matchup
  const isParticipant =
    currentMatchup.optionA.playerId === playerId ||
    currentMatchup.optionB.playerId === playerId;

  if (isParticipant || voted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🗳️</div>
        <h2 className="text-2xl font-bold mb-2">
          {isParticipant ? 'Dit is jouw vraag!' : 'Stem ingediend!'}
        </h2>
        <p className="text-gray-400">Wachten op anderen...</p>
      </div>
    );
  }

  const handleVote = (choice) => {
    setError('');

    submitVote(currentMatchup.id, choice, (response) => {
      if (response.success) {
        setVoted(true);
        // Reset voted state when moving to next matchup (will be handled by room state update)
        setTimeout(() => setVoted(false), 100);
      } else {
        setError(response.error || 'Failed to vote');
      }
    });
  };

  return (
    <div className="card">
      <div className="text-center mb-4">
        <div className="text-sm text-gray-400 mb-2">
          Vraag {currentMatchupIndex + 1} van {matchups.length}
        </div>
        <h2 className="text-xl font-bold">{currentMatchup.prompt}</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={() => handleVote('A')}
          className="w-full p-6 rounded-lg bg-dark-100 hover:bg-primary hover:bg-opacity-20 border-2 border-gray-700 hover:border-primary transition-all text-left"
        >
          <div className="text-lg">{currentMatchup.optionA.answer}</div>
        </button>

        <button
          onClick={() => handleVote('B')}
          className="w-full p-6 rounded-lg bg-dark-100 hover:bg-secondary hover:bg-opacity-20 border-2 border-gray-700 hover:border-secondary transition-all text-left"
        >
          <div className="text-lg">{currentMatchup.optionB.answer}</div>
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Tap an answer to vote
      </div>
    </div>
  );
}
