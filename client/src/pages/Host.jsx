import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import Leaderboard from '../components/Leaderboard';
import RevealPhase from '../components/RevealPhase';
import QuiplashDisplay from '../components/games/QuiplashDisplay';

export default function Host() {
  const navigate = useNavigate();
  const { roomState, startGame, nextPhase, resetRoom } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [selectedGame, setSelectedGame] = useState('QUIPLASH');

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
    if (!session.roomCode || session.role !== 'HOST') {
      navigate('/');
      return;
    }
    setRoomCode(session.roomCode);
  }, [navigate]);

  const games = [
    { id: 'QUIPLASH', name: 'Quiplash', emoji: '💬' },
    { id: 'TEEKO', name: 'Tee K.O.', emoji: '👕' },
    { id: 'JOBJOB', name: 'Job Job', emoji: '💼' },
    { id: 'CHAMPDUP', name: "Champ'd Up", emoji: '🏆' },
    { id: 'TRIVIA', name: 'Trivia Murder Party', emoji: '❓' },
    { id: 'FIBBAGE', name: 'Fibbage', emoji: '🤥' }
  ];

  const handleStartGame = () => {
    startGame(selectedGame, (response) => {
      if (!response.success) {
        alert(response.error || 'Failed to start game');
      }
    });
  };

  const handleNextPhase = () => {
    nextPhase((response) => {
      if (!response.success) {
        alert(response.error || 'Failed to progress phase');
      }
    });
  };

  const handleReset = () => {
    if (confirm('Reset the entire room? This will clear all progress.')) {
      resetRoom((response) => {
        if (!response.success) {
          alert('Failed to reset room');
        }
      });
    }
  };

  const handleOpenDisplay = () => {
    if (!roomCode) {
      alert('Room code nog niet beschikbaar.');
      return;
    }

    const displayUrl = `${window.location.origin}/display?roomCode=${roomCode}`;
    const newWindow = window.open(displayUrl, '_blank', 'noopener,noreferrer');

    if (!newWindow) {
      alert('Kan het presentatie scherm niet openen. Controleer of pop-ups zijn toegestaan.');
    }
  };

  const joinUrl = `${window.location.origin}/join`;

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Host Control Panel</h1>
          <div className="flex items-center gap-3">
            <button onClick={handleOpenDisplay} className="btn btn-outline text-sm">
              📺 Open Presentatiescherm
            </button>
            <button onClick={handleReset} className="btn btn-danger text-sm">
              Reset Room
            </button>
          </div>
        </div>

        {/* Room Code & Players */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Room Code */}
          <div className="card text-center">
            <div className="text-sm text-gray-400 mb-2">Room Code</div>
            <div className="text-5xl font-bold tracking-widest mb-4">{roomCode}</div>
            <div className="flex justify-center">
              <QRCodeSVG value={joinUrl} size={120} />
            </div>
            <div className="text-xs text-gray-500 mt-2">{joinUrl}</div>
          </div>

          {/* Players */}
          <div className="card md:col-span-2">
            <div className="text-sm text-gray-400 mb-3">
              Players ({roomState.players.length})
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {roomState.players.map(player => (
                <div
                  key={player.id}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    player.status === 'disconnected'
                      ? 'bg-gray-800 text-gray-500'
                      : player.status === 'submitted' || player.status === 'voted'
                      ? 'bg-green-500 bg-opacity-20 text-green-300'
                      : 'bg-dark-100 text-gray-300'
                  }`}
                >
                  {player.name}
                  {player.status === 'submitted' && ' ✓'}
                  {player.status === 'voted' && ' ✓'}
                  {player.status === 'disconnected' && ' (offline)'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Display */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="phase-badge bg-primary text-white">
                {roomState.phase}
              </span>
              {roomState.gameType && (
                <span className="ml-3 text-gray-400">
                  {games.find(g => g.id === roomState.gameType)?.name}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold">
              Round {roomState.currentRound}
            </div>
          </div>

          {/* Phase-specific content */}
          {roomState.phase === 'LOBBY' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Game</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {games.map(game => (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGame(game.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedGame === game.id
                          ? 'border-primary bg-primary bg-opacity-20'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{game.emoji}</div>
                      <div className="text-sm font-medium">{game.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStartGame}
                disabled={roomState.players.length < 2}
                className="btn btn-success w-full text-lg"
              >
                Start Game
              </button>
              {roomState.players.length < 2 && (
                <p className="text-center text-yellow-400 text-sm">
                  Need at least 2 players to start
                </p>
              )}
            </div>
          )}

          {(roomState.phase === 'INPUT' || roomState.phase === 'MATCHUP') && (
            <>
              {roomState.gameType === 'QUIPLASH' ? (
                <div>
                  <QuiplashDisplay roundData={roomState.roundData} phase={roomState.phase} />
                  <div className="text-center mt-6">
                    <button onClick={handleNextPhase} className="btn btn-primary px-8 py-3 text-lg">
                      ⏭️ Volgende Fase
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xl mb-4">Waiting for players to submit...</p>
                  <div className="text-3xl mb-4">⏳</div>
                  <button onClick={handleNextPhase} className="btn btn-primary">
                    Force Next Phase
                  </button>
                </div>
              )}
            </>
          )}

          {roomState.phase === 'VOTE' && (
            <>
              {roomState.gameType === 'QUIPLASH' ? (
                <div>
                  <QuiplashDisplay roundData={roomState.roundData} phase={roomState.phase} />
                  <div className="text-center mt-6">
                    <button onClick={handleNextPhase} className="btn btn-primary px-8 py-3 text-lg">
                      🎉 Toon Resultaten
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xl mb-4">Players are voting...</p>
                  <div className="text-3xl mb-4">🗳️</div>
                  <button onClick={handleNextPhase} className="btn btn-primary">
                    Show Results
                  </button>
                </div>
              )}
            </>
          )}

          {roomState.phase === 'REVEAL' && (
            <div>
              <RevealPhase gameType={roomState.gameType} roundData={roomState.roundData} />
              <button onClick={handleNextPhase} className="btn btn-primary w-full mt-4">
                Continue to Leaderboard
              </button>
            </div>
          )}

          {roomState.phase === 'LEADERBOARD' && (
            <div>
              <Leaderboard players={roomState.leaderboard} />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={handleStartGame} className="btn btn-primary">
                  Start New Round
                </button>
                <button onClick={handleReset} className="btn btn-outline">
                  End Game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
