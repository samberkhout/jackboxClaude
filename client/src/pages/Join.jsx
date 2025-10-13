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
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join Game</h1>
          <p className="text-gray-400">Enter your name and room code</p>
        </div>

        {!connected && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500 bg-opacity-10 border border-yellow-500 text-yellow-300 text-center">
            Connecting to server...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input w-full"
              maxLength={20}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium mb-2">
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              className="input w-full text-center text-2xl tracking-widest font-bold"
              maxLength={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!connected || loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
