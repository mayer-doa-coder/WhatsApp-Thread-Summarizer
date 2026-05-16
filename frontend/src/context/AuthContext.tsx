import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, setAuthToken } from '../services/api';

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUser(token: string): User {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return { id: payload.sub as string, email: payload.email as string };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('wts_token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('wts_token');
    if (!stored) return null;
    try {
      return decodeUser(stored);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    } else {
      setAuthToken(null);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const data = await loginUser(email, password);
    localStorage.setItem('wts_token', data.token);
    setAuthToken(data.token);
    setToken(data.token);
    setUser(decodeUser(data.token));
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    const data = await registerUser(email, password);
    localStorage.setItem('wts_token', data.token);
    setAuthToken(data.token);
    setToken(data.token);
    setUser(decodeUser(data.token));
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem('wts_token');
    localStorage.removeItem('wts_user');
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
