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
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Submitted!</h2>
        <p className="text-gray-400">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Tee K.O.</h2>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Draw something:</label>
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

        <div>
          <label className="block text-sm font-medium mb-2">Write a slogan:</label>
          <input
            type="text"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="Something catchy..."
            className="input w-full"
            maxLength={40}
            required
          />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {slogan.length}/40
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Submit
        </button>
      </form>
    </div>
  );
}
