import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function TriviaInput({ questions, playerId }) {
  const { submitInput } = useSocket();
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleAnswer = (questionIdx, optionIdx) => {
    const newAnswers = [...answers];
    newAnswers[questionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (answers.length < questions.length) {
      setError('Please answer all questions');
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
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-green-500/50">
          <div className="text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            ANSWERS SUBMITTED!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Checking results...</p>
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
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-red-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">TRIVIA MURDER PARTY</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 mb-2">
            ANSWER THE QUESTIONS!
          </h2>
          <p className="text-gray-400 text-lg">Get them right or face the consequences!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="transform transition-all duration-300 hover:scale-[1.02]">
              <div className="bg-gradient-to-r from-red-600/30 to-rose-600/30 rounded-2xl p-6 border-2 border-red-500/50 shadow-lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {qIdx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                      {q.question}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {q.options.map((option, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleAnswer(qIdx, oIdx)}
                      className={`w-full p-4 rounded-xl border-3 transition-all duration-300 transform hover:scale-[1.02] text-left font-semibold text-lg ${
                        answers[qIdx] === oIdx
                          ? 'border-pink-400 bg-pink-500/40 text-white shadow-lg shadow-pink-500/50'
                          : 'border-red-400/50 bg-gray-900/50 text-gray-300 hover:border-rose-400 hover:bg-rose-500/20'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {answers[qIdx] !== undefined && (
                  <div className="mt-3 text-sm text-green-400 font-bold">
                    ✅ Answer selected!
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={answers.length < questions.length}
            className={`w-full py-6 px-8 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 border-4 ${
              answers.length < questions.length
                ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:via-rose-600 hover:to-pink-600 hover:scale-[1.05] hover:shadow-pink-500/50 active:scale-95 border-red-400/50'
            }`}
          >
            🚀 SUBMIT ANSWERS
          </button>
        </form>
      </div>
    </div>
  );
}
