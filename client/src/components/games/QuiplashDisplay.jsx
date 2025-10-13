export default function QuiplashDisplay({ roundData, phase }) {
  if (!roundData) return null;

  // INPUT PHASE - Show prompts being answered
  if (phase === 'INPUT') {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-orange-500/50">
          <div className="text-8xl mb-6 animate-bounce">✍️</div>
          <h2 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-400">
            SCHRIJF JE ANTWOORDEN!
          </h2>
          <p className="text-3xl text-gray-300 font-semibold">Spelers beantwoorden de vragen...</p>
          <div className="mt-8 flex justify-center gap-3">
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-4 h-4 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // VOTE PHASE - Show current matchup
  if (phase === 'VOTE' && roundData.matchups && roundData.matchups.length > 0) {
    const currentMatchupIndex = roundData.currentMatchupIndex || 0;
    const currentMatchup = roundData.matchups[currentMatchupIndex];

    if (!currentMatchup) {
      return (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-2xl text-gray-400">Loading matchup...</p>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 shadow-2xl border-4 border-cyan-500/50">

          {/* Progress Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-6 shadow-lg">
              <span className="text-white font-black text-2xl">VRAAG {currentMatchupIndex + 1}</span>
              <span className="text-white/70 font-bold text-xl">van {roundData.matchups.length}</span>
            </div>

            {/* Prompt Display */}
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-3xl p-8 border-4 border-purple-500/50 shadow-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                {currentMatchup.prompt}
              </h2>
            </div>

            <p className="text-2xl text-cyan-400 font-bold mt-6 animate-pulse">
              👇 SPELERS STEMMEN 👇
            </p>
          </div>

          {/* Answer Display */}
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Option A */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border-4 border-orange-500/50 shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-lg">
                    A
                  </div>
                  <div className="flex-1">
                    <p className="text-3xl md:text-4xl font-bold text-white leading-relaxed">
                      {currentMatchup.optionA.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="flex-1 h-2 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded"></div>
              <div className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mx-6 shadow-lg">
                <span className="text-white font-black text-3xl">VS</span>
              </div>
              <div className="flex-1 h-2 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded"></div>
            </div>

            {/* Option B */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition"></div>
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border-4 border-purple-500/50 shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-lg">
                    B
                  </div>
                  <div className="flex-1">
                    <p className="text-3xl md:text-4xl font-bold text-white leading-relaxed">
                      {currentMatchup.optionB.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="mt-10 text-center">
            <p className="text-xl text-gray-400 font-medium">
              💡 Stem op je telefoon voor het beste antwoord!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
