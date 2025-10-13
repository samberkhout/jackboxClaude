import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function ChampdUpVote({ duels, playerId }) {
  const { submitVote } = useSocket();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  // Filter out duels where player is a participant
  const votableDuels = duels.filter(
    d => d.champion?.playerId !== playerId && d.challenger?.playerId !== playerId
  );

  if (votableDuels.length === 0 || voted) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">🗳️</div>
        <h2 className="text-2xl font-bold mb-2">Vote Recorded!</h2>
        <p className="text-gray-400">Waiting for results...</p>
      </div>
    );
  }

  const currentDuel = votableDuels[currentIdx];

  const handleVote = (choice) => {
    setError('');

    submitVote(currentDuel.id, choice, (response) => {
      if (response.success) {
        if (currentIdx < votableDuels.length - 1) {
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
          Vote {currentIdx + 1} of {votableDuels.length}
        </div>
        <h2 className="text-xl font-bold">Champion vs Challenger</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={() => handleVote('champion')}
          className="w-full p-4 rounded-lg bg-dark-100 hover:bg-primary hover:bg-opacity-20 border-2 border-gray-700 hover:border-primary transition-all"
        >
          <div className="text-sm text-gray-400 mb-2">Champion</div>
          <img src={currentDuel.champion?.drawing} alt="Champion" className="w-full rounded mb-2" />
          <div className="text-center font-medium">{currentDuel.champion?.name}</div>
        </button>

        <button
          onClick={() => handleVote('challenger')}
          className="w-full p-4 rounded-lg bg-dark-100 hover:bg-secondary hover:bg-opacity-20 border-2 border-gray-700 hover:border-secondary transition-all"
        >
          <div className="text-sm text-gray-400 mb-2">Challenger</div>
          <img src={currentDuel.challenger?.drawing} alt="Challenger" className="w-full rounded" />
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Tap a drawing to vote
      </div>
    </div>
  );
}
