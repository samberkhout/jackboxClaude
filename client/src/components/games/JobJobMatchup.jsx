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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-green-500/50">
          <div className="text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            ANSWER CREATED!
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
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-indigo-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">JOB JOB</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 mb-2">
            BUILD YOUR ANSWER!
          </h2>
          <p className="text-gray-400 text-lg">Tap words from the bank to create your answer!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-indigo-600/30 to-violet-600/30 rounded-2xl p-6 border-2 border-indigo-500/50 shadow-lg min-h-[100px]">
              <div className="text-sm text-indigo-300 mb-3 font-bold">💬 Your answer:</div>
              <div className="text-2xl font-bold text-white">
                {selectedWords.length > 0 ? selectedWords.join(' ') : 'Select words below...'}
              </div>
            </div>
          </div>

          <div className="transform transition-all duration-300">
            <div className="bg-gradient-to-r from-violet-600/30 to-purple-600/30 rounded-2xl p-6 border-2 border-violet-500/50 shadow-lg">
              <div className="text-sm text-violet-300 mb-4 font-bold">📝 Word Bank:</div>
              <div className="flex flex-wrap gap-3">
                {wordBank.map((word, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleWord(word)}
                    className={`px-5 py-3 rounded-xl border-3 transition-all duration-300 transform hover:scale-[1.05] font-bold text-lg ${
                      selectedWords.includes(word)
                        ? 'border-purple-400 bg-purple-500/40 text-white shadow-lg shadow-purple-500/50'
                        : 'border-indigo-400/50 bg-gray-900/50 text-gray-300 hover:border-purple-400 hover:bg-purple-500/20'
                    }`}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-6 px-8 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.05] hover:shadow-purple-500/50 active:scale-95 border-4 border-indigo-400/50"
          >
            🚀 SUBMIT ANSWER
          </button>
        </form>
      </div>
    </div>
  );
}
