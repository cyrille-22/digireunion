import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  membre: JSON.parse(localStorage.getItem('membre') || 'null'),

  login: (token, membre) => {
    localStorage.setItem('token', token);
    localStorage.setItem('membre', JSON.stringify(membre));
    set({ token, membre });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('membre');
    set({ token: null, membre: null });
  }
}));

export default useAuthStore;