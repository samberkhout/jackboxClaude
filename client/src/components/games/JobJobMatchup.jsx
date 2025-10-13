import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function JobJobMatchup({ wordBank, playerId }) {
  const { submitInput } = useSocket();
  const [selectedWords, setSelectedWords] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const toggleWord = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (selectedWords.length === 0) {
      setError('Please select at least one word');
      return;
    }

    const text = selectedWords.join(' ');
    submitInput({ text }, (response) => {
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
        <h2 className="text-2xl font-bold mb-2">Answer Created!</h2>
        <p className="text-gray-400">Waiting for voting...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Build Your Answer</h2>
      <p className="text-center text-gray-400 mb-6">
        Tap words from the bank to build your answer
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 bg-dark-100 rounded-lg min-h-[80px]">
          <div className="text-sm text-gray-400 mb-2">Your answer:</div>
          <div className="text-lg">
            {selectedWords.length > 0 ? selectedWords.join(' ') : 'Select words below...'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {wordBank.map((word, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleWord(word)}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                selectedWords.includes(word)
                  ? 'border-primary bg-primary bg-opacity-20'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              {word}
            </button>
          ))}
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Submit Answer
        </button>
      </form>
    </div>
  );
}
