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
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Submitted!</h2>
        <p className="text-gray-400">Building word bank...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">Job Job</h2>
      <p className="text-center text-lg mb-6">{question}</p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500 text-red-300 text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a short answer (your words will be mixed with others)"
          className="input w-full h-32 resize-none"
          maxLength={150}
          required
        />
        <div className="text-xs text-gray-500 text-right">{text.length}/150</div>
        <button type="submit" className="btn btn-primary w-full">
          Submit
        </button>
      </form>
    </div>
  );
}
