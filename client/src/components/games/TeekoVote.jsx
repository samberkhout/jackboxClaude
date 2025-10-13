import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function TeekoVote({ duels, playerId }) {
  const { submitVote } = useSocket();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');
  const [hoveredOption, setHoveredOption] = useState(null);

  // Filter out duels where player is a participant
  const votableDuels = duels.filter(
    d => d.comboA?.playerId !== playerId && d.comboB?.playerId !== playerId
  );

  if (votableDuels.length === 0 || voted) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-blue-500/50">
          <div className="text-8xl mb-6 animate-pulse">🗳️</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {votableDuels.length === 0 ? 'WAITING...' : 'VOTE RECORDED!'}
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Waiting for results...</p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-blue-500/50">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4">
            <span className="text-white font-black text-sm">T-SHIRT {currentIdx + 1}</span>
            <span className="text-white/70 font-bold text-sm">of {votableDuels.length}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-2">
            PICK THE BEST T-SHIRT!
          </h2>
          <p className="text-cyan-400 text-lg font-bold animate-pulse">
            👇 TAP YOUR FAVORITE 👇
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Voting Options */}
        <div className="space-y-6">
          {/* Option A */}
          {currentDuel.comboA && (
            <button
              onClick={() => handleVote('A')}
              onMouseEnter={() => setHoveredOption('A')}
              onMouseLeave={() => setHoveredOption(null)}
              className="group relative w-full p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95"
              style={{
                background: hoveredOption === 'A'
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))'
                  : 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.8))',
                border: hoveredOption === 'A' ? '4px solid rgb(59, 130, 246)' : '3px solid rgba(59, 130, 246, 0.3)',
                boxShadow: hoveredOption === 'A' ? '0 0 40px rgba(59, 130, 246, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">
                A
              </div>
              <div className="mt-8">
                <img
                  src={currentDuel.comboA.drawing?.data}
                  alt="Design A"
                  className="w-full rounded-xl mb-4 border-4 border-blue-400/50 shadow-lg"
                />
                <div className="text-center text-xl md:text-2xl font-bold text-white bg-gray-900/50 rounded-xl p-4 border-2 border-blue-400/30">
                  {currentDuel.comboA.slogan?.text}
                </div>
              </div>
              {hoveredOption === 'A' && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce">
                  👈
                </div>
              )}
            </button>
          )}

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            <div className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full mx-4">
              <span className="text-white font-black text-xl">VS</span>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>

          {/* Option B */}
          {currentDuel.comboB && (
            <button
              onClick={() => handleVote('B')}
              onMouseEnter={() => setHoveredOption('B')}
              onMouseLeave={() => setHoveredOption(null)}
              className="group relative w-full p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95"
              style={{
                background: hoveredOption === 'B'
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(14, 165, 233, 0.3))'
                  : 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.8))',
                border: hoveredOption === 'B' ? '4px solid rgb(6, 182, 212)' : '3px solid rgba(6, 182, 212, 0.3)',
                boxShadow: hoveredOption === 'B' ? '0 0 40px rgba(6, 182, 212, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">
                B
              </div>
              <div className="mt-8">
                <img
                  src={currentDuel.comboB.drawing?.data}
                  alt="Design B"
                  className="w-full rounded-xl mb-4 border-4 border-cyan-400/50 shadow-lg"
                />
                <div className="text-center text-xl md:text-2xl font-bold text-white bg-gray-900/50 rounded-xl p-4 border-2 border-cyan-400/30">
                  {currentDuel.comboB.slogan?.text}
                </div>
              </div>
              {hoveredOption === 'B' && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce">
                  👈
                </div>
              )}
            </button>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm font-medium">
            💡 Pick the one that makes you laugh the hardest!
          </p>
        </div>
      </div>
    </div>
  );
}
