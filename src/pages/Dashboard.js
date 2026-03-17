import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { getAsignaciones, getPendientes, getCompletadas } from '../api/asignaciones';
import { getAsignacionPersonas } from '../api/asignacionPersonas';
import { getPersonas } from '../api/personas';
import { getTiposAsignacion } from '../api/tiposAsignacion';

const PERIODS = [
  { key: 'hoy',    label: 'Hoy' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes',    label: 'Mes' },
  { key: 'anio',   label: 'Año' },
  { key: 'todos',  label: 'Todos' },
];

function inPeriod(fecInicio, period) {
  if (!fecInicio || period === 'todos') return true;
  const fecha = new Date(fecInicio + 'T00:00:00');
  const now = new Date();

  if (period === 'hoy') {
    return fecha.toDateString() === now.toDateString();
  }
  if (period === 'semana') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return fecha >= start && fecha <= end;
  }
  if (period === 'mes') {
    return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
  }
  if (period === 'anio') {
    return fecha.getFullYear() === now.getFullYear();
  }
  return true;
}

function prioridadBadge(cod) {
  if (cod === 'A') return 'badge-red';
  if (cod === 'M') return 'badge-yellow';
  return 'badge-gray';
}

function Dashboard() {
  const [stats, setStats]                   = useState({ total: 0, pendientes: 0, completadas: 0 });
  const [asignacionPersonas, setAsigPs]     = useState([]);
  const [personas, setPersonas]             = useState([]);
  const [tipos, setTipos]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');

  const [period, setPeriod]                 = useState('mes');
  const [personaFilter, setPersonaFilter]   = useState('');
  const [tipoFilter, setTipoFilter]         = useState('');

  useEffect(() => {
    Promise.all([
      getAsignaciones(),
      getPendientes(),
      getCompletadas(),
      getAsignacionPersonas(),
      getPersonas(),
      getTiposAsignacion(),
    ])
      .then(([all, pend, comp, ap, pers, tips]) => {
        setStats({
          total:      all.data.length,
          pendientes: pend.data.length,
          completadas: comp.data.length,
        });
        setAsigPs(ap.data);
        setPersonas(pers.data);
        setTipos(tips.data);
      })
      .catch(() => setError('Error al conectar con el servidor. Verifique que el backend esté activo.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return asignacionPersonas.filter(ap => {
      const periodOk  = inPeriod(ap.fecInicio, period);
      const personaOk = !personaFilter || String(ap.persona?.idPersona) === personaFilter;
      const tipoOk    = !tipoFilter    || ap.tipoAsignacion?.codTipo === tipoFilter;
      return periodOk && personaOk && tipoOk;
    });
  }, [asignacionPersonas, period, personaFilter, tipoFilter]);

  const enProgreso = Math.max(0, stats.total - stats.pendientes - stats.completadas);

  return (
    <Layout title="Dashboard">
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">⏳ Cargando datos...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Asignaciones</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-label">Pendientes</div>
              <div className="stat-value">{stats.pendientes}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-label">En Progreso</div>
              <div className="stat-value">{enProgreso}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Completadas</div>
              <div className="stat-value">{stats.completadas}</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="filters-bar">
            <div className="filter-group">
              <label>Período</label>
              <div className="period-tabs">
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    className={`period-tab${period === p.key ? ' active' : ''}`}
                    onClick={() => setPeriod(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Persona</label>
              <select value={personaFilter} onChange={e => setPersonaFilter(e.target.value)}>
                <option value="">Todas</option>
                {personas.map(p => (
                  <option key={p.idPersona} value={p.idPersona}>{p.desNombres}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Tipo de Asignación</label>
              <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}>
                <option value="">Todos</option>
                {tipos.map(t => (
                  <option key={t.codTipo} value={t.codTipo}>{t.desTipo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Asignaciones por persona
                <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>
                  ({filtered.length} registros)
                </span>
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No hay registros para los filtros seleccionados</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Asignación</th>
                      <th>Persona</th>
                      <th>Tipo</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Rol</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Avance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(ap => (
                      <tr key={`${ap.id?.numAsignacion}-${ap.id?.idPersona}`}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{ap.asignacion?.desTitulo || `#${ap.id?.numAsignacion}`}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {ap.desAsignacion?.slice(0, 50)}{ap.desAsignacion?.length > 50 ? '…' : ''}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{ap.persona?.desNombres}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ap.persona?.numDni}</div>
                        </td>
                        <td><span className="badge badge-blue">{ap.tipoAsignacion?.desTipo || '—'}</span></td>
                        <td>
                          <span className={`badge ${prioridadBadge(ap.prioridad?.codPrioridad)}`}>
                            {ap.prioridad?.desPrioridad || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${ap.indCompletado === 'S' ? 'badge-green' : 'badge-yellow'}`}>
                            {ap.estado?.desEstado || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{ap.rolAsignacion?.desRol || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{ap.fecInicio}</td>
                        <td style={{ fontSize: '0.8rem' }}>{ap.fecFin}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="progress-bar" style={{ width: 70 }}>
                              <div className="progress-fill" style={{ width: `${ap.porCompletado || 0}%` }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{ap.porCompletado || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

export default Dashboard;
