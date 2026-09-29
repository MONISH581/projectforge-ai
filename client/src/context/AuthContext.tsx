import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { User, Profile, Skill } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  skills: Skill[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setOnboarded: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('projectforge_token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setSkills([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        setSkills(res.data.skills || []);
      } else {
        localStorage.removeItem('projectforge_token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('projectforge_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();

    const handleAuthExpired = () => {
      setUser(null);
      setProfile(null);
      setSkills([]);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [refreshMe]);

  const login = async (credentials: any) => {
    setIsLoading(true);
    const res = await api.login(credentials);
    setIsLoading(false);

    if (res.success && res.data) {
      localStorage.setItem('projectforge_token', res.data.token);
      setUser(res.data.user);
      setProfile(res.data.profile);
      await refreshMe();
      return { success: true };
    }

    return {
      success: false,
      error: res.error?.message || 'Login failed. Please verify your email and password.'
    };
  };

  const register = async (data: any) => {
    setIsLoading(true);
    const res = await api.register(data);
    setIsLoading(false);

    if (res.success && res.data) {
      localStorage.setItem('projectforge_token', res.data.token);
      setUser(res.data.user);
      setProfile(res.data.profile);
      await refreshMe();
      return { success: true };
    }

    return {
      success: false,
      error: res.error?.message || 'Registration failed.'
    };
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore network failure on logout
    }
    localStorage.removeItem('projectforge_token');
    setUser(null);
    setProfile(null);
    setSkills([]);
  };

  const setOnboarded = (status: boolean) => {
    if (user) {
      setUser({ ...user, isOnboarded: status });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        skills,
        isLoading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshMe,
        setOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
