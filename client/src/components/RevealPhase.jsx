export default function RevealPhase({ gameType, roundData }) {
  if (!roundData || !roundData.results) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No results to display</p>
      </div>
    );
  }

  // Quiplash reveal
  if (gameType === 'QUIPLASH') {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center mb-4">Results</h3>
        {roundData.results.map((matchup, idx) => (
          <div key={idx} className="card bg-dark-100">
            <div className="text-sm text-gray-400 mb-2">{matchup.prompt}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${matchup.votes.A > matchup.votes.B ? 'bg-green-500 bg-opacity-20 border-2 border-green-500' : 'bg-dark-200'}`}>
                <div className="font-medium mb-2">{matchup.optionA.answer}</div>
                <div className="text-sm text-gray-400">
                  {matchup.votes.A} votes ({Math.round(matchup.votes.A / (matchup.votes.A + matchup.votes.B || 1) * 100)}%)
                </div>
              </div>
              <div className={`p-3 rounded-lg ${matchup.votes.B > matchup.votes.A ? 'bg-green-500 bg-opacity-20 border-2 border-green-500' : 'bg-dark-200'}`}>
                <div className="font-medium mb-2">{matchup.optionB.answer}</div>
                <div className="text-sm text-gray-400">
                  {matchup.votes.B} votes ({Math.round(matchup.votes.B / (matchup.votes.A + matchup.votes.B || 1) * 100)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Generic reveal for other games
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold">Round Complete!</h3>
    </div>
  );
}
