import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);

      // Attempt reconnection if session exists
      const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
      if (session.roomCode && session.playerId) {
        newSocket.emit('reconnect', session, (response) => {
          if (response.success) {
            console.log('Reconnected successfully');
          } else {
            localStorage.removeItem('gameSession');
          }
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('roomState', (state) => {
      setRoomState(state);
    });

    newSocket.on('error', (err) => {
      setError(err.message || 'An error occurred');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = (callback) => {
    if (!socket) return;
    socket.emit('createRoom', callback);
  };

  const joinRoom = (data, callback) => {
    if (!socket) return;
    socket.emit('joinRoom', data, (response) => {
      if (response.success) {
        localStorage.setItem('gameSession', JSON.stringify({
          roomCode: data.roomCode,
          playerId: response.playerId,
          name: data.name,
          role: data.role
        }));
      }
      callback(response);
    });
  };

  const startGame = (gameType, callback) => {
    if (!socket) return;
    socket.emit('startGame', { gameType }, callback);
  };

  const submitInput = (data, callback) => {
    if (!socket) return;
    socket.emit('submitInput', { data }, callback);
  };

  const submitVote = (targetId, choice, callback) => {
    if (!socket) return;
    socket.emit('submitVote', { targetId, choice }, callback);
  };

  const nextPhase = (callback) => {
    if (!socket) return;
    socket.emit('nextPhase', callback);
  };

  const resetRoom = (callback) => {
    if (!socket) return;
    socket.emit('resetRoom', callback);
  };

  const value = {
    socket,
    connected,
    roomState,
    error,
    createRoom,
    joinRoom,
    startGame,
    submitInput,
    submitVote,
    nextPhase,
    resetRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
