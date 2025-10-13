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
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Combo Created!</h2>
        <p className="text-gray-400">Waiting for voting...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Your T-Shirt</h2>
      <p className="text-center text-gray-400 mb-6">
        Pick a drawing and slogan (not yours!)
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select a drawing:</label>
          <div className="grid grid-cols-2 gap-2">
            {availableDrawings.map((drawing, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDrawingIdx(idx)}
                className={`p-2 rounded-lg border-2 transition-all ${
                  drawingIdx === idx
                    ? 'border-primary bg-primary bg-opacity-20'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <img src={drawing.data} alt="Drawing" className="w-full rounded" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select a slogan:</label>
          <div className="space-y-2">
            {availableSlogans.map((slogan, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSloganIdx(idx)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  sloganIdx === idx
                    ? 'border-primary bg-primary bg-opacity-20'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                {slogan.text}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={drawingIdx === null || sloganIdx === null}
          className="btn btn-primary w-full"
        >
          Create T-Shirt
        </button>
      </form>
    </div>
  );
}
