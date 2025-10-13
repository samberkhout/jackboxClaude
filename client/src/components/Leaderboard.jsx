export default function Leaderboard({ players }) {
  if (!players || players.length === 0) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 via-slate-500/10 to-gray-500/10"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-gray-500/50">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-2xl text-gray-400 font-bold">No scores yet</p>
        </div>
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];
  const gradients = [
    'from-yellow-500 to-amber-500',
    'from-gray-400 to-gray-500',
    'from-orange-600 to-amber-700'
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">LEADERBOARD</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400">
            TOP PLAYERS
          </h2>
        </div>

        <div className="space-y-4">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className="relative group transform transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                className={`relative bg-gradient-to-r ${
                  idx < 3
                    ? gradients[idx] + ' bg-opacity-20'
                    : 'from-gray-800 to-gray-900'
                } rounded-2xl p-6 border-4 ${
                  idx < 3 ? 'border-yellow-400/50' : 'border-gray-700/50'
                } shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex-shrink-0 w-16 h-16 ${
                        idx < 3
                          ? `bg-gradient-to-br ${gradients[idx]}`
                          : 'bg-gradient-to-br from-gray-600 to-gray-700'
                      } rounded-full flex items-center justify-center text-3xl shadow-lg`}
                    >
                      {medals[idx] || `${idx + 1}`}
                    </div>
                    <div>
                      <div
                        className={`text-2xl font-black ${
                          idx < 3 ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        {player.name}
                      </div>
                      {idx === 0 && (
                        <div className="text-sm text-yellow-400 font-bold">
                          👑 CHAMPION
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-4xl font-black ${
                      idx < 3
                        ? 'text-transparent bg-clip-text bg-gradient-to-r ' +
                          gradients[idx]
                        : 'text-gray-500'
                    }`}
                  >
                    {player.score}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
