import { NavLink } from 'react-router-dom';

function Layout({ children, title }) {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>TaskOps</h2>
          <span>Gestión de Tareas</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Principal</div>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Gestión</div>
            <NavLink to="/asignaciones" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">📋</span> Asignaciones
            </NavLink>
            <NavLink to="/personas" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">👥</span> Equipo
            </NavLink>
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Configuración</div>
            <NavLink to="/estados" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon">🏷️</span> Estados
            </NavLink>
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">{title}</span>
        </div>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
