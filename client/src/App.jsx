import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Landing from './pages/Landing';
import Join from './pages/Join';
import Host from './pages/Host';
import Player from './pages/Player';
import Display from './pages/Display';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/join" element={<Join />} />
          <Route path="/host" element={<Host />} />
          <Route path="/play" element={<Player />} />
          <Route path="/display" element={<Display />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
