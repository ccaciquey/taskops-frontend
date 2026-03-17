import api from './index';

export const getAsignaciones  = ()        => api.get('/asignaciones');
export const getPendientes    = ()        => api.get('/asignaciones/pendientes');
export const getCompletadas   = ()        => api.get('/asignaciones/completadas');
export const getAsignacion    = (id)      => api.get(`/asignaciones/${id}`);
export const createAsignacion = (data)    => api.post('/asignaciones', data);
export const updateAsignacion = (id, data)=> api.put(`/asignaciones/${id}`, data);
export const deleteAsignacion = (id)      => api.delete(`/asignaciones/${id}`);
