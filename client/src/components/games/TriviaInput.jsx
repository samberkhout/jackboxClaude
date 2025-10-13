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
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Answers Submitted!</h2>
        <p className="text-gray-400">Checking results...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Trivia Murder Party</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="p-4 bg-dark-100 rounded-lg">
            <div className="font-medium mb-3">{q.question}</div>
            <div className="space-y-2">
              {q.options.map((option, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleAnswer(qIdx, oIdx)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    answers[qIdx] === oIdx
                      ? 'border-primary bg-primary bg-opacity-20'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={answers.length < questions.length}
          className="btn btn-primary w-full"
        >
          Submit Answers
        </button>
      </form>
    </div>
  );
}
