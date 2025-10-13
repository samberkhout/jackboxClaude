import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Landing() {
  const navigate = useNavigate();
  const { createRoom, connected } = useSocket();
  const [searchParams] = useSearchParams();
  const displayRoomParam = searchParams.get('displayRoom');

  const handleHostGame = () => {
    createRoom((response) => {
      if (response.success) {
        localStorage.setItem('gameSession', JSON.stringify({
          roomCode: response.roomCode,
          role: 'HOST'
        }));
        navigate('/host');
      }
    });
  };

  const handleDisplayGame = () => {
    createRoom((response) => {
      if (response.success) {
        localStorage.setItem('gameSession', JSON.stringify({
          roomCode: response.roomCode,
          role: 'DISPLAY'
        }));
        navigate('/display');
      }
    });
  };

  const handleJoinGame = () => {
    navigate('/join');
  };

  useEffect(() => {
    if (displayRoomParam) {
      navigate(`/display?roomCode=${displayRoomParam}`);
    }
  }, [navigate, displayRoomParam]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Party Game Night
          </h1>
          <p className="text-xl text-gray-400">
            One web app to run your entire party game night
          </p>
        </div>

        {/* Connection Status */}
        {!connected && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500 bg-opacity-10 border border-yellow-500 text-yellow-300 text-center">
            Connecting to server...
          </div>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={handleHostGame}
            disabled={!connected}
            className="card hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold mb-2">Host Control</h2>
              <p className="text-gray-400">
                Control panel to manage the game
              </p>
            </div>
          </button>
          <button
            onClick={handleJoinGame}
            disabled={!connected}
            className="card hover:scale-105 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <h2 className="text-2xl font-bold mb-2">Join Game</h2>
              <p className="text-gray-400">
                Play from your phone
              </p>
            </div>
          </button>
        </div>

        {/* How It Works */}
        <div className="card">
          <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">1️⃣</div>
              <h4 className="font-bold mb-2">Host Creates Room</h4>
              <p className="text-sm text-gray-400">
                Display the room code on your TV or projector
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">2️⃣</div>
              <h4 className="font-bold mb-2">Players Join</h4>
              <p className="text-sm text-gray-400">
                Everyone enters the code on their phones
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">3️⃣</div>
              <h4 className="font-bold mb-2">Play & Laugh</h4>
              <p className="text-sm text-gray-400">
                Multiple rounds of hilarious party games
              </p>
            </div>
          </div>
        </div>

        {/* Available Games */}
        <div className="mt-8 card">
          <h3 className="text-xl font-bold mb-4">Available Games</h3>
          <div className="flex flex-wrap gap-2">
            {['Quiplash', 'Tee K.O.', 'Job Job', "Champ'd Up", 'Trivia Murder Party', 'Fibbage'].map(game => (
              <span key={game} className="px-3 py-1 rounded-full bg-primary bg-opacity-20 text-primary text-sm">
                {game}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
