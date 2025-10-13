import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function FibbageVote({ options, playerId }) {
  const { submitVote } = useSocket();
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  const handleVote = (choiceIdx) => {
    setError('');

    submitVote(playerId, choiceIdx, (response) => {
      if (response.success) {
        setVoted(true);
      } else {
        setError(response.error || 'Failed to vote');
      }
    });
  };

  if (voted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🗳️</div>
        <h2 className="text-2xl font-bold mb-2">Vote Recorded!</h2>
        <p className="text-gray-400">Waiting for results...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Pick the Truth!</h2>
      <p className="text-center text-gray-400 mb-6">
        One of these is true. The rest are lies!
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleVote(idx)}
            className="w-full p-4 rounded-lg bg-dark-100 hover:bg-primary hover:bg-opacity-20 border-2 border-gray-700 hover:border-primary transition-all text-left"
          >
            <div className="text-lg">{option.text}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Tap an answer to vote
      </div>
    </div>
  );
}
