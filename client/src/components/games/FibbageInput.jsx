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
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Lie Submitted!</h2>
        <p className="text-gray-400">Preparing voting...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Fibbage</h2>
      <p className="text-center text-lg mb-6">{question}</p>
      <p className="text-center text-sm text-gray-400 mb-6">
        Write a believable (but fake) answer to fool other players!
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={lie}
          onChange={(e) => setLie(e.target.value)}
          placeholder="Your believable lie..."
          className="input w-full"
          maxLength={50}
          required
        />
        <div className="text-xs text-gray-500 text-right">{lie.length}/50</div>
        <button type="submit" className="btn btn-primary w-full">
          Submit Lie
        </button>
      </form>
    </div>
  );
}
