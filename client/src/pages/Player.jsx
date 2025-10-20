import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import QuiplashInput from '../components/games/QuiplashInput';
import QuiplashVote from '../components/games/QuiplashVote';
import QuiplashFinaleVote from '../components/games/QuiplashFinaleVote';
// import QuiplashInput3D from '../components/games/QuiplashInput3D';
// import QuiplashVote3D from '../components/games/QuiplashVote3D';
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

  // // Check if we're in 3D mode for Quiplash
  // const isQuiplash3DPhase = roomState.gameType === 'QUIPLASH' &&
  //   (roomState.phase === 'INPUT' || roomState.phase === 'VOTE');

  // if (isQuiplash3DPhase) {
  //   // Full-screen 3D experience
  //   return (
  //     <div className="fixed inset-0 w-full h-full overflow-hidden">
  //       {roomState.phase === 'INPUT' && (
  //         <QuiplashInput3D
  //           prompts={roomState.roundData.prompts?.[playerInfo.playerId] || []}
  //           playerId={playerInfo.playerId}
  //         />
  //       )}
  //       {roomState.phase === 'VOTE' && (
  //         <QuiplashVote3D
  //           matchups={roomState.roundData.matchups || []}
  //           playerId={playerInfo.playerId}
  //           currentMatchupIndex={roomState.roundData.currentMatchupIndex || 0}
  //         />
  //       )}
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen p-4" style={{
      background: roomState.gameType === 'QUIPLASH'
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
        : undefined
    }}>
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        {roomState.gameType === 'QUIPLASH' ? (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-2xl border-4 border-orange-500/50 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-xs text-orange-400 font-bold uppercase tracking-wider">Speler</div>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                  {playerInfo.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Room</div>
                <div className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {playerInfo.roomCode}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-700">
              <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-black text-xs uppercase tracking-wider">
                {roomState.phase}
              </span>
              {currentPlayer && (
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  {currentPlayer.score || 0} pts
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Phase Content */}
      <div className="max-w-2xl mx-auto">
        {roomState.phase === 'LOBBY' && (
          roomState.gameType === 'QUIPLASH' ? (
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-purple-500/50">
                <div className="text-8xl mb-6 animate-bounce">🎮</div>
                <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
                  WACHTEN OP START
                </h2>
                <p className="text-2xl text-gray-300 font-semibold mb-8">De host start het spel binnenkort...</p>
                <div className="mt-8">
                  <div className="text-sm text-purple-400 font-bold uppercase tracking-wider mb-4">Spelers in kamer:</div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {roomState.players.map(p => (
                      <span key={p.id} className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-500/50 text-white font-bold text-sm">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-8 flex justify-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          ) : (
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
          )
        )}

        {/* INPUT PHASE */}
        {roomState.phase === 'INPUT' && (
          <>
            {roomState.gameType === 'QUIPLASH' && (
              <QuiplashInput
                prompts={roomState.roundData.prompts?.[playerInfo.playerId] || []}
                playerId={playerInfo.playerId}
                players={roomState.players}
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
              roomState.roundData.isFinale ? (
                <QuiplashFinaleVote
                  finaleAnswers={roomState.roundData.finaleAnswers || []}
                  playerId={playerInfo.playerId}
                  finaleVotes={roomState.roundData.finaleVotes || {}}
                  totalPlayers={roomState.players.length}
                />
              ) : (
                <QuiplashVote
                  matchups={roomState.roundData.matchups || []}
                  playerId={playerInfo.playerId}
                  currentMatchupIndex={roomState.roundData.currentMatchupIndex || 0}
                  matchupVotes={roomState.roundData.matchupVotes || {}}
                  totalPlayers={roomState.players.length}
                />
              )
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
          roomState.gameType === 'QUIPLASH' ? (
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl border-4 border-yellow-500/50">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                  RESULTATEN!
                </h2>
                <p className="text-2xl text-gray-300 font-semibold">Check het hoofdscherm voor de resultaten</p>
                <div className="mt-8 flex justify-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Results!</h2>
              <p className="text-gray-400">Check the main screen for results</p>
            </div>
          )
        )}

        {/* LEADERBOARD PHASE */}
        {roomState.phase === 'LEADERBOARD' && (
          roomState.gameType === 'QUIPLASH' ? (
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border-4 border-purple-500/50">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 mb-2">
                    LEADERBOARD
                  </h2>
                </div>
                <Leaderboard players={roomState.leaderboard} />
                <div className="mt-8 text-center">
                  <p className="text-xl text-gray-300 font-semibold">Wachten op host om volgende ronde te starten...</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-center">Leaderboard</h2>
              <Leaderboard players={roomState.leaderboard} />
              <div className="mt-6 text-center text-gray-400">
                Waiting for host to start next round...
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
