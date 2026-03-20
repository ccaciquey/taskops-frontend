import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { getPersonas, createPersona, updatePersona, deletePersona, exportarPersonas } from '../api/personas';
import { getRoles } from '../api/roles';

const EMPTY_FORM = {
  numDni: '', codIniciales: '', desNombres: '',
  desSkills: '', desPuesto: '', desEmail: '', desTelefono: '',
  rolActual: { codRol: '' },
  codRegistro: '', fecIngreso: '', fecNacimiento: '', indActivo: true,
};

function Personas() {
  const [personas, setPersonas]   = useState([]);
  const [roles, setRoles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]   = useState(null);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getPersonas(), getRoles()])
      .then(([p, r]) => { setPersonas(p.data); setRoles(r.data); })
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setModalOpen(true);
    setError('');
  };

  const openEdit = (p) => {
    setForm({
      numDni: p.numDni, codIniciales: p.codIniciales, desNombres: p.desNombres,
      desSkills: p.desSkills || '', desPuesto: p.desPuesto || '',
      desEmail: p.desEmail || '', desTelefono: p.desTelefono || '',
      rolActual: { codRol: p.rolActual?.codRol || '' },
      codRegistro: p.codRegistro || '',
      fecIngreso: p.fecIngreso ? p.fecIngreso.substring(0, 10) : '',
      fecNacimiento: p.fecNacimiento ? p.fecNacimiento.substring(0, 10) : '',
      indActivo: p.indActivo ?? true,
    });
    setEditItem(p);
    setModalOpen(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.numDni || !form.desNombres || !form.codIniciales || !form.rolActual.codRol) {
      setError('DNI, Nombres, Iniciales y Rol son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...form, indActivo: form.indActivo ? 1 : 0 };
    try {
      if (editItem) {
        await updatePersona(editItem.idPersona, payload);
      } else {
        await createPersona(payload);
      }
      setModalOpen(false);
      load();
    } catch {
      setError('Error al guardar. Verifique los datos.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePersona(deleteId);
      setDeleteId(null);
      load();
    } catch {
      setError('Error al eliminar. La persona puede tener asignaciones activas.');
    }
  };

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const exportToExcel = async () => {
    const params = {};
    if (!showInactive) params.indActivo = 1;
    if (search) params.desNombres = search;
    try {
      const response = await exportarPersonas(params);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      const disposition = response.headers['content-disposition'];
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      a.download = match?.[1] ?? `personas_${new Date().toISOString().substring(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Error al exportar. Intente nuevamente.');
    }
  };

  const filtered = personas.filter(p => {
    if (!showInactive && !p.indActivo) return false;
    if (!search) return true;
    return (
      p.desNombres?.toLowerCase().includes(search.toLowerCase()) ||
      p.numDni?.includes(search) ||
      p.desEmail?.toLowerCase().includes(search.toLowerCase()) ||
      p.codRegistro?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = personas.filter(p => p.indActivo).length;

  return (
    <Layout title="Equipo de Personas">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Personas ({activeCount} activas{showInactive ? ` / ${personas.length - activeCount} inactivas` : ''})</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
              />
              Mostrar inactivas
            </label>
            <input
              className="form-control"
              style={{ width: 220 }}
              placeholder="Buscar por nombre, DNI, email o cód..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={exportToExcel} disabled={filtered.length === 0}>⬇ Exportar Excel</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Nueva Persona</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">⏳ Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>{search ? 'Sin resultados para la búsqueda' : 'No hay personas registradas'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cód. Registro</th>
                  <th>DNI</th>
                  <th>Iniciales</th>
                  <th>Nombres</th>
                  <th>Rol</th>
                  <th>Puesto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>F. Ingreso</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.idPersona}>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{p.idPersona}</td>
                    <td style={{ fontSize: '0.8rem' }}>{p.codRegistro || '—'}</td>
                    <td>{p.numDni}</td>
                    <td><span className="badge badge-blue">{p.codIniciales}</span></td>
                    <td><strong>{p.desNombres}</strong></td>
                    <td><span className="badge badge-gray">{p.rolActual?.desRol || '—'}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{p.desPuesto || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{p.desEmail || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{p.desTelefono || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{p.fecIngreso ? p.fecIngreso.substring(0, 10) : '—'}</td>
                    <td>
                      <span className={`badge ${p.indActivo ? 'badge-green' : 'badge-red'}`}>
                        {p.indActivo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon edit" title="Editar" onClick={() => openEdit(p)}>✏️</button>
                        <button className="btn-icon delete" title="Eliminar" onClick={() => setDeleteId(p.idPersona)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <Modal
          title={editItem ? `Editar: ${editItem.desNombres}` : 'Nueva Persona'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          }
        >
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cód. Registro</label>
              <input
                className="form-control"
                value={form.codRegistro}
                onChange={e => setField('codRegistro', e.target.value)}
                placeholder="REG-001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                className="form-control"
                value={form.indActivo ? 'true' : 'false'}
                onChange={e => setField('indActivo', e.target.value === 'true')}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">DNI *</label>
              <input
                className="form-control" maxLength={8}
                value={form.numDni}
                onChange={e => setField('numDni', e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Iniciales *</label>
              <input
                className="form-control" maxLength={3}
                value={form.codIniciales}
                onChange={e => setField('codIniciales', e.target.value.toUpperCase())}
                placeholder="JDO"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de Ingreso</label>
              <input
                className="form-control" type="date"
                value={form.fecIngreso}
                onChange={e => setField('fecIngreso', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input
                className="form-control" type="date"
                value={form.fecNacimiento}
                onChange={e => setField('fecNacimiento', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nombres completos *</label>
            <input
              className="form-control"
              value={form.desNombres}
              onChange={e => setField('desNombres', e.target.value)}
              placeholder="Juan Doe"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Rol actual *</label>
            <select
              className="form-control"
              value={form.rolActual.codRol}
              onChange={e => setField('rolActual', { codRol: e.target.value })}
            >
              <option value="">-- Seleccionar rol --</option>
              {roles.map(r => <option key={r.codRol} value={r.codRol}>{r.desRol}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Puesto</label>
              <input className="form-control" value={form.desPuesto} onChange={e => setField('desPuesto', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-control" value={form.desTelefono} onChange={e => setField('desTelefono', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.desEmail} onChange={e => setField('desEmail', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Skills</label>
            <input className="form-control" value={form.desSkills} onChange={e => setField('desSkills', e.target.value)} placeholder="Java, React, Docker..." />
          </div>
        </Modal>
      )}

      {/* Confirmar eliminación */}
      {deleteId && (
        <Modal
          title="Confirmar eliminación"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
            </>
          }
        >
          <p>¿Está seguro que desea eliminar esta persona? Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </Layout>
  );
}

export default Personas;
