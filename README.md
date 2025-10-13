# Party Game Night - MVP

One web app to run your entire party game night with multiple rounds and games!

## Features

- **6 Game Types**: Quiplash, Tee K.O., Job Job, Champ'd Up, Trivia Murder Party, Fibbage
- **Host Screen**: Display on TV/projector with room code and QR code
- **Player Screens**: Join from phones via browser
- **Real-time Communication**: Socket.IO for instant updates
- **Cumulative Leaderboard**: Track scores across multiple rounds
- **Reconnection Support**: Players can rejoin if disconnected
- **No Database**: All data lives in-memory for the session

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: React + Vite + Tailwind CSS
- **State Management**: React Context + Socket.IO events

## Installation

```bash
# Install all dependencies
npm install
```

## Running the Application

### Development Mode (Both server and client)

```bash
npm run dev
```

This starts:
- Server on http://localhost:3001
- Client on http://localhost:3000

### Run Server Only

```bash
npm run dev:server
```

### Run Client Only

```bash
npm run dev:client
```

## How to Play

### 1. Host Creates Room
1. Open http://localhost:3000
2. Click "Host Game"
3. Display the room code on your TV/projector

### 2. Players Join
1. Players visit http://localhost:3000 on their phones
2. Click "Join Game"
3. Enter name and room code

### 3. Start Playing
1. Host selects a game type
2. Host clicks "Start Game"
3. Players follow prompts on their phones
4. Host advances through phases
5. Leaderboard updates after each round

## Game Types

### Quiplash
- Players answer funny prompts
- Answers are paired for voting
- Most votes wins

### Tee K.O.
- Draw images and write slogans
- Combine into T-shirt designs
- Vote for best designs

### Job Job
- Write text to build a word bank
- Create new answers from the word bank
- Vote for best answers

### Champ'd Up
- Draw your champion
- Draw challengers for others
- Vote on best drawings

### Trivia Murder Party
- Answer multiple choice questions
- Earn points for correct answers

### Fibbage
- Write believable lies
- Guess the truth among the lies
- Earn points for fooling others

## Project Structure

```
MVPjackclaude/
├── server/
│   ├── server.js          # Main server + Socket.IO
│   ├── games/
│   │   ├── index.js       # Game types export
│   │   ├── quiplash.js    # Quiplash game logic
│   │   ├── teeko.js       # Tee K.O. logic
│   │   ├── jobjob.js      # Job Job logic
│   │   ├── champdup.js    # Champ'd Up logic
│   │   ├── trivia.js      # Trivia logic
│   │   └── fibbage.js     # Fibbage logic
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx   # Home page
│   │   │   ├── Join.jsx      # Join room page
│   │   │   ├── Host.jsx      # Host control panel
│   │   │   └── Player.jsx    # Player screen
│   │   ├── components/
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── RevealPhase.jsx
│   │   │   └── games/        # Game-specific components
│   │   ├── context/
│   │   │   └── SocketContext.jsx  # WebSocket state
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── package.json           # Root workspace
```

## API / Socket Events

### Client → Server
- `createRoom`: Host creates a new room
- `joinRoom`: Player joins with name and room code
- `reconnect`: Reconnect to existing session
- `startGame`: Host starts a game
- `submitInput`: Player submits answer/drawing
- `submitVote`: Player votes
- `nextPhase`: Host advances to next phase
- `resetRoom`: Host resets room

### Server → Clients
- `roomState`: Full room state broadcast
- `error`: Error messages

## Guards & Validation

- Minimum 2 players to start
- No double submissions per phase
- No self-voting (where applicable)
- Input length limits
- Profanity filter ready (basic sanitization)

## Reconnection

- Session stored in localStorage
- Auto-reconnect on page refresh
- Restores player state and phase

## Production Build

```bash
npm run build
npm start
```

## Future Enhancements

- Animations and sound effects
- Audience voting mode
- Custom prompts/questions
- Game settings (timers, scoring)
- Team mode
- Gallery export for drawings
- Localization

## License

MIT

## Credits

Built with React, Express, Socket.IO, and Tailwind CSS.
