import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard    from './pages/Dashboard';
import Personas     from './pages/Personas';
import Estados      from './pages/Estados';
import Asignaciones from './pages/Asignaciones';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Dashboard />} />
        <Route path="/asignaciones" element={<Asignaciones />} />
        <Route path="/personas"     element={<Personas />} />
        <Route path="/estados"      element={<Estados />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
