import api from './axios';

export const getMembers = () => api.get('/members');
export const getMember = (id) => api.get(`/members/${id}`);
export const addMember = (data) => api.post('/members', data);
export const updateMember = (id, data) => api.put(`/members/${id}`, data);
export const deleteMember = (id) => api.delete(`/members/${id}`);