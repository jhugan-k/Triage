import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export const api = axios.create({
  baseURL: API_URL,
});

// Helper to save/load token
export const setAuthToken = (token: string) => {
  if (token) {
    localStorage.setItem('token', token);
    // Automatically attach token to every future request
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Clears session and redirects to login
export const logout = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
  window.location.href = '/';
};

// Initialize token from storage on app load (if it exists)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}