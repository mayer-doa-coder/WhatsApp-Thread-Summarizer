import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, setAuthToken } from '../services/api';

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  /**
   * Sign in with email + password.
   * rememberMe = true → localStorage (30-day session, survives browser restarts).
   * rememberMe = false → sessionStorage (cleared when browser tab/window closes).
   * Throws on error so callers can catch and show messages.
   */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  /**
   * Initiate registration — creates the account and triggers OTP delivery.
   * Returns the email on success so the caller can redirect to the verify screen.
   * Throws on error.
   */
  initiateRegister: (email: string, password: string) => Promise<string>;
  /** Called after OTP verification — stores the token and logs the user in immediately. */
  completeVerification: (token: string) => void;
  logout: () => void;
}

const TOKEN_KEY = 'wts_token';

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUser(token: string): User {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return { id: payload.sub as string, email: payload.email as string };
}

/** Read from localStorage first, fall back to sessionStorage. */
function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<User | null>(() => {
    const stored = readStoredToken();
    if (!stored) return null;
    try { return decodeUser(stored); } catch { return null; }
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = useCallback(async (
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<void> => {
    const data = await loginUser(email, password);
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, data.token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, data.token);
    }
    setAuthToken(data.token);
    setToken(data.token);
    setUser(decodeUser(data.token));
  }, []);

  const initiateRegister = useCallback(async (email: string, password: string): Promise<string> => {
    const data = await registerUser(email, password);
    return data.email;
  }, []);

  // After OTP verification the user just created their account — persist in localStorage
  // so they don't have to log in again immediately.
  const completeVerification = useCallback((newToken: string): void => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(decodeUser(newToken));
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, initiateRegister, completeVerification, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
