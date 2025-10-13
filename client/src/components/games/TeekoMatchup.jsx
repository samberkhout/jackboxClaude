import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function TeekoMatchup({ drawings, slogans, playerId }) {
  const { submitInput } = useSocket();
  const [drawingIdx, setDrawingIdx] = useState(null);
  const [sloganIdx, setSloganIdx] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Filter out own submissions
  const availableDrawings = drawings.filter(d => d.playerId !== playerId);
  const availableSlogans = slogans.filter(s => s.playerId !== playerId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (drawingIdx === null || sloganIdx === null) {
      setError('Please select both a drawing and a slogan');
      return;
    }

    submitInput({ drawingIdx, sloganIdx }, (response) => {
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
            COMBO CREATED!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Waiting for voting...</p>
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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-purple-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">TEE K.O.</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 mb-2">
            CREATE YOUR COMBO!
          </h2>
          <p className="text-gray-400 text-lg">Pick a drawing and slogan (not yours!)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="transform transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-6 border-2 border-purple-500/50 shadow-lg">
              <label className="block text-xl font-bold text-white mb-4">🎨 Select a drawing:</label>
              <div className="grid grid-cols-2 gap-4">
                {availableDrawings.map((drawing, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDrawingIdx(idx)}
                    className={`p-3 rounded-xl border-4 transition-all duration-300 transform hover:scale-[1.05] ${
                      drawingIdx === idx
                        ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/50'
                        : 'border-gray-700 hover:border-purple-500/50'
                    }`}
                  >
                    <img src={drawing.data} alt="Drawing" className="w-full rounded-lg" />
                    {drawingIdx === idx && (
                      <div className="mt-2 text-center text-purple-400 font-bold text-sm">
                        ✓ Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="transform transition-all duration-300">
            <div className="bg-gradient-to-r from-pink-600/30 to-rose-600/30 rounded-2xl p-6 border-2 border-pink-500/50 shadow-lg">
              <label className="block text-xl font-bold text-white mb-4">✨ Select a slogan:</label>
              <div className="space-y-3">
                {availableSlogans.map((slogan, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSloganIdx(idx)}
                    className={`w-full p-4 rounded-xl border-4 transition-all duration-300 text-left transform hover:scale-[1.02] ${
                      sloganIdx === idx
                        ? 'border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/50'
                        : 'border-gray-700 hover:border-pink-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{slogan.text}</span>
                      {sloganIdx === idx && (
                        <span className="text-pink-400 font-bold">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={drawingIdx === null || sloganIdx === null}
            className="w-full py-6 px-8 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.05] hover:shadow-pink-500/50 active:scale-95 border-4 border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            🚀 CREATE T-SHIRT
          </button>
        </form>
      </div>
    </div>
  );
}
