import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function JobJobInput({ question, playerId }) {
  const { submitInput } = useSocket();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    submitInput({ text: text.trim() }, (response) => {
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
          <p className="text-2xl text-gray-300 font-semibold">Building word bank...</p>
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
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">JOB JOB</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 mb-2">
            WRITE YOUR ANSWER!
          </h2>
          <p className="text-gray-400 text-lg">Your words will mix with others!</p>
        </div>

        <div className="mb-8 transform transition-all duration-300">
          <div className="bg-gradient-to-r from-indigo-600/30 to-violet-600/30 rounded-2xl p-6 border-2 border-indigo-500/50 shadow-lg">
            <p className="text-2xl md:text-3xl font-bold text-white text-center leading-relaxed">
              {question}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-violet-600/30 to-purple-600/30 rounded-2xl p-6 border-2 border-violet-500/50 shadow-lg">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a short answer (your words will be mixed with others)"
                className="w-full h-32 px-5 py-4 rounded-xl bg-gray-900/80 border-2 border-indigo-400/50 text-white placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-400/30 transition-all resize-none"
                maxLength={150}
                required
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-400 font-medium">
                  {text.length > 0 ? '💭 Keep it going!' : '✍️ Start typing...'}
                </div>
                <div className={`text-sm font-bold ${text.length > 135 ? 'text-red-400' : 'text-indigo-400'}`}>
                  {text.length}/150
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-6 px-8 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.05] hover:shadow-violet-500/50 active:scale-95 border-4 border-indigo-400/50"
          >
            🚀 SUBMIT
          </button>
        </form>
      </div>
    </div>
  );
}
