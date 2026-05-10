import api from './axios';

export const requestOTP = (telephone) =>
  api.post('/auth/request-otp', { telephone });

export const verifyOTP = (telephone, code) =>
  api.post('/auth/verify-otp', { telephone, code });