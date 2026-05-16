import { useState, useCallback } from 'react';
import axios from 'axios';
import { loginUser, registerUser, setAuthToken, type AuthResponse } from '../services/api';

interface UseAuthReturn {
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResponse | null>;
  register: (email: string, password: string) => Promise<AuthResponse | null>;
}

export function useAuth(): UseAuthReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(email, password);
      setAuthToken(data.token);
      localStorage.setItem('wts_token', data.token);
      localStorage.setItem('wts_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : 'An unexpected error occurred.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<AuthResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerUser(email, password);
      setAuthToken(data.token);
      localStorage.setItem('wts_token', data.token);
      localStorage.setItem('wts_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : 'An unexpected error occurred.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, login, register };
}
