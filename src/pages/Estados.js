import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { getEstados, createEstado, updateEstado, deleteEstado } from '../api/estados';

const EMPTY_FORM = { codEstado: '', codTipo: '', desEstado: '' };

function Estados() {
  const [estados, setEstados]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]   = useState(null);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [tipoFilter, setTipoFilter] = useState('');

  const load = () => {
    setLoading(true);
    getEstados()
      .then(r => setEstados(r.data))
      .catch(() => setError('Error al cargar estados'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setModalOpen(true);
    setError('');
  };

  const openEdit = (e) => {
    setForm({ codEstado: e.codEstado, codTipo: e.codTipo, desEstado: e.desEstado });
    setEditItem(e);
    setModalOpen(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.codEstado || !form.codTipo || !form.desEstado) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await updateEstado(editItem.codEstado, form);
      } else {
        await createEstado(form);
      }
      setModalOpen(false);
      load();
    } catch {
      setError('Error al guardar. El código puede estar duplicado o en uso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEstado(deleteId);
      setDeleteId(null);
      load();
    } catch {
      setError('Error al eliminar. El estado puede estar en uso.');
    }
  };

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Tipos únicos para filtro
  const tipos = [...new Set(estados.map(e => e.codTipo))].sort();

  const filtered = tipoFilter ? estados.filter(e => e.codTipo === tipoFilter) : estados;

  return (
    <Layout title="Estados">
      <div className="card">
        <div className="card-header">
          <span className="card-title">Estados ({estados.length})</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: 180 }}
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openCreate}>+ Nuevo Estado</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">⏳ Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏷️</div>
            <p>No hay estados registrados</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código Estado</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.codEstado}>
                    <td><span className="badge badge-blue">{e.codEstado}</span></td>
                    <td><span className="badge badge-gray">{e.codTipo}</span></td>
                    <td>{e.desEstado}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon edit" title="Editar" onClick={() => openEdit(e)}>✏️</button>
                        <button className="btn-icon delete" title="Eliminar" onClick={() => setDeleteId(e.codEstado)}>🗑️</button>
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
          title={editItem ? `Editar Estado: ${editItem.codEstado}` : 'Nuevo Estado'}
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
              <label className="form-label">Código Estado * (3 chars)</label>
              <input
                className="form-control" maxLength={3}
                value={form.codEstado}
                onChange={e => setField('codEstado', e.target.value.toUpperCase())}
                disabled={!!editItem}
                placeholder="PEN"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Código Tipo * (3 chars)</label>
              <input
                className="form-control" maxLength={3}
                value={form.codTipo}
                onChange={e => setField('codTipo', e.target.value.toUpperCase())}
                placeholder="ASG"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descripción *</label>
            <input
              className="form-control"
              value={form.desEstado}
              onChange={e => setField('desEstado', e.target.value)}
              placeholder="Pendiente"
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
            Ejemplos de tipos: ASG (Asignación), PER (Persona), TAR (Tarea)
          </p>
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
          <p>¿Eliminar el estado <strong>{deleteId}</strong>? Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </Layout>
  );
}

export default Estados;
