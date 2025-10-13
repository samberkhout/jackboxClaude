import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Landing() {
  const navigate = useNavigate();
  const { createRoom, connected } = useSocket();

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

  const handleJoinGame = () => {
    navigate('/join');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>

      <div className="relative max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-7xl md:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 animate-pulse">
            PARTY GAME NIGHT
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-bold">
            One web app to run your entire party game night!
          </p>
        </div>

        {/* Connection Status */}
        {!connected && (
          <div className="mb-8 p-4 rounded-2xl bg-yellow-500/20 border-3 border-yellow-500 text-yellow-200 text-center text-lg font-bold animate-pulse">
            🔌 Connecting to server...
          </div>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <button
            onClick={handleHostGame}
            disabled={!connected}
            className="group relative overflow-hidden transform transition-all duration-300 hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 group-hover:from-blue-500/30 group-hover:via-cyan-500/30 group-hover:to-teal-500/30 transition-all"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 shadow-2xl border-4 border-blue-500/50 group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/30">
              <div className="text-center">
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">🎮</div>
                <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  HOST GAME
                </h2>
                <p className="text-lg text-gray-300 font-semibold">
                  Create a new room and control the game from your TV or projector
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleJoinGame}
            disabled={!connected}
            className="group relative overflow-hidden transform transition-all duration-300 hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 group-hover:from-purple-500/30 group-hover:via-pink-500/30 group-hover:to-rose-500/30 transition-all"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 shadow-2xl border-4 border-purple-500/50 group-hover:border-pink-500/50 group-hover:shadow-pink-500/30">
              <div className="text-center">
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">📱</div>
                <h2 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  JOIN GAME
                </h2>
                <p className="text-lg text-gray-300 font-semibold">
                  Enter a room code and play from your phone
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* How It Works */}
        <div className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10"></div>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-emerald-500/50">
            <div className="text-center mb-8">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-4">
                <span className="text-white font-black text-sm tracking-widest">HOW IT WORKS</span>
              </div>
              <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                GET STARTED IN 3 STEPS
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-emerald-600/30 to-green-600/30 rounded-2xl p-6 border-2 border-emerald-500/50 text-center transform transition-all duration-300 hover:scale-[1.05]">
                <div className="text-6xl mb-4">1️⃣</div>
                <h4 className="text-2xl font-black mb-3 text-white">Host Creates Room</h4>
                <p className="text-gray-300 font-semibold">
                  Display the room code on your TV or projector
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-600/30 to-teal-600/30 rounded-2xl p-6 border-2 border-green-500/50 text-center transform transition-all duration-300 hover:scale-[1.05]">
                <div className="text-6xl mb-4">2️⃣</div>
                <h4 className="text-2xl font-black mb-3 text-white">Players Join</h4>
                <p className="text-gray-300 font-semibold">
                  Everyone enters the code on their phones
                </p>
              </div>
              <div className="bg-gradient-to-r from-teal-600/30 to-cyan-600/30 rounded-2xl p-6 border-2 border-teal-500/50 text-center transform transition-all duration-300 hover:scale-[1.05]">
                <div className="text-6xl mb-4">3️⃣</div>
                <h4 className="text-2xl font-black mb-3 text-white">Play & Laugh</h4>
                <p className="text-gray-300 font-semibold">
                  Multiple rounds of hilarious party games
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Games */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10"></div>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500/50">
            <div className="text-center mb-6">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4">
                <span className="text-white font-black text-sm tracking-widest">AVAILABLE GAMES</span>
              </div>
              <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                6 AWESOME GAMES
              </h3>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {['Quiplash', 'Tee K.O.', 'Job Job', "Champ'd Up", 'Trivia Murder Party', 'Fibbage'].map(game => (
                <span
                  key={game}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 text-yellow-300 text-lg font-black transform transition-all duration-300 hover:scale-[1.1] hover:shadow-lg hover:shadow-yellow-500/30"
                >
                  {game}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
