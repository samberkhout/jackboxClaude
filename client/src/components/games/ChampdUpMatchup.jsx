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
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Challenger Drawn!</h2>
        <p className="text-gray-400">Waiting for voting...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Draw a Challenger</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select a champion to challenge:</label>
          <div className="grid grid-cols-2 gap-2">
            {champions.map((champion, idx) => {
              if (champion.playerId === playerId) return null;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setChampionIdx(idx)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    championIdx === idx
                      ? 'border-primary bg-primary bg-opacity-20'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <img src={champion.drawing} alt={champion.name} className="w-full rounded mb-1" />
                  <div className="text-sm font-medium text-center">{champion.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {championIdx !== null && (
          <div>
            <label className="block text-sm font-medium mb-2">Draw your challenger:</label>
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="w-full border-2 border-gray-700 rounded-lg touch-none"
              style={{ backgroundColor: '#11111b' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <button type="button" onClick={clearCanvas} className="btn btn-outline mt-2 w-full">
              Clear
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={championIdx === null}
          className="btn btn-primary w-full"
        >
          Submit Challenger
        </button>
      </form>
    </div>
  );
}
