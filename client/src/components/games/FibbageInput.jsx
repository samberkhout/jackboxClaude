import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function FibbageInput({ question, playerId }) {
  const { submitInput } = useSocket();
  const [lie, setLie] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!lie.trim()) {
      setError('Please enter your lie');
      return;
    }

    submitInput({ lie: lie.trim() }, (response) => {
      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.error || 'Failed to submit');
      }
    });
  };

  if (submitted) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-green-500/50">
          <div className="text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            LIE SUBMITTED!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Preparing voting...</p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">FIBBAGE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 mb-2">
            WRITE A LIE!
          </h2>
          <p className="text-gray-400 text-lg">Make it believable to fool others!</p>
        </div>

        <div className="mb-8 transform transition-all duration-300">
          <div className="bg-gradient-to-r from-yellow-600/30 to-amber-600/30 rounded-2xl p-6 border-2 border-yellow-500/50 shadow-lg">
            <p className="text-2xl md:text-3xl font-bold text-white text-center leading-relaxed">
              {question}
            </p>
          </div>
        </div>

        <p className="text-center text-lg text-gray-300 mb-6 font-semibold">
          🤥 Write a believable (but fake) answer!
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-amber-600/30 to-orange-600/30 rounded-2xl p-6 border-2 border-amber-500/50 shadow-lg">
              <input
                type="text"
                value={lie}
                onChange={(e) => setLie(e.target.value)}
                placeholder="Your believable lie..."
                className="w-full px-5 py-4 rounded-xl bg-gray-900/80 border-2 border-yellow-400/50 text-white placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/30 transition-all"
                maxLength={50}
                required
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-400 font-medium">
                  {lie.length > 0 ? '🤔 Nice one!' : '✍️ Start typing...'}
                </div>
                <div className={`text-sm font-bold ${lie.length > 45 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {lie.length}/50
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-6 px-8 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-600 hover:via-amber-600 hover:to-orange-600 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.05] hover:shadow-orange-500/50 active:scale-95 border-4 border-yellow-400/50"
          >
            🚀 SUBMIT LIE
          </button>
        </form>
      </div>
    </div>
  );
}
