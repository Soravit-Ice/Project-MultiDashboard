import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/**
 * Check spelling in text
 */
export const checkSpelling = async (text) => {
  const response = await api.post('/api/spell-check/check', { text });
  return response.data;
};

/**
 * Auto-correct text
 */
export const autoCorrectText = async (text, corrections) => {
  const response = await api.post('/api/spell-check/correct', { text, corrections });
  return response.data;
};
