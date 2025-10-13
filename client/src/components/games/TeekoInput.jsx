import { useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function TeekoInput({ playerId }) {
  const { submitInput } = useSocket();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [slogan, setSlogan] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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

    if (!slogan.trim()) {
      setError('Please enter a slogan');
      return;
    }

    const drawing = canvasRef.current.toDataURL();

    submitInput({ drawing, slogan: slogan.trim() }, (response) => {
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
            SUBMITTED!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Waiting for other players...</p>
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-blue-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">TEE K.O.</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 mb-2">
            CREATE YOUR T-SHIRT!
          </h2>
          <p className="text-gray-400 text-lg">Draw a design and write a slogan!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-2xl p-6 border-2 border-blue-500/50 shadow-lg">
              <label className="block text-xl font-bold text-white mb-4">🎨 Draw your design:</label>
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="w-full border-4 border-cyan-400/50 rounded-xl touch-none shadow-lg"
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

          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-cyan-600/30 to-teal-600/30 rounded-2xl p-6 border-2 border-cyan-500/50 shadow-lg">
              <label className="block text-xl font-bold text-white mb-4">✨ Write a slogan:</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Something catchy and hilarious..."
                className="w-full px-5 py-4 rounded-xl bg-gray-900/80 border-2 border-cyan-400/50 text-white placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/30 transition-all"
                maxLength={40}
                required
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-400 font-medium">
                  {slogan.length > 0 ? '💭 Looking good!' : '✍️ Start typing...'}
                </div>
                <div className={`text-sm font-bold ${slogan.length > 35 ? 'text-red-400' : 'text-cyan-400'}`}>
                  {slogan.length}/40
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-6 px-8 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.05] hover:shadow-cyan-500/50 active:scale-95 border-4 border-blue-400/50"
          >
            🚀 SUBMIT T-SHIRT
          </button>
        </form>
      </div>
    </div>
  );
}
