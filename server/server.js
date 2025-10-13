import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { gameTypes } from './games/index.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }
});

// In-memory storage
const rooms = new Map();

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

// Create initial room state
function createRoom(hostSocketId) {
  return {
    hostSocketId,
    players: new Map(),
    phase: 'LOBBY',
    gameType: null,
    currentRound: 0,
    roundData: {},
    leaderboard: {},
    createdAt: Date.now()
  };
}

// Broadcast room state to all clients
function broadcastRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const state = {
    phase: room.phase,
    gameType: room.gameType,
    currentRound: room.currentRound,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      score: room.leaderboard[p.id] || 0,
      status: p.status
    })),
    roundData: room.roundData,
    leaderboard: Object.entries(room.leaderboard)
      .map(([id, score]) => {
        const player = room.players.get(id);
        return { id, name: player?.name || 'Unknown', score };
      })
      .sort((a, b) => b.score - a.score)
  };

  io.to(roomCode).emit('roomState', state);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Create room (Host)
  socket.on('createRoom', (callback) => {
    const roomCode = generateRoomCode();
    const room = createRoom(socket.id);
    rooms.set(roomCode, room);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.role = 'HOST';

    console.log(`Room created: ${roomCode}`);
    callback({ success: true, roomCode });
    broadcastRoomState(roomCode);
  });

  // Join room (Player/Audience)
  socket.on('joinRoom', ({ roomCode, name, role = 'PLAYER' }, callback) => {
    roomCode = roomCode.toUpperCase().trim();
    const room = rooms.get(roomCode);

    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }

    // Check if name already exists
    const existingPlayer = Array.from(room.players.values()).find(p => p.name === name);
    if (existingPlayer && existingPlayer.socketId !== socket.id) {
      return callback({ success: false, error: 'Name already taken' });
    }

    const playerId = existingPlayer?.id || nanoid(8);

    room.players.set(playerId, {
      id: playerId,
      socketId: socket.id,
      name,
      role,
      status: 'connected',
      submissions: {}
    });

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;
    socket.data.role = role;

    console.log(`${name} joined room ${roomCode} as ${role}`);
    callback({ success: true, playerId });
    broadcastRoomState(roomCode);
  });

  // Reconnect
  socket.on('reconnect', ({ roomCode, playerId }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }

    const player = room.players.get(playerId);
    if (!player) {
      return callback({ success: false, error: 'Player not found' });
    }

    player.socketId = socket.id;
    player.status = 'connected';
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;
    socket.data.role = player.role;

    console.log(`${player.name} reconnected to ${roomCode}`);
    callback({ success: true });
    broadcastRoomState(roomCode);
  });

  // Start game
  socket.on('startGame', ({ gameType }, callback) => {
    const roomCode = socket.data.roomCode;
    const room = rooms.get(roomCode);

    if (!room || socket.data.role !== 'HOST') {
      return callback({ success: false, error: 'Unauthorized' });
    }

    if (room.players.size < 2) {
      return callback({ success: false, error: 'Need at least 2 players' });
    }

    room.gameType = gameType;
    room.currentRound = 1;
    room.phase = 'INPUT';
    room.roundData = gameTypes[gameType].initRound(room);

    console.log(`Game started: ${gameType} in room ${roomCode}`);
    callback({ success: true });
    broadcastRoomState(roomCode);
  });

  // Submit input
  socket.on('submitInput', ({ data }, callback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = rooms.get(roomCode);

    if (!room || !playerId) {
      return callback({ success: false, error: 'Invalid session' });
    }

    const player = room.players.get(playerId);
    if (!player) {
      return callback({ success: false, error: 'Player not found' });
    }

    // Validate: no double submission in same phase
    if (player.submissions[room.phase]) {
      return callback({ success: false, error: 'Already submitted' });
    }

    player.submissions[room.phase] = data;
    player.status = 'submitted';

    console.log(`${player.name} submitted input for ${room.gameType}`);
    callback({ success: true });
    broadcastRoomState(roomCode);
  });

  // Next phase (Host only)
  socket.on('nextPhase', (callback) => {
    const roomCode = socket.data.roomCode;
    const room = rooms.get(roomCode);

    if (!room || socket.data.role !== 'HOST') {
      return callback({ success: false, error: 'Unauthorized' });
    }

    const gameLogic = gameTypes[room.gameType];
    if (!gameLogic) {
      return callback({ success: false, error: 'Invalid game type' });
    }

    // Process current phase and move to next
    const result = gameLogic.nextPhase(room);

    if (result.error) {
      return callback({ success: false, error: result.error });
    }

    room.phase = result.nextPhase;
    if (result.roundData) {
      room.roundData = result.roundData;
    }
    if (result.scores) {
      // Update leaderboard
      Object.entries(result.scores).forEach(([id, points]) => {
        room.leaderboard[id] = (room.leaderboard[id] || 0) + points;
      });
    }

    // Reset player statuses for new phase
    room.players.forEach(p => {
      p.status = 'waiting';
    });

    console.log(`Phase changed to ${room.phase} in room ${roomCode}`);
    callback({ success: true, phase: room.phase });
    broadcastRoomState(roomCode);
  });

  // Submit vote
  socket.on('submitVote', ({ targetId, choice }, callback) => {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    const room = rooms.get(roomCode);

    if (!room || !playerId) {
      return callback({ success: false, error: 'Invalid session' });
    }

    const player = room.players.get(playerId);
    if (!player) {
      return callback({ success: false, error: 'Player not found' });
    }

    // Check if already voted
    if (player.submissions[`VOTE_${room.currentRound}`]) {
      return callback({ success: false, error: 'Already voted' });
    }

    // Validate no self-voting (if applicable)
    if (targetId === playerId) {
      return callback({ success: false, error: 'Cannot vote for yourself' });
    }

    // Store vote
    if (!room.roundData.votes) {
      room.roundData.votes = [];
    }

    room.roundData.votes.push({
      voterId: playerId,
      targetId,
      choice,
      timestamp: Date.now()
    });

    player.submissions[`VOTE_${room.currentRound}`] = { targetId, choice };
    player.status = 'voted';

    console.log(`${player.name} voted in room ${roomCode}`);
    callback({ success: true });
    broadcastRoomState(roomCode);
  });

  // Reset room (Host only)
  socket.on('resetRoom', (callback) => {
    const roomCode = socket.data.roomCode;
    const room = rooms.get(roomCode);

    if (!room || socket.data.role !== 'HOST') {
      return callback({ success: false, error: 'Unauthorized' });
    }

    room.phase = 'LOBBY';
    room.gameType = null;
    room.currentRound = 0;
    room.roundData = {};
    room.leaderboard = {};
    room.players.forEach(p => {
      p.submissions = {};
      p.status = 'connected';
    });

    console.log(`Room reset: ${roomCode}`);
    callback({ success: true });
    broadcastRoomState(roomCode);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomCode = socket.data.roomCode;
    const room = rooms.get(roomCode);

    if (room) {
      // If host disconnects, mark room for cleanup
      if (socket.id === room.hostSocketId) {
        console.log(`Host disconnected from room ${roomCode}`);
        // Optional: delete room after timeout
      } else {
        // Mark player as disconnected
        const playerId = socket.data.playerId;
        const player = room.players.get(playerId);
        if (player) {
          player.status = 'disconnected';
          broadcastRoomState(roomCode);
        }
      }
    }
  });
});

// Cleanup old rooms (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 2 * 60 * 60 * 1000; // 2 hours

  rooms.forEach((room, code) => {
    if (now - room.createdAt > MAX_AGE) {
      console.log(`Cleaning up old room: ${code}`);
      rooms.delete(code);
    }
  });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
