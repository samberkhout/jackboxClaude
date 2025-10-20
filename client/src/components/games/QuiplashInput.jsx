import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function QuiplashInput({ prompts, playerId, players = [] }) {
  const { submitInput } = useSocket();
  const [answers, setAnswers] = useState(['', '']);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isFinale = prompts.length === 1;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate based on number of prompts
    if (isFinale) {
      if (!answers[0].trim()) {
        setError('Vul je antwoord in!');
        return;
      }
    } else {
      if (!answers[0].trim() || !answers[1].trim()) {
        setError('Vul beide vragen in!');
        return;
      }
    }

    submitInput({ answers }, (response) => {
      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.error || 'Failed to submit');
      }
    });
  };

  // Calculate submission progress
  const submittedCount = players.filter(p => p.status === 'submitted').length;
  const totalPlayers = players.length;
  const submissionProgress = `${submittedCount}/${totalPlayers}`;

  if (submitted) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-green-500/50">
          <div className="text-8xl mb-6 animate-bounce">✅</div>
          <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            VERSTUURD!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Wachten op andere spelers...</p>
          {totalPlayers > 0 && (
            <div className="mt-6">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border-2 border-cyan-500/50">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {submissionProgress}
                </span>
                <span className="text-lg text-gray-300 font-semibold">spelers klaar</span>
              </div>
              <div className="mt-4 max-w-md mx-auto bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${totalPlayers > 0 ? (submittedCount / totalPlayers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
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
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-pink-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-orange-500/50">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">
              {isFinale ? '🏆 THE LAST LASH 🏆' : 'QUIPLASH'}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-400 mb-2">
            {isFinale ? 'DE FINALE VRAAG!' : 'BEANTWOORD DE VRAGEN!'}
          </h2>
          <p className="text-gray-400 text-lg">
            {isFinale ? 'Dit is je moment! Geef je allerbeste antwoord!' : 'Wees grappig. Wees creatief. Wees jezelf.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {prompts.map((prompt, idx) => (
            <div key={idx} className="transform transition-all duration-300 hover:scale-[1.02]">
              <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-6 border-2 border-purple-500/50 shadow-lg">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                      {prompt}
                    </p>
                  </div>
                </div>
                <textarea
                  value={answers[idx]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[idx] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  placeholder="Type hier je hilarische antwoord..."
                  className="w-full h-32 px-5 py-4 rounded-xl bg-gray-900/80 border-2 border-purple-400/50 text-white placeholder-gray-500 text-lg font-medium focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/30 transition-all resize-none"
                  maxLength={100}
                  required
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="text-sm text-gray-400 font-medium">
                    {answers[idx].length > 0 ? '💭 Goed bezig!' : '✍️ Begin met typen...'}
                  </div>
                  <div className={`text-sm font-bold ${answers[idx].length > 90 ? 'text-red-400' : 'text-purple-400'}`}>
                    {answers[idx].length}/100
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="w-full py-6 px-8 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 hover:from-orange-600 hover:via-pink-600 hover:to-purple-600 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.05] hover:shadow-orange-500/50 active:scale-95 border-4 border-orange-400/50"
          >
            🚀 VERSTUUR ANTWOORDEN
          </button>
        </form>
      </div>
    </div>
  );
}
