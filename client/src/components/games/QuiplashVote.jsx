import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function QuiplashVote({ matchups, playerId, currentMatchupIndex }) {
  const { submitVote } = useSocket();
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');
  const [hoveredOption, setHoveredOption] = useState(null);

  if (!matchups || matchups.length === 0 || currentMatchupIndex >= matchups.length) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-purple-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-blue-500/50">
          <div className="text-8xl mb-6">⏳</div>
          <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            LADEN...
          </h2>
          <p className="text-xl text-gray-300">Wachten op voting...</p>
        </div>
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-yellow-500/50">
          <div className="text-8xl mb-6 animate-pulse">{isParticipant ? '🎨' : '🗳️'}</div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
            {isParticipant ? 'DIT IS JOUW VRAAG!' : 'GESTEMD!'}
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Wachten op anderen...</p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
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
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-cyan-500/50">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4">
            <span className="text-white font-black text-sm">VRAAG {currentMatchupIndex + 1}</span>
            <span className="text-white/70 font-bold text-sm">van {matchups.length}</span>
          </div>
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-6 border-2 border-purple-500/50">
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {currentMatchup.prompt}
            </h2>
          </div>
          <p className="text-cyan-400 text-lg font-bold mt-4 animate-pulse">
            👇 KIES HET BESTE ANTWOORD 👇
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
          <button
            onClick={() => handleVote('A')}
            onMouseEnter={() => setHoveredOption('A')}
            onMouseLeave={() => setHoveredOption(null)}
            className="group relative w-full p-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95"
            style={{
              background: hoveredOption === 'A'
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 88, 12, 0.3))'
                : 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.8))',
              border: hoveredOption === 'A' ? '4px solid rgb(249, 115, 22)' : '3px solid rgba(249, 115, 22, 0.3)',
              boxShadow: hoveredOption === 'A' ? '0 0 40px rgba(249, 115, 22, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">
              A
            </div>
            <div className="pl-16 text-left">
              <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                {currentMatchup.optionA.answer}
              </p>
            </div>
            {hoveredOption === 'A' && (
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce">
                👈
              </div>
            )}
          </button>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
            <div className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mx-4">
              <span className="text-white font-black text-xl">VS</span>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
          </div>

          {/* Option B */}
          <button
            onClick={() => handleVote('B')}
            onMouseEnter={() => setHoveredOption('B')}
            onMouseLeave={() => setHoveredOption(null)}
            className="group relative w-full p-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.03] active:scale-95"
            style={{
              background: hoveredOption === 'B'
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(147, 51, 234, 0.3))'
                : 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.8))',
              border: hoveredOption === 'B' ? '4px solid rgb(168, 85, 247)' : '3px solid rgba(168, 85, 247, 0.3)',
              boxShadow: hoveredOption === 'B' ? '0 0 40px rgba(168, 85, 247, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">
              B
            </div>
            <div className="pl-16 text-left">
              <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                {currentMatchup.optionB.answer}
              </p>
            </div>
            {hoveredOption === 'B' && (
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-4xl animate-bounce">
                👈
              </div>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm font-medium">
            💡 Tip: Kies het antwoord dat jou het hardst laat lachen!
          </p>
        </div>
      </div>
    </div>
  );
}
