import api from './index';

export const getAsignacionPersonas    = ()                      => api.get('/asignacion-personas');
export const getByAsignacion          = (numAsig)               => api.get(`/asignacion-personas/asignacion/${numAsig}`);
export const getByPersona             = (idPersona)             => api.get(`/asignacion-personas/persona/${idPersona}`);
export const getAsignacionPersona     = (numAsig, idPersona)    => api.get(`/asignacion-personas/${numAsig}/${idPersona}`);
export const createAsignacionPersona  = (data)                  => api.post('/asignacion-personas', data);
export const updateAsignacionPersona  = (numAsig, idP, data)    => api.put(`/asignacion-personas/${numAsig}/${idP}`, data);
export const deleteAsignacionPersona  = (numAsig, idPersona)    => api.delete(`/asignacion-personas/${numAsig}/${idPersona}`);
