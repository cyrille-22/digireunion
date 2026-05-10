import api from './axios';

export const ouvrirSeance = () => api.post('/seances', {});
export const getCaisse = (id) => api.get(`/seances/${id}/caisse`);
export const pointer = (id, pointages) =>
  api.post(`/seances/${id}/pointage`, { pointages });
export const saisirTransaction = (id, data) =>
  api.post(`/seances/${id}/transactions`, data);
export const cloturerSeance = (id, data) =>
  api.post(`/seances/${id}/cloture`, data);