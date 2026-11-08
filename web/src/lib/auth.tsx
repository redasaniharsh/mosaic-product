import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, tokenStore } from './api';
import type { Overview, User } from './types';

type AuthState = {
  user: User | null;
  overview: Overview | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (p: { name: string; email: string; password: string; phone?: string; age?: number; city?: string }) => Promise<User>;
  demo: () => Promise<User>;
  logout: () => void;
  refresh: () => Promise<Overview | null>;
  setOverview: (o: Overview | null) => void;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return null;
    }
    try {
      const data = await authApi.me();
      setUser(data.user);
      setOverview(data.overview);
      return data.overview;
    } catch {
      tokenStore.clear();
      setUser(null);
      setOverview(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    tokenStore.set(data.token);
    setUser(data.user);
    await refresh();
    return data.user;
  }, [refresh]);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string; age?: number; city?: string }) => {
      const data = await authApi.register(payload);
      tokenStore.set(data.token);
      setUser(data.user);
      return data.user;
    },
    []
  );

  const demo = useCallback(async () => {
    const data = await authApi.demo();
    tokenStore.set(data.token);
    setUser(data.user);
    await refresh();
    return data.user;
  }, [refresh]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setOverview(null);
  }, []);

  const value = useMemo(
    () => ({ user, overview, loading, login, register, demo, logout, refresh, setOverview, setUser }),
    [user, overview, loading, login, register, demo, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
