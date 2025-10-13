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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-green-500/50">
          <div className="text-8xl mb-6 animate-bounce">🗳️</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            VOTE RECORDED!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Waiting for results...</p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
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
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-emerald-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-4">
            <span className="text-white font-bold text-sm">
              Vote {currentIdx + 1} of {votableDuels.length}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 mb-2">
            CHAMPION VS CHALLENGER!
          </h2>
          <p className="text-gray-400 text-lg">Pick the better drawing!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={() => handleVote('champion')}
            className="w-full p-6 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-green-600/30 hover:from-emerald-600/50 hover:to-green-600/50 border-4 border-emerald-400/50 hover:border-emerald-400 transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-emerald-500/50"
          >
            <div className="text-sm text-emerald-300 mb-3 font-bold uppercase tracking-wide">🏆 Champion</div>
            <img src={currentDuel.champion?.drawing} alt="Champion" className="w-full rounded-xl mb-3 border-2 border-emerald-400/30" />
            <div className="text-center font-black text-2xl text-white">{currentDuel.champion?.name}</div>
          </button>

          <button
            onClick={() => handleVote('challenger')}
            className="w-full p-6 rounded-2xl bg-gradient-to-r from-green-600/30 to-teal-600/30 hover:from-green-600/50 hover:to-teal-600/50 border-4 border-green-400/50 hover:border-teal-400 transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-teal-500/50"
          >
            <div className="text-sm text-teal-300 mb-3 font-bold uppercase tracking-wide">⚔️ Challenger</div>
            <img src={currentDuel.challenger?.drawing} alt="Challenger" className="w-full rounded-xl border-2 border-teal-400/30" />
          </button>
        </div>

        <div className="mt-6 text-center text-lg text-gray-400 font-semibold">
          👆 Tap a drawing to vote
        </div>
      </div>
    </div>
  );
}
