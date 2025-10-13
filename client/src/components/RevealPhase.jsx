export default function RevealPhase({ gameType, roundData }) {
  if (!roundData || !roundData.results) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 via-slate-500/10 to-gray-500/10"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-gray-500/50">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-2xl text-gray-400 font-bold">No results to display</p>
        </div>
      </div>
    );
  }

  // Quiplash reveal
  if (gameType === 'QUIPLASH') {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-purple-500/50">
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
              <span className="text-white font-black text-sm tracking-widest">RESULTS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
              ROUND RESULTS
            </h2>
          </div>

          <div className="space-y-6">
            {roundData.results.map((matchup, idx) => {
              const totalVotes = matchup.votes.A + matchup.votes.B || 1;
              const percentA = Math.round((matchup.votes.A / totalVotes) * 100);
              const percentB = Math.round((matchup.votes.B / totalVotes) * 100);
              const winnerA = matchup.votes.A > matchup.votes.B;
              const winnerB = matchup.votes.B > matchup.votes.A;

              return (
                <div key={idx} className="transform transition-all duration-300">
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border-2 border-purple-500/50 shadow-lg">
                    <div className="text-center text-lg text-gray-300 mb-4 font-semibold">
                      {matchup.prompt}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option A */}
                      <div
                        className={`relative p-6 rounded-xl border-4 transition-all ${
                          winnerA
                            ? 'bg-gradient-to-br from-green-600/30 to-emerald-600/30 border-green-400 shadow-lg shadow-green-500/30'
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600'
                        }`}
                      >
                        {winnerA && (
                          <div className="absolute top-2 right-2 text-3xl">
                            👑
                          </div>
                        )}
                        <div className="text-xl font-bold text-white mb-3">
                          {matchup.optionA.answer}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-lg font-bold ${winnerA ? 'text-green-400' : 'text-gray-400'}`}>
                            {matchup.votes.A} votes
                          </div>
                          <div className={`text-2xl font-black ${winnerA ? 'text-green-400' : 'text-gray-400'}`}>
                            {percentA}%
                          </div>
                        </div>
                      </div>

                      {/* Option B */}
                      <div
                        className={`relative p-6 rounded-xl border-4 transition-all ${
                          winnerB
                            ? 'bg-gradient-to-br from-green-600/30 to-emerald-600/30 border-green-400 shadow-lg shadow-green-500/30'
                            : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600'
                        }`}
                      >
                        {winnerB && (
                          <div className="absolute top-2 right-2 text-3xl">
                            👑
                          </div>
                        )}
                        <div className="text-xl font-bold text-white mb-3">
                          {matchup.optionB.answer}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-lg font-bold ${winnerB ? 'text-green-400' : 'text-gray-400'}`}>
                            {matchup.votes.B} votes
                          </div>
                          <div className={`text-2xl font-black ${winnerB ? 'text-green-400' : 'text-gray-400'}`}>
                            {percentB}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Generic reveal for other games
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 animate-pulse"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-blue-500/50">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
          ROUND COMPLETE!
        </h2>
        <p className="text-2xl text-gray-300 font-semibold">Great job everyone!</p>
      </div>
    </div>
  );
}
