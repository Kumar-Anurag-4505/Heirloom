'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, mfaCode: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  initializeSession: (token: string, userPayload: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Recover session from localStorage on mount
    const savedToken = localStorage.getItem('heirloom_token');
    const savedUser = localStorage.getItem('heirloom_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('heirloom_token');
        localStorage.removeItem('heirloom_user');
      }
    }
    setIsLoading(false);
  }, []);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('heirloom_token');
    if (!savedToken) return;

    try {
      const result = await api.get('/auth/me');
      if (result.success && result.data) {
        const initials = result.data.name
          ? result.data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          : 'US';
          
        const updatedUser: User = {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          role: 'OWNER',
          avatar: initials
        };
        
        setUser(updatedUser);
        localStorage.setItem('heirloom_user', JSON.stringify(updatedUser));
      } else {
        await logout();
      }
    } catch (err) {
      console.error('Failed to sync profile status:', err);
    }
  };

  const login = async (email: string, mfaCode: string) => {
    try {
      // 1. Initial credentials authentication
      const loginResult = await api.post('/auth/login', { email });
      if (!loginResult.success) {
        return { success: false, message: loginResult.message || 'Credentials authentication failed' };
      }

      const { tempSessionId } = loginResult.data;

      // 2. Verification of code challenge
      const mfaResult = await api.post('/auth/mfa/verify', { tempSessionId, code: mfaCode });
      if (!mfaResult.success) {
        return { success: false, message: mfaResult.message || 'MFA validation failed' };
      }

      const issuedToken = mfaResult.data.token;
      const responseUser = mfaResult.data.user;
      
      initializeSession(issuedToken, responseUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Orchestration gateway timeout' };
    }
  };

  const initializeSession = (issuedToken: string, responseUser: any) => {
    const initials = responseUser.name
      ? responseUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'US';

    const authenticatedUser: User = {
      id: responseUser.id,
      name: responseUser.name,
      email: responseUser.email,
      role: 'OWNER',
      avatar: initials
    };

    setToken(issuedToken);
    setUser(authenticatedUser);
    localStorage.setItem('heirloom_token', issuedToken);
    localStorage.setItem('heirloom_user', JSON.stringify(authenticatedUser));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Best-effort cleanup
    }
    
    setToken(null);
    setUser(null);
    localStorage.removeItem('heirloom_token');
    localStorage.removeItem('heirloom_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser, initializeSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}
