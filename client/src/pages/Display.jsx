import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import Leaderboard from '../components/Leaderboard';
import QuiplashDisplay from '../components/games/QuiplashDisplay';
import RevealPhase from '../components/RevealPhase';

export default function Display() {
  const navigate = useNavigate();
  const { roomState } = useSocket();
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
    // Only allow host to access display view
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

  const joinUrl = `${window.location.origin}/join`;

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-spin">⏳</div>
          <p className="text-4xl text-white font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">

        {/* LOBBY PHASE */}
        {roomState.phase === 'LOBBY' && (
          <div className="text-center">
            {/* Logo/Title */}
            <div className="mb-12">
              <h1 className="text-8xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-pulse">
                PARTY GAME NIGHT
              </h1>
              <p className="text-3xl text-white font-semibold">Join the game on your phone!</p>
            </div>

            {/* Room Code Display */}
            <div className="relative overflow-hidden mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-16 shadow-2xl border-4 border-cyan-500">
                <div className="text-3xl text-cyan-400 font-bold mb-4 uppercase tracking-wider">Room Code</div>
                <div className="text-9xl font-black tracking-widest text-white mb-8 drop-shadow-lg">
                  {roomCode}
                </div>
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl">
                    <QRCodeSVG value={joinUrl} size={200} />
                  </div>
                </div>
                <div className="text-2xl text-gray-300 font-medium">{joinUrl}</div>
              </div>
            </div>

            {/* Players Grid */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border-4 border-purple-500/50 shadow-2xl">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8">
                PLAYERS ({roomState.players.length})
              </div>
              <div className="grid grid-cols-4 gap-6">
                {roomState.players.map(player => (
                  <div
                    key={player.id}
                    className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-purple-500/50 transform transition-all hover:scale-105"
                  >
                    <div className="text-3xl font-bold text-white">{player.name}</div>
                    {player.status === 'disconnected' && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INPUT PHASE */}
        {roomState.phase === 'INPUT' && (
          <div>
            {roomState.gameType === 'QUIPLASH' ? (
              <QuiplashDisplay roundData={roomState.roundData} phase={roomState.phase} />
            ) : (
              <div className="text-center">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-20 text-center shadow-2xl border-4 border-orange-500/50">
                    <div className="text-9xl mb-8 animate-bounce">✍️</div>
                    <h2 className="text-7xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-400">
                      SPELERS SCHRIJVEN...
                    </h2>
                    <p className="text-4xl text-gray-300 font-semibold">
                      {games.find(g => g.id === roomState.gameType)?.name || roomState.gameType}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VOTE PHASE */}
        {roomState.phase === 'VOTE' && (
          <div>
            {roomState.gameType === 'QUIPLASH' ? (
              <QuiplashDisplay roundData={roomState.roundData} phase={roomState.phase} />
            ) : (
              <div className="text-center">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-20 text-center shadow-2xl border-4 border-cyan-500/50">
                    <div className="text-9xl mb-8">🗳️</div>
                    <h2 className="text-7xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                      STEM OP JE TELEFOON!
                    </h2>
                    <p className="text-4xl text-gray-300 font-semibold">Voting in progress...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVEAL PHASE */}
        {roomState.phase === 'REVEAL' && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-pink-500/10 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 shadow-2xl border-4 border-yellow-500/50">
              <div className="text-center mb-12">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                  RESULTATEN
                </h2>
              </div>
              <RevealPhase gameType={roomState.gameType} roundData={roomState.roundData} />
            </div>
          </div>
        )}

        {/* LEADERBOARD PHASE */}
        {roomState.phase === 'LEADERBOARD' && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 shadow-2xl border-4 border-purple-500/50">
              <div className="text-center mb-12">
                <div className="text-8xl mb-6">🏆</div>
                <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-4">
                  LEADERBOARD
                </h2>
              </div>

              {/* Custom styled leaderboard for display */}
              <div className="space-y-6 max-w-4xl mx-auto">
                {roomState.leaderboard.slice(0, 5).map((player, idx) => (
                  <div
                    key={player.id}
                    className={`relative overflow-hidden rounded-3xl p-8 flex items-center justify-between transform transition-all ${
                      idx === 0
                        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-4 border-yellow-500 scale-110'
                        : idx === 1
                        ? 'bg-gradient-to-r from-gray-400/30 to-gray-500/30 border-4 border-gray-400'
                        : idx === 2
                        ? 'bg-gradient-to-r from-orange-600/30 to-red-600/30 border-4 border-orange-600'
                        : 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-8">
                      <div className={`text-6xl font-black ${
                        idx === 0 ? 'text-yellow-400' :
                        idx === 1 ? 'text-gray-300' :
                        idx === 2 ? 'text-orange-500' :
                        'text-purple-400'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="text-5xl font-bold text-white">{player.name}</div>
                    </div>
                    <div className="text-6xl font-black text-white">{player.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer with room code (always visible) */}
        {roomState.phase !== 'LOBBY' && (
          <div className="fixed bottom-8 right-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl border-2 border-cyan-500/50">
            <div className="text-sm text-cyan-400 font-bold uppercase">Room Code</div>
            <div className="text-4xl font-black text-white tracking-wider">{roomCode}</div>
          </div>
        )}
      </div>
    </div>
  );
}
