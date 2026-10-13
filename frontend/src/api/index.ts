import axios, { AxiosError } from 'axios';
import type { PredictionResponse, MetadataResponse, HealthResponse } from '../types';

export const DEFAULT_BACKEND_URL = 'https://bluerangers-mgr-sih-26066.onrender.com';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 55000, // 55s timeout to handle Render cold-start wakeups
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async (signal?: AbortSignal): Promise<HealthResponse> => {
  try {
    const res = await apiClient.get<HealthResponse>('/health', { signal });
    return res.data;
  } catch (error) {
    throw handleApiError(error, 'Health check failed');
  }
};

export const getMetadata = async (signal?: AbortSignal): Promise<MetadataResponse> => {
  try {
    const res = await apiClient.get<MetadataResponse>('/metadata', { signal });
    return res.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch domain metadata');
  }
};

export interface PredictParams {
  date: string;
  latitude: number;
  longitude: number;
}

export const predictProfile = async (
  params: PredictParams,
  signal?: AbortSignal
): Promise<PredictionResponse> => {
  const { date, latitude, longitude } = params;

  if (typeof latitude !== 'number' || isNaN(latitude)) {
    throw new Error('Invalid latitude value.');
  }
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new Error('Invalid longitude value.');
  }
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid date provided.');
  }

  try {
    const res = await apiClient.post<PredictionResponse>(
      '/predict',
      {
        date,
        latitude,
        longitude,
      },
      { signal }
    );
    return res.data;
  } catch (error) {
    throw handleApiError(error, 'Prediction generation failed');
  }
};

function handleApiError(error: unknown, fallbackMessage: string): Error {
  if (axios.isCancel(error)) {
    return new Error('Request cancelled');
  }

  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new Error('Request timed out. The backend service may be waking up from sleep (can take ~45s on Render). Please retry.');
    }
    if (error.response?.data?.detail) {
      return new Error(error.response.data.detail);
    }
    if (error.response?.status === 404) {
      return new Error('Endpoint not found on the backend service.');
    }
    if (error.response?.status === 500) {
      return new Error('Backend server error while running model inference.');
    }
    if (!error.response && error.request) {
      return new Error('Network error: Unable to reach the backend service. Check connection or CORS settings.');
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}
