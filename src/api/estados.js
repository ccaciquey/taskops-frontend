import api from './index';

export const getEstados    = ()           => api.get('/estados');
export const getEstado     = (id)         => api.get(`/estados/${id}`);
export const createEstado  = (data)       => api.post('/estados', data);
export const updateEstado  = (id, data)   => api.put(`/estados/${id}`, data);
export const deleteEstado  = (id)         => api.delete(`/estados/${id}`);
