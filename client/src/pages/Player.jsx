import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import QuiplashInput from '../components/games/QuiplashInput';
import QuiplashVote from '../components/games/QuiplashVote';
import TeekoInput from '../components/games/TeekoInput';
import TeekoMatchup from '../components/games/TeekoMatchup';
import TeekoVote from '../components/games/TeekoVote';
import JobJobInput from '../components/games/JobJobInput';
import JobJobMatchup from '../components/games/JobJobMatchup';
import JobJobVote from '../components/games/JobJobVote';
import ChampdUpInput from '../components/games/ChampdUpInput';
import ChampdUpMatchup from '../components/games/ChampdUpMatchup';
import ChampdUpVote from '../components/games/ChampdUpVote';
import TriviaInput from '../components/games/TriviaInput';
import FibbageInput from '../components/games/FibbageInput';
import FibbageVote from '../components/games/FibbageVote';
import Leaderboard from '../components/Leaderboard';

export default function Player() {
  const navigate = useNavigate();
  const { roomState } = useSocket();
  const [playerInfo, setPlayerInfo] = useState(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
    if (!session.roomCode || !session.playerId) {
      navigate('/join');
      return;
    }
    setPlayerInfo(session);
  }, [navigate]);

  if (!roomState || !playerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl">Connecting...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = roomState.players.find(p => p.id === playerInfo.playerId);

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-400">Player</div>
            <div className="text-xl font-bold">{playerInfo.name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Room</div>
            <div className="text-xl font-bold tracking-wider">{playerInfo.roomCode}</div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="phase-badge bg-primary text-white text-xs">
            {roomState.phase}
          </span>
          {currentPlayer && (
            <div className="text-2xl font-bold">
              Score: {currentPlayer.score || 0}
            </div>
          )}
        </div>
      </div>

      {/* Phase Content */}
      <div className="max-w-2xl mx-auto">
        {roomState.phase === 'LOBBY' && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-2">Waiting to Start</h2>
            <p className="text-gray-400">The host will start the game soon...</p>
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">Players in room:</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {roomState.players.map(p => (
                  <span key={p.id} className="px-3 py-1 rounded-full bg-dark-100 text-sm">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INPUT PHASE */}
        {roomState.phase === 'INPUT' && (
          <>
            {roomState.gameType === 'QUIPLASH' && (
              <QuiplashInput
                prompts={roomState.roundData.prompts?.[playerInfo.playerId] || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'TEEKO' && <TeekoInput playerId={playerInfo.playerId} />}
            {roomState.gameType === 'JOBJOB' && (
              <JobJobInput
                question={roomState.roundData.question}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'CHAMPDUP' && <ChampdUpInput playerId={playerInfo.playerId} />}
            {roomState.gameType === 'TRIVIA' && (
              <TriviaInput
                questions={roomState.roundData.questions || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'FIBBAGE' && (
              <FibbageInput
                question={roomState.roundData.question}
                playerId={playerInfo.playerId}
              />
            )}
          </>
        )}

        {/* MATCHUP PHASE */}
        {roomState.phase === 'MATCHUP' && (
          <>
            {roomState.gameType === 'TEEKO' && (
              <TeekoMatchup
                drawings={roomState.roundData.drawings || []}
                slogans={roomState.roundData.slogans || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'JOBJOB' && (
              <JobJobMatchup
                wordBank={roomState.roundData.wordBank || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'CHAMPDUP' && (
              <ChampdUpMatchup
                champions={roomState.roundData.champions || []}
                playerId={playerInfo.playerId}
              />
            )}
            {!['TEEKO', 'JOBJOB', 'CHAMPDUP'].includes(roomState.gameType) && (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-xl font-bold mb-2">Processing...</h2>
                <p className="text-gray-400">Please wait...</p>
              </div>
            )}
          </>
        )}

        {/* VOTE PHASE */}
        {roomState.phase === 'VOTE' && (
          <>
            {roomState.gameType === 'QUIPLASH' && (
              <QuiplashVote
                matchups={roomState.roundData.matchups || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'TEEKO' && (
              <TeekoVote
                duels={roomState.roundData.duels || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'JOBJOB' && (
              <JobJobVote
                answers={roomState.roundData.finalAnswers || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'CHAMPDUP' && (
              <ChampdUpVote
                duels={roomState.roundData.duels || []}
                playerId={playerInfo.playerId}
              />
            )}
            {roomState.gameType === 'FIBBAGE' && (
              <FibbageVote
                options={roomState.roundData.allOptions || []}
                playerId={playerInfo.playerId}
              />
            )}
          </>
        )}

        {/* REVEAL PHASE */}
        {roomState.phase === 'REVEAL' && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Results!</h2>
            <p className="text-gray-400">Check the main screen for results</p>
          </div>
        )}

        {/* LEADERBOARD PHASE */}
        {roomState.phase === 'LEADERBOARD' && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>
            <Leaderboard players={roomState.leaderboard} />
            <div className="mt-6 text-center text-gray-400">
              Waiting for host to start next round...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
