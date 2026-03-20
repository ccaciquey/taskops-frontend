import api from './index';

export const getPersonas    = ()          => api.get('/personas');
export const getPersona     = (id)        => api.get(`/personas/${id}`);
export const createPersona  = (data)      => api.post('/personas', data);
export const updatePersona  = (id, data)  => api.put(`/personas/${id}`, data);
export const deletePersona  = (id)        => api.delete(`/personas/${id}`);
export const exportarPersonas = (params)  => api.get('/personas/exportar', { params, responseType: 'blob' });
