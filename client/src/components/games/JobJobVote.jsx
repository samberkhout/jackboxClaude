import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function JobJobVote({ answers, playerId }) {
  const { submitVote } = useSocket();
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  // Filter out own answer
  const votableAnswers = answers.filter(a => a.playerId !== playerId);

  const handleVote = (targetId) => {
    setError('');

    submitVote(targetId, 'vote', (response) => {
      if (response.success) {
        setVoted(true);
      } else {
        setError(response.error || 'Failed to vote');
      }
    });
  };

  if (voted) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-green-500/50">
          <div className="text-8xl mb-6 animate-bounce">🗳️</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            VOTE RECORDED!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Waiting for results...</p>
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
            VOTE FOR THE BEST!
          </h2>
          <p className="text-gray-400 text-lg">Pick the funniest answer!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          {votableAnswers.map((answer) => (
            <button
              key={answer.playerId}
              onClick={() => handleVote(answer.playerId)}
              className="w-full p-6 rounded-2xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border-4 border-indigo-400/50 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-purple-500/50 text-left"
            >
              <div className="text-xl md:text-2xl font-bold text-white">{answer.text}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center text-lg text-gray-400 font-semibold">
          👆 Tap an answer to vote
        </div>
      </div>
    </div>
  );
}
