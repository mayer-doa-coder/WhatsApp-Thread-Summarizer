import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, setAuthToken, getProfile } from '../services/api';

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  plan?: 'free' | 'pro';
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
  /** Re-fetch the user's full profile from the server and update context state. */
  refreshProfile: () => Promise<void>;
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

  // Hydrate displayName + plan from the server on initial load if already logged in.
  useEffect(() => {
    if (!token) return;
    getProfile().then((profile) => {
      setUser((prev) => prev ? { ...prev, displayName: profile.displayName, plan: profile.plan } : prev);
    }).catch(() => {
      // Profile fetch failures (e.g. expired token) are handled silently here;
      // protected routes will redirect to login when the token is invalid.
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const profile = await getProfile();
      setUser((prev) => prev ? { ...prev, displayName: profile.displayName, plan: profile.plan } : prev);
    } catch {
      // ignore — caller can handle if needed
    }
  }, []);

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
    const base = decodeUser(data.token);
    setUser(base);
    // Hydrate extra profile fields (displayName, plan) without blocking login.
    getProfile().then((profile) => {
      setUser({ ...base, displayName: profile.displayName, plan: profile.plan });
    }).catch(() => {});
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
    const base = decodeUser(newToken);
    setUser(base);
    getProfile().then((profile) => {
      setUser({ ...base, displayName: profile.displayName, plan: profile.plan });
    }).catch(() => {});
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, initiateRegister, completeVerification, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
