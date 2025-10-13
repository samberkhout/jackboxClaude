import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function JobJobVote({ answers, playerId }) {
  const { submitVote } = useSocket();
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  // Filter out own answer
  const votableAnswers = answers.filter(a => a.playerId !== playerId);

  const handleVote = (targetId) => {
    setError('');

    submitVote(targetId, 'vote', (response) => {
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
      <h2 className="text-2xl font-bold mb-4 text-center">Vote for the Best Answer</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {votableAnswers.map((answer) => (
          <button
            key={answer.playerId}
            onClick={() => handleVote(answer.playerId)}
            className="w-full p-4 rounded-lg bg-dark-100 hover:bg-primary hover:bg-opacity-20 border-2 border-gray-700 hover:border-primary transition-all text-left"
          >
            <div className="text-lg">{answer.text}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Tap an answer to vote
      </div>
    </div>
  );
}
