import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../context/SocketContext';
import QuiplashDisplay from '../components/games/QuiplashDisplay';
import RevealPhase from '../components/RevealPhase';
import Leaderboard from '../components/Leaderboard';

function loadDisplaySession() {
  try {
    return JSON.parse(localStorage.getItem('displaySession') || '{}');
  } catch (error) {
    console.error('Failed to parse displaySession', error);
    return {};
  }
}

function randomDisplayName() {
  return `Display-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export default function Display() {
  const { socket, roomState, connected } = useSocket();
  const [searchParams] = useSearchParams();

  const [displaySession, setDisplaySession] = useState(() => loadDisplaySession());
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const queryRoomCode = useMemo(() => {
    const code = searchParams.get('roomCode');
    return code ? code.toUpperCase().trim() : '';
  }, [searchParams]);

  const activeRoomCode = queryRoomCode || displaySession.roomCode || '';

  useEffect(() => {
    setError('');
    setHasJoined(false);
  }, [activeRoomCode]);

  useEffect(() => {
    if (!socket || !connected || !activeRoomCode || hasJoined || joining) {
      return;
    }

    const session = displaySession;

    const joinAsDisplay = (name) => {
      setJoining(true);
      socket.emit(
        'joinRoom',
        {
          roomCode: activeRoomCode,
          name,
          role: 'DISPLAY'
        },
        (response) => {
          setJoining(false);
          if (response.success) {
            const updatedSession = {
              roomCode: activeRoomCode,
              playerId: response.playerId,
              name,
              role: 'DISPLAY'
            };
            setDisplaySession(updatedSession);
            localStorage.setItem('displaySession', JSON.stringify(updatedSession));
            setHasJoined(true);
          } else {
            setError(response.error || 'Kon niet verbinden met deze kamer.');
          }
        }
      );
    };

    if (session.roomCode === activeRoomCode && session.playerId) {
      setJoining(true);
      socket.emit(
        'reconnect',
        {
          roomCode: session.roomCode,
          playerId: session.playerId
        },
        (response) => {
          setJoining(false);
          if (response.success) {
            setHasJoined(true);
          } else {
            localStorage.removeItem('displaySession');
            setDisplaySession({});
            joinAsDisplay(randomDisplayName());
          }
        }
      );
    } else {
      localStorage.removeItem('displaySession');
      setDisplaySession({});
      joinAsDisplay(randomDisplayName());
    }
  }, [socket, connected, activeRoomCode, displaySession, hasJoined, joining]);

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.origin}/join`;
  }, []);

  const qrValue = activeRoomCode ? `${joinUrl}?code=${activeRoomCode}` : joinUrl;
  const players = roomState?.players || [];

  const renderPhaseContent = () => {
    if (!roomState) {
      return (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📡</div>
          <p className="text-2xl text-gray-300">Verbinding met spel...</p>
        </div>
      );
    }

    switch (roomState.phase) {
      case 'LOBBY':
        return (
          <div className="card">
            <h2 className="text-4xl font-bold text-center mb-6">Wachten op spelers</h2>
            <p className="text-center text-gray-400 mb-8">
              Laat iedereen naar {joinUrl} gaan en code {activeRoomCode} invoeren
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {players.length === 0 && (
                <div className="text-center text-gray-500 col-span-full">
                  Nog geen spelers verbonden
                </div>
              )}
              {players.map((player) => (
                <div key={player.id} className="p-4 rounded-xl bg-dark-100 text-center text-lg font-semibold">
                  {player.name}
                </div>
              ))}
            </div>
          </div>
        );
      case 'INPUT':
      case 'MATCHUP':
      case 'VOTE':
        if (roomState.gameType === 'QUIPLASH') {
          return (
            <QuiplashDisplay roundData={roomState.roundData} phase={roomState.phase} />
          );
        }
        return (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-2xl text-gray-300">Spelers zijn bezig. Houd het scherm in de gaten!</p>
          </div>
        );
      case 'REVEAL':
        return (
          <div className="card">
            <RevealPhase gameType={roomState.gameType} roundData={roomState.roundData} />
          </div>
        );
      case 'LEADERBOARD':
        return (
          <div className="card">
            <h2 className="text-4xl font-bold text-center mb-6">Leaderboard</h2>
            <Leaderboard players={roomState.leaderboard} />
          </div>
        );
      default:
        return (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-2xl text-gray-300">Volg de instructies van de host</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Beamer Display</h1>
            <p className="text-gray-400 mt-2 text-lg">
              Toon dit scherm op de beamer of televisie voor alle spelers
            </p>
          </div>

          <div className="card flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="text-center md:text-left">
              <div className="text-sm uppercase text-gray-400 tracking-widest">Room Code</div>
              <div className="text-5xl font-black tracking-[0.4em] md:tracking-[0.6em]">
                {activeRoomCode || '----'}
              </div>
              <div className="text-sm text-gray-500 mt-2">Ga naar {joinUrl}</div>
            </div>
            <div className="p-3 bg-white rounded-2xl">
              <QRCodeSVG value={qrValue || 'https://example.com'} size={120} />
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500 text-red-300 text-center">
            {error}
          </div>
        )}

        {!activeRoomCode && (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">ℹ️</div>
            <p className="text-2xl text-gray-300">
              Open dit scherm via de host pagina zodat we automatisch verbinden met je kamer.
            </p>
          </div>
        )}

        {activeRoomCode && (joining && !hasJoined) && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">🔄</div>
            <p className="text-xl text-gray-300">Verbinding maken met kamer {activeRoomCode}...</p>
          </div>
        )}

        {activeRoomCode && hasJoined && renderPhaseContent()}
      </div>
    </div>
  );
}
