import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { getAsignaciones, createAsignacion, updateAsignacion, deleteAsignacion } from '../api/asignaciones';
import { getByAsignacion, createAsignacionPersona, updateAsignacionPersona, deleteAsignacionPersona } from '../api/asignacionPersonas';
import { getPersonas } from '../api/personas';
import { getEstados } from '../api/estados';
import { getPrioridades } from '../api/prioridades';
import { getTiposAsignacion } from '../api/tiposAsignacion';
import { getRoles } from '../api/roles';

const EMPTY_ASIG = {
  desTitulo: '', desAsignacion: '',
  fecInicio: '', fecFin: '',
  indCompletado: 'N', porCompletado: 0,
};

const EMPTY_AP = {
  persona:        { idPersona: '' },
  prioridad:      { codPrioridad: '' },
  tipoAsignacion: { codTipo: '' },
  estado:         { codEstado: '' },
  rolAsignacion:  { codRol: '' },
  fecInicio: '', fecFin: '',
  indCompletado: 'N', porCompletado: 0,
  desAsignacion: '', numCalificacion: '', desCalificacion: '',
};

function Asignaciones() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [selected, setSelected]         = useState(null);
  const [asigPs, setAsigPs]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingAP, setLoadingAP]       = useState(false);
  const [error, setError]               = useState('');

  // Catálogos
  const [personas, setPersonas]   = useState([]);
  const [estados, setEstados]     = useState([]);
  const [prioridades, setPriori]  = useState([]);
  const [tipos, setTipos]         = useState([]);
  const [roles, setRoles]         = useState([]);

  // Modales asignación
  const [asigModal, setAsigModal]         = useState(false);
  const [editAsig, setEditAsig]           = useState(null);
  const [formAsig, setFormAsig]           = useState(EMPTY_ASIG);
  const [deleteAsigId, setDeleteAsigId]   = useState(null);
  const [savingAsig, setSavingAsig]       = useState(false);

  // Modales asignacion-persona
  const [apModal, setApModal]     = useState(false);
  const [editAp, setEditAp]       = useState(null);
  const [formAp, setFormAp]       = useState(EMPTY_AP);
  const [deleteAp, setDeleteAp]   = useState(null);
  const [savingAp, setSavingAp]   = useState(false);

  const loadCatalogs = () =>
    Promise.all([getPersonas(), getEstados(), getPrioridades(), getTiposAsignacion(), getRoles()])
      .then(([p, e, pr, t, r]) => {
        setPersonas(p.data); setEstados(e.data); setPriori(pr.data);
        setTipos(t.data); setRoles(r.data);
      });

  const loadAsignaciones = () => {
    setLoading(true);
    getAsignaciones()
      .then(r => setAsignaciones(r.data))
      .catch(() => setError('Error al cargar asignaciones'))
      .finally(() => setLoading(false));
  };

  const loadAsigPs = (numAsig) => {
    setLoadingAP(true);
    getByAsignacion(numAsig)
      .then(r => setAsigPs(r.data))
      .catch(() => setAsigPs([]))
      .finally(() => setLoadingAP(false));
  };

  useEffect(() => { loadCatalogs(); loadAsignaciones(); }, []);

  const selectAsig = (a) => { setSelected(a); loadAsigPs(a.numAsignacion); };

  // --- Asignación CRUD ---
  const openCreateAsig = () => {
    setFormAsig(EMPTY_ASIG);
    setEditAsig(null);
    setAsigModal(true);
    setError('');
  };

  const openEditAsig = (a) => {
    setFormAsig({
      desTitulo: a.desTitulo, desAsignacion: a.desAsignacion,
      fecInicio: a.fecInicio, fecFin: a.fecFin,
      indCompletado: a.indCompletado, porCompletado: a.porCompletado,
    });
    setEditAsig(a);
    setAsigModal(true);
    setError('');
  };

  const handleSaveAsig = async () => {
    if (!formAsig.desTitulo || !formAsig.fecInicio || !formAsig.fecFin) {
      setError('Título, fecha de inicio y fecha de fin son obligatorios');
      return;
    }
    setSavingAsig(true);
    setError('');
    try {
      if (editAsig) {
        const updated = await updateAsignacion(editAsig.numAsignacion, formAsig);
        if (selected?.numAsignacion === editAsig.numAsignacion) setSelected(updated.data);
      } else {
        await createAsignacion(formAsig);
      }
      setAsigModal(false);
      loadAsignaciones();
    } catch {
      setError('Error al guardar la asignación');
    } finally {
      setSavingAsig(false);
    }
  };

  const handleDeleteAsig = async () => {
    try {
      await deleteAsignacion(deleteAsigId);
      setDeleteAsigId(null);
      if (selected?.numAsignacion === deleteAsigId) setSelected(null);
      loadAsignaciones();
    } catch {
      setError('Error al eliminar. La asignación puede tener personas asignadas.');
    }
  };

  // --- AsignacionPersona CRUD ---
  const openCreateAP = () => {
    setFormAp({ ...EMPTY_AP, fecInicio: selected.fecInicio, fecFin: selected.fecFin });
    setEditAp(null);
    setApModal(true);
    setError('');
  };

  const openEditAP = (ap) => {
    setFormAp({
      persona:        { idPersona: ap.persona?.idPersona || '' },
      prioridad:      { codPrioridad: ap.prioridad?.codPrioridad || '' },
      tipoAsignacion: { codTipo: ap.tipoAsignacion?.codTipo || '' },
      estado:         { codEstado: ap.estado?.codEstado || '' },
      rolAsignacion:  { codRol: ap.rolAsignacion?.codRol || '' },
      fecInicio: ap.fecInicio, fecFin: ap.fecFin,
      indCompletado: ap.indCompletado, porCompletado: ap.porCompletado,
      desAsignacion: ap.desAsignacion || '',
      numCalificacion: ap.numCalificacion || '',
      desCalificacion: ap.desCalificacion || '',
    });
    setEditAp(ap);
    setApModal(true);
    setError('');
  };

  const handleSaveAP = async () => {
    const { persona, tipoAsignacion, estado, rolAsignacion, fecInicio, fecFin } = formAp;
    if (!persona.idPersona || !tipoAsignacion.codTipo || !estado.codEstado || !rolAsignacion.codRol || !fecInicio || !fecFin) {
      setError('Persona, tipo, estado, rol y fechas son obligatorios');
      return;
    }
    setSavingAp(true);
    setError('');
    const payload = {
      id: { numAsignacion: selected.numAsignacion, idPersona: Number(persona.idPersona) },
      asignacion:     { numAsignacion: selected.numAsignacion },
      persona:        { idPersona: Number(persona.idPersona) },
      prioridad:      formAp.prioridad.codPrioridad ? { codPrioridad: formAp.prioridad.codPrioridad } : null,
      tipoAsignacion: { codTipo: tipoAsignacion.codTipo },
      estado:         { codEstado: estado.codEstado },
      rolAsignacion:  { codRol: rolAsignacion.codRol },
      fecInicio, fecFin,
      indCompletado:   formAp.indCompletado,
      porCompletado:   Number(formAp.porCompletado),
      desAsignacion:   formAp.desAsignacion,
      numCalificacion: formAp.numCalificacion ? Number(formAp.numCalificacion) : null,
      desCalificacion: formAp.desCalificacion || null,
    };
    try {
      if (editAp) {
        await updateAsignacionPersona(selected.numAsignacion, editAp.persona?.idPersona, payload);
      } else {
        await createAsignacionPersona(payload);
      }
      setApModal(false);
      loadAsigPs(selected.numAsignacion);
    } catch {
      setError('Error al guardar. La persona puede ya estar asignada o los datos son inválidos.');
    } finally {
      setSavingAp(false);
    }
  };

  const handleDeleteAP = async () => {
    try {
      await deleteAsignacionPersona(deleteAp.numAsignacion, deleteAp.idPersona);
      setDeleteAp(null);
      loadAsigPs(selected.numAsignacion);
    } catch {
      setError('Error al quitar la persona de la asignación');
    }
  };

  const setAsigField = (f, v) => setFormAsig(prev => ({ ...prev, [f]: v }));
  const setApField   = (f, v) => setFormAp(prev => ({ ...prev, [f]: v }));
  const setApNested  = (parent, f, v) => setFormAp(prev => ({ ...prev, [parent]: { ...prev[parent], [f]: v } }));

  return (
    <Layout title="Gestión de Asignaciones">
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* Lista de asignaciones */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Asignaciones ({asignaciones.length})</span>
            <button className="btn btn-primary btn-sm" onClick={openCreateAsig}>+ Nueva</button>
          </div>

          {loading ? (
            <div className="loading">⏳ Cargando...</div>
          ) : asignaciones.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No hay asignaciones registradas</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Título / Descripción</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th>Avance</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {asignaciones.map(a => (
                    <tr
                      key={a.numAsignacion}
                      style={{
                        cursor: 'pointer',
                        background: selected?.numAsignacion === a.numAsignacion ? '#eff6ff' : '',
                      }}
                      onClick={() => selectAsig(a)}
                    >
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{a.numAsignacion}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{a.desTitulo}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {a.desAsignacion?.slice(0, 55)}{a.desAsignacion?.length > 55 ? '…' : ''}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{a.fecInicio}</td>
                      <td style={{ fontSize: '0.8rem' }}>{a.fecFin}</td>
                      <td>
                        <span className={`badge ${a.indCompletado === 'S' ? 'badge-green' : 'badge-yellow'}`}>
                          {a.indCompletado === 'S' ? 'Completada' : 'En curso'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${a.porCompletado || 0}%` }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.porCompletado || 0}%</span>
                        </div>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="actions-cell">
                          <button className="btn-icon edit" title="Editar" onClick={() => openEditAsig(a)}>✏️</button>
                          <button className="btn-icon delete" title="Eliminar" onClick={() => setDeleteAsigId(a.numAsignacion)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel detalle: personas asignadas */}
        {selected && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{selected.desTitulo}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                  {selected.fecInicio} → {selected.fecFin}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={openCreateAP}>+ Asignar persona</button>
                <button className="btn btn-secondary btn-sm" title="Cerrar panel" onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>

            {selected.desAsignacion && (
              <p style={{ padding: '0 0 12px', fontSize: '0.82rem', color: '#475569' }}>{selected.desAsignacion}</p>
            )}

            {loadingAP ? (
              <div className="loading">⏳ Cargando...</div>
            ) : asigPs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <p>No hay personas asignadas. Haz clic en "+ Asignar persona"</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Persona</th>
                      <th>Rol</th>
                      <th>Tipo</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Avance</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {asigPs.map(ap => (
                      <tr key={`${ap.id?.numAsignacion}-${ap.id?.idPersona}`}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{ap.persona?.desNombres}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{ap.persona?.numDni}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{ap.rolAsignacion?.desRol || '—'}</td>
                        <td><span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{ap.tipoAsignacion?.desTipo || '—'}</span></td>
                        <td>
                          <span className={`badge ${
                            ap.prioridad?.codPrioridad === 'A' ? 'badge-red' :
                            ap.prioridad?.codPrioridad === 'M' ? 'badge-yellow' : 'badge-gray'
                          }`} style={{ fontSize: '0.7rem' }}>
                            {ap.prioridad?.desPrioridad || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${ap.indCompletado === 'S' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.7rem' }}>
                            {ap.estado?.desEstado || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div className="progress-bar" style={{ width: 50 }}>
                              <div className="progress-fill" style={{ width: `${ap.porCompletado || 0}%` }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{ap.porCompletado || 0}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button className="btn-icon edit" title="Editar" onClick={() => openEditAP(ap)}>✏️</button>
                            <button className="btn-icon delete" title="Quitar" onClick={() => setDeleteAp({ numAsignacion: ap.id?.numAsignacion, idPersona: ap.id?.idPersona })}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Nueva / Editar Asignación */}
      {asigModal && (
        <Modal
          title={editAsig ? 'Editar Asignación' : 'Nueva Asignación'}
          onClose={() => setAsigModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAsigModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveAsig} disabled={savingAsig}>
                {savingAsig ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-control" value={formAsig.desTitulo} onChange={e => setAsigField('desTitulo', e.target.value)} placeholder="Ej: Implementar módulo de autenticación" />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-control" rows={3} value={formAsig.desAsignacion} onChange={e => setAsigField('desAsignacion', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha Inicio *</label>
              <input className="form-control" type="date" value={formAsig.fecInicio} onChange={e => setAsigField('fecInicio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Fin *</label>
              <input className="form-control" type="date" value={formAsig.fecFin} onChange={e => setAsigField('fecFin', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">¿Completada?</label>
              <select className="form-control" value={formAsig.indCompletado} onChange={e => setAsigField('indCompletado', e.target.value)}>
                <option value="N">No</option>
                <option value="S">Sí</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">% Completado</label>
              <input className="form-control" type="number" min={0} max={100} value={formAsig.porCompletado} onChange={e => setAsigField('porCompletado', e.target.value)} />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Asignar / Editar Persona */}
      {apModal && (
        <Modal
          title={editAp ? 'Editar Asignación de Persona' : `Asignar Persona a: ${selected?.desTitulo}`}
          onClose={() => setApModal(false)}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setApModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveAP} disabled={savingAp}>
                {savingAp ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Persona *</label>
              <select className="form-control" value={formAp.persona.idPersona} onChange={e => setApNested('persona', 'idPersona', e.target.value)} disabled={!!editAp}>
                <option value="">-- Seleccionar --</option>
                {personas.map(p => <option key={p.idPersona} value={p.idPersona}>{p.desNombres}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rol en la asignación *</label>
              <select className="form-control" value={formAp.rolAsignacion.codRol} onChange={e => setApNested('rolAsignacion', 'codRol', e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {roles.map(r => <option key={r.codRol} value={r.codRol}>{r.desRol}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Asignación *</label>
              <select className="form-control" value={formAp.tipoAsignacion.codTipo} onChange={e => setApNested('tipoAsignacion', 'codTipo', e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {tipos.map(t => <option key={t.codTipo} value={t.codTipo}>{t.desTipo}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select className="form-control" value={formAp.prioridad.codPrioridad} onChange={e => setApNested('prioridad', 'codPrioridad', e.target.value)}>
                <option value="">-- Sin prioridad --</option>
                {prioridades.map(p => <option key={p.codPrioridad} value={p.codPrioridad}>{p.desPrioridad}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estado *</label>
              <select className="form-control" value={formAp.estado.codEstado} onChange={e => setApNested('estado', 'codEstado', e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {estados.map(e => <option key={e.codEstado} value={e.codEstado}>{e.desEstado}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">¿Completada?</label>
              <select className="form-control" value={formAp.indCompletado} onChange={e => setApField('indCompletado', e.target.value)}>
                <option value="N">No</option>
                <option value="S">Sí</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha Inicio *</label>
              <input className="form-control" type="date" value={formAp.fecInicio} onChange={e => setApField('fecInicio', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Fin *</label>
              <input className="form-control" type="date" value={formAp.fecFin} onChange={e => setApField('fecFin', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">% Completado</label>
              <input className="form-control" type="number" min={0} max={100} value={formAp.porCompletado} onChange={e => setApField('porCompletado', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Calificación (1-5)</label>
              <input className="form-control" type="number" min={1} max={5} value={formAp.numCalificacion} onChange={e => setApField('numCalificacion', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción de tarea</label>
            <textarea className="form-control" rows={2} value={formAp.desAsignacion} onChange={e => setApField('desAsignacion', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Comentario de calificación</label>
            <textarea className="form-control" rows={2} value={formAp.desCalificacion} onChange={e => setApField('desCalificacion', e.target.value)} />
          </div>
        </Modal>
      )}

      {/* Confirmar eliminar asignación */}
      {deleteAsigId && (
        <Modal
          title="Confirmar eliminación"
          onClose={() => setDeleteAsigId(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteAsigId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDeleteAsig}>Eliminar</button>
            </>
          }
        >
          <p>¿Eliminar la asignación <strong>#{deleteAsigId}</strong>? Se eliminarán también todas las personas asignadas.</p>
        </Modal>
      )}

      {/* Confirmar quitar persona */}
      {deleteAp && (
        <Modal
          title="Confirmar eliminación"
          onClose={() => setDeleteAp(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteAp(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDeleteAP}>Quitar</button>
            </>
          }
        >
          <p>¿Quitar esta persona de la asignación? Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </Layout>
  );
}

export default Asignaciones;
