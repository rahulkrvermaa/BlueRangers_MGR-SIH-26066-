import axios from 'axios';
import type { PredictionResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getMetadata = async () => {
  const res = await axios.get(`${API_BASE}/metadata`);
  return res.data;
};

export const predictProfile = async (date: string, lat: number, lon: number): Promise<PredictionResponse> => {
  const res = await axios.post(`${API_BASE}/predict`, {
    date,
    latitude: lat,
    longitude: lon,
  });
  return res.data;
};
