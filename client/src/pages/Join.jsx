import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Join() {
  const navigate = useNavigate();
  const { joinRoom, connected } = useSocket();

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved name from localStorage
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
    if (session.name) {
      setName(session.name);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (roomCode.length !== 4) {
      setError('Room code must be 4 characters');
      return;
    }

    setLoading(true);

    joinRoom(
      {
        name: name.trim(),
        roomCode: roomCode.toUpperCase().trim(),
        role: 'PLAYER'
      },
      (response) => {
        setLoading(false);
        if (response.success) {
          navigate('/play');
        } else {
          setError(response.error || 'Failed to join room');
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>

      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
            JOIN GAME
          </h1>
          <p className="text-xl text-gray-300 font-semibold">Enter your name and room code</p>
        </div>

        {!connected && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500/20 border-3 border-yellow-500 text-yellow-200 text-center text-lg font-bold animate-pulse">
            🔌 Connecting to server...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-purple-500/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-6 border-2 border-purple-500/50 shadow-lg">
                  <label htmlFor="name" className="block text-xl font-bold text-white mb-3">
                    👤 Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-5 py-4 rounded-xl bg-gray-900/80 border-2 border-purple-400/50 text-white placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/30 transition-all"
                    maxLength={20}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="transform transition-all duration-300 hover:scale-[1.02]">
                <div className="bg-gradient-to-r from-pink-600/30 to-orange-600/30 rounded-2xl p-6 border-2 border-pink-500/50 shadow-lg">
                  <label htmlFor="roomCode" className="block text-xl font-bold text-white mb-3">
                    🎮 Room Code
                  </label>
                  <input
                    id="roomCode"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    className="w-full px-5 py-4 rounded-xl bg-gray-900/80 border-2 border-pink-400/50 text-white placeholder-gray-500 text-3xl font-black text-center tracking-widest focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/30 transition-all"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!connected || loading}
                className="w-full py-6 px-8 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.05] hover:shadow-pink-500/50 active:scale-95 border-4 border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? '🔄 JOINING...' : '🚀 JOIN GAME'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg transition-all duration-300 hover:scale-[1.05] border-2 border-gray-600"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
