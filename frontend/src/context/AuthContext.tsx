import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cp_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const storedToken = localStorage.getItem('cp_token');
      if (storedToken) {
        const u = await api.getMe();
        setUser(u);
      } else {
        // Auto-login or register demo founder account for instant frictionless access
        try {
          const res = await api.login({ email: 'alex.founder@careerpilot.io', password: 'Password123!' });
          localStorage.setItem('cp_token', res.access_token);
          setToken(res.access_token);
          setUser(res.user);
        } catch {
          const regRes = await api.register({
            email: 'alex.founder@careerpilot.io',
            password: 'Password123!',
            full_name: 'Alex Founder'
          });
          localStorage.setItem('cp_token', regRes.access_token);
          setToken(regRes.access_token);
          setUser(regRes.user);
        }
      }
    } catch (err) {
      console.warn('Auth initialization fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('cp_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, password: string, fullName?: string) => {
    const res = await api.register({ email, password, full_name: fullName });
    localStorage.setItem('cp_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('cp_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
