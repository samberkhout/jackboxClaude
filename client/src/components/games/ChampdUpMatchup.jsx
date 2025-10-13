import { useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function ChampdUpMatchup({ champions, playerId }) {
  const { submitInput } = useSocket();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [championIdx, setChampionIdx] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Filter out own champion
  const availableChampions = champions.filter((c, idx) => c.playerId !== playerId ? idx : null).filter(idx => idx !== null);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#11111b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (championIdx === null) {
      setError('Please select a champion to challenge');
      return;
    }

    const drawing = canvasRef.current.toDataURL();

    submitInput({ championIdx, drawing }, (response) => {
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
            CHALLENGER DRAWN!
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-emerald-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">CHAMP'D UP</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 mb-2">
            DRAW A CHALLENGER!
          </h2>
          <p className="text-gray-400 text-lg">Pick a champion to challenge!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="transform transition-all duration-300">
            <div className="bg-gradient-to-r from-emerald-600/30 to-green-600/30 rounded-2xl p-6 border-2 border-emerald-500/50 shadow-lg">
              <label className="block text-xl font-bold text-white mb-4">⚔️ Select a champion to challenge:</label>
              <div className="grid grid-cols-2 gap-4">
                {champions.map((champion, idx) => {
                  if (champion.playerId === playerId) return null;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setChampionIdx(idx)}
                      className={`p-4 rounded-xl border-3 transition-all duration-300 transform hover:scale-[1.05] ${
                        championIdx === idx
                          ? 'border-teal-400 bg-teal-500/40 shadow-lg shadow-teal-500/50'
                          : 'border-emerald-400/50 bg-gray-900/50 hover:border-teal-400 hover:bg-teal-500/20'
                      }`}
                    >
                      <img src={champion.drawing} alt={champion.name} className="w-full rounded-lg mb-2 border-2 border-emerald-400/30" />
                      <div className="text-sm font-black text-center text-white">{champion.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {championIdx !== null && (
            <div className="transform transition-all duration-300 hover:scale-[1.02]">
              <div className="bg-gradient-to-r from-green-600/30 to-teal-600/30 rounded-2xl p-6 border-2 border-green-500/50 shadow-lg">
                <label className="block text-xl font-bold text-white mb-4">🎨 Draw your challenger:</label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="w-full border-4 border-teal-400/50 rounded-xl touch-none shadow-lg"
                  style={{ backgroundColor: '#11111b' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="mt-4 w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white text-lg font-bold rounded-xl border-2 border-gray-600 transition-all duration-300 hover:scale-[1.02]"
                >
                  🗑️ Clear Canvas
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={championIdx === null}
            className={`w-full py-6 px-8 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 border-4 ${
              championIdx === null
                ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 hover:scale-[1.05] hover:shadow-teal-500/50 active:scale-95 border-emerald-400/50'
            }`}
          >
            🚀 SUBMIT CHALLENGER
          </button>
        </form>
      </div>
    </div>
  );
}
