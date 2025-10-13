import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function QuiplashVote({ matchups, playerId }) {
  const { submitVote } = useSocket();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  // Filter out matchups where player is a participant
  const votableMatchups = matchups.filter(
    m => m.optionA.playerId !== playerId && m.optionB.playerId !== playerId
  );

  if (votableMatchups.length === 0 || voted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🗳️</div>
        <h2 className="text-2xl font-bold mb-2">Vote Recorded!</h2>
        <p className="text-gray-400">Waiting for results...</p>
      </div>
    );
  }

  const currentMatchup = votableMatchups[currentIdx];

  const handleVote = (choice) => {
    setError('');

    submitVote(currentMatchup.id, choice, (response) => {
      if (response.success) {
        if (currentIdx < votableMatchups.length - 1) {
          setCurrentIdx(currentIdx + 1);
        } else {
          setVoted(true);
        }
      } else {
        setError(response.error || 'Failed to vote');
      }
    });
  };

  return (
    <div className="card">
      <div className="text-center mb-4">
        <div className="text-sm text-gray-400 mb-2">
          Vote {currentIdx + 1} of {votableMatchups.length}
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
