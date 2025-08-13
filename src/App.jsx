import { Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/live">RealTime</NavLink>
        <NavLink to="/record">Record</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/live" element={<Demo mode="live" />} />
        <Route path="/record" element={<Demo mode="record" />} />
      </Routes>
    </div>
  );
}
