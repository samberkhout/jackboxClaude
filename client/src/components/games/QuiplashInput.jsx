import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function QuiplashInput({ prompts, playerId }) {
  const { submitInput } = useSocket();
  const [answers, setAnswers] = useState(['', '']);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!answers[0].trim() || !answers[1].trim()) {
      setError('Please answer both prompts');
      return;
    }

    submitInput({ answers }, (response) => {
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
      <h2 className="text-2xl font-bold mb-4 text-center">Answer the Prompts</h2>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {prompts.map((prompt, idx) => (
          <div key={idx}>
            <label className="block text-sm font-medium mb-2">
              Prompt {idx + 1}: {prompt}
            </label>
            <textarea
              value={answers[idx]}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[idx] = e.target.value;
                setAnswers(newAnswers);
              }}
              placeholder="Type your funny answer..."
              className="input w-full h-24 resize-none"
              maxLength={100}
              required
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {answers[idx].length}/100
            </div>
          </div>
        ))}
        <button type="submit" className="btn btn-primary w-full">
          Submit Answers
        </button>
      </form>
    </div>
  );
}
