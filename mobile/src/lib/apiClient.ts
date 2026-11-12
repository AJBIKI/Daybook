import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import {
  API_BASE_URL,
  REQUEST_TIMEOUT_MS,
  SLOW_REQUEST_THRESHOLD_MS,
} from './config';
import { AppError, type ApiErrorEnvelope } from '../types/api';

interface AuthCallbacks {
  getToken: () => string | null;
  onUnauthorized: () => void;
  onSlowRequestChange: (isSlow: boolean) => void;
}

let authCallbacks: AuthCallbacks = {
  getToken: () => null,
  onUnauthorized: () => {},
  onSlowRequestChange: () => {},
};

export function configureApiClient(callbacks: AuthCallbacks): void {
  authCallbacks = callbacks;
}

let inFlightSlowTimers = 0;
const requestTimers = new WeakMap<
  InternalAxiosRequestConfig,
  ReturnType<typeof setTimeout>
>();

function clearSlowTimer(config?: InternalAxiosRequestConfig): void {
  if (!config) {
    return;
  }
  const timer = requestTimers.get(config);
  if (timer) {
    clearTimeout(timer);
    requestTimers.delete(config);
    inFlightSlowTimers = Math.max(0, inFlightSlowTimers - 1);
    if (inFlightSlowTimers === 0) {
      authCallbacks.onSlowRequestChange(false);
    }
  }
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = authCallbacks.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  inFlightSlowTimers += 1;
  const timer = setTimeout(() => {
    authCallbacks.onSlowRequestChange(true);
  }, SLOW_REQUEST_THRESHOLD_MS);
  requestTimers.set(config, timer);

  return config;
});

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<ApiErrorEnvelope>;
    const status = axiosErr.response?.status ?? 0;
    const envelope = axiosErr.response?.data;

    if (envelope?.error?.code && envelope.error.message) {
      return new AppError(
        envelope.error.code,
        envelope.error.message,
        status,
        envelope.error.details,
      );
    }

    if (axiosErr.code === 'ECONNABORTED') {
      return new AppError(
        'NETWORK_ERROR',
        'Request timed out. Please try again.',
        status,
      );
    }

    if (!axiosErr.response) {
      return new AppError(
        'NETWORK_ERROR',
        'Unable to reach Daybook server. Check your connection.',
        0,
      );
    }

    return new AppError('INTERNAL', 'Something went wrong on the server.', status);
  }

  return new AppError('INTERNAL', 'Unexpected error occurred.');
}

apiClient.interceptors.response.use(
  (response) => {
    clearSlowTimer(response.config);
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      clearSlowTimer(error.config);
      const url = error.config?.url ?? '';
      const isAuthCredentialAttempt =
        url.includes('/auth/login') || url.includes('/auth/register');

      if (error.response?.status === 401 && !isAuthCredentialAttempt) {
        authCallbacks.onUnauthorized();
      }
    }

    return Promise.reject(toAppError(error));
  },
);
