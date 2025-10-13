export default function Leaderboard({ players }) {
  if (!players || players.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No scores yet
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-2">
      {players.map((player, idx) => (
        <div key={player.id} className="leaderboard-item">
          <div className="flex items-center gap-3">
            <div className="text-2xl w-8">
              {medals[idx] || `${idx + 1}.`}
            </div>
            <div className="font-semibold">{player.name}</div>
          </div>
          <div className="text-2xl font-bold">{player.score}</div>
        </div>
      ))}
    </div>
  );
}
