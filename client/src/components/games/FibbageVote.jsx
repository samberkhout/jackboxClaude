import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function FibbageVote({ options, playerId }) {
  const { submitVote } = useSocket();
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');
  const [hoveredOption, setHoveredOption] = useState(null);

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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-orange-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-yellow-500/50">
          <div className="text-8xl mb-6 animate-pulse">🗳️</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            VOTE RECORDED!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Waiting for results...</p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500/50">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">FIBBAGE</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 mb-2">
            PICK THE TRUTH!
          </h2>
          <p className="text-amber-400 text-lg font-bold animate-pulse">
            🤔 One is TRUE, the rest are LIES!
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Voting Options */}
        <div className="space-y-4">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              onMouseEnter={() => setHoveredOption(idx)}
              onMouseLeave={() => setHoveredOption(null)}
              className="group relative w-full p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95"
              style={{
                background: hoveredOption === idx
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 146, 60, 0.3))'
                  : 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.8))',
                border: hoveredOption === idx ? '4px solid rgb(245, 158, 11)' : '3px solid rgba(245, 158, 11, 0.3)',
                boxShadow: hoveredOption === idx ? '0 0 40px rgba(245, 158, 11, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                  {String.fromCharCode(65 + idx)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                    {option.text}
                  </p>
                </div>
              </div>
              {hoveredOption === idx && (
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce">
                  👈
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm font-medium">
            💡 Try to spot the truth among the lies!
          </p>
        </div>
      </div>
    </div>
  );
}
