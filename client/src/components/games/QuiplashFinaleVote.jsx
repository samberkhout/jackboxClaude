import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';

export default function QuiplashFinaleVote({ finaleAnswers = [], playerId, finaleVotes = {}, totalPlayers = 0 }) {
  const { socket } = useSocket();
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  // Calculate voting progress
  const voteCount = Object.keys(finaleVotes).length;
  const voteProgress = totalPlayers > 0 ? `${voteCount}/${totalPlayers}` : '';

  const handleToggleAnswer = (answer) => {
    // Can't vote for yourself
    if (answer.playerId === playerId) {
      setError('Je kunt niet op jezelf stemmen!');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');

    if (selectedAnswers.find(a => a.playerId === answer.playerId)) {
      // Deselect
      setSelectedAnswers(selectedAnswers.filter(a => a.playerId !== answer.playerId));
    } else {
      // Select (max 3)
      if (selectedAnswers.length >= 3) {
        setError('Je kunt maximaal 3 antwoorden kiezen!');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setSelectedAnswers([...selectedAnswers, answer]);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswers.length === 0) {
      setError('Kies minstens 1 antwoord!');
      return;
    }

    setError('');

    // Submit votes
    const votes = selectedAnswers.map(a => a.playerId);
    socket.emit('submitFinaleVote', { votes }, (response) => {
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
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-yellow-500/50">
          <div className="text-8xl mb-6 animate-pulse">🗳️</div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
            GESTEMD!
          </h2>
          <p className="text-2xl text-gray-300 font-semibold">Wachten op anderen...</p>
          {voteProgress && (
            <div className="mt-6">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border-2 border-cyan-500/50">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {voteProgress}
                </span>
                <span className="text-lg text-gray-300 font-semibold">spelers gestemd</span>
              </div>
              <div className="mt-4 max-w-md mx-auto bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${totalPlayers > 0 ? (voteCount / totalPlayers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-cyan-500/50">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4">
            <span className="text-white font-black text-sm tracking-widest">🏆 THE LAST LASH 🏆</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-2">
            STEM OP JE TOP 3!
          </h2>
          <p className="text-cyan-400 text-lg font-bold">
            Geselecteerd: {selectedAnswers.length}/3
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border-3 border-red-500 text-red-200 text-center text-lg font-bold animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Answers Grid */}
        <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
          {finaleAnswers.map((answer, idx) => {
            const isSelected = selectedAnswers.find(a => a.playerId === answer.playerId);
            const isOwnAnswer = answer.playerId === playerId;
            const selectionNumber = isSelected ? selectedAnswers.findIndex(a => a.playerId === answer.playerId) + 1 : null;

            return (
              <button
                key={idx}
                onClick={() => handleToggleAnswer(answer)}
                disabled={isOwnAnswer}
                className={`group relative w-full p-6 rounded-2xl transition-all duration-300 transform ${
                  isOwnAnswer
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-95 cursor-pointer'
                }`}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3))'
                    : isOwnAnswer
                    ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(75, 85, 99, 0.3))'
                    : 'linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.8))',
                  border: isSelected
                    ? '4px solid rgb(34, 197, 94)'
                    : isOwnAnswer
                    ? '3px solid rgba(107, 114, 128, 0.5)'
                    : '3px solid rgba(168, 85, 247, 0.3)',
                  boxShadow: isSelected ? '0 0 40px rgba(34, 197, 94, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}
              >
                {isSelected && (
                  <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg animate-pulse">
                    {selectionNumber}
                  </div>
                )}
                {isOwnAnswer && (
                  <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                    👤
                  </div>
                )}
                <div className={isSelected || isOwnAnswer ? 'pl-16 text-left' : 'text-left'}>
                  <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                    {answer.answer}
                  </p>
                  {isOwnAnswer && (
                    <p className="text-sm text-gray-400 mt-2">Dit is jouw antwoord</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
          className={`w-full py-6 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white text-2xl font-black rounded-2xl shadow-2xl transform transition-all duration-300 border-4 border-green-400/50 ${
            selectedAnswers.length === 0
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-[1.05] hover:shadow-green-500/50 active:scale-95'
          }`}
        >
          ✅ VERSTUUR STEMMEN ({selectedAnswers.length}/3)
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm font-medium">
            💡 Tip: Kies de 3 grappigste antwoorden!
          </p>
        </div>
      </div>
    </div>
  );
}
