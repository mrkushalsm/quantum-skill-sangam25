'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'officer' | 'family' | 'admin';
  serviceNumber?: string;
  rank?: string;
  unit?: string;
  phoneNumber?: string;
  profilePicture?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  familyMembers?: Array<{
    name: string;
    relation: string;
    dob: string;
  }>;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify token validity
        verifyAndRefreshUser();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearAuthData();
      }
    }

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (!firebaseUser && user) {
        // Firebase user logged out, sync with our auth state
        clearAuthData();
      }
      setLoading(false);
    });
    
    // Listen for auth errors from API interceptor
    const handleAuthError = (event: CustomEvent) => {
      toast({
        title: "Authentication Error",
        description: event.detail.message,
        variant: "destructive",
      });
      clearAuthData();
    };
    
    window.addEventListener('auth-error', handleAuthError as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('auth-error', handleAuthError as EventListener);
    };
  }, []);
  const verifyAndRefreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Ensure Firebase token is still valid
      if (firebaseUser) {
        // Get a fresh token
        const freshToken = await firebaseUser.getIdToken(true);
        setToken(freshToken);
        localStorage.setItem('token', freshToken);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAuthData();
      
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authApi.login({ email, password });
      const { user: userData, token: userToken } = response.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.firstName}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || 'Please check your credentials and try again.',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);
      const { user: newUser, token: userToken } = response.data;

      setUser(newUser);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      toast({
        title: "Registration Successful",
        description: `Welcome, ${newUser.firstName}! Please verify your email.`,
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || 'Please check your information and try again.',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await authApi.socialLogin('google', idToken);
      const { user: userData, token: userToken } = response.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));

      toast({
        title: "Login Successful",
        description: `Welcome, ${userData.firstName}!`,
      });
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || 'Please try again.',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Sign out from Firebase
      if (firebaseUser) {
        await signOut(auth);
      }

      // Clear local auth data
      clearAuthData();

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear local data even if logout API fails
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await authApi.updateProfile(data);
      const updatedUser = response.data.user;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update profile.',
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshUser = async () => {
    if (token) {
      await verifyAndRefreshUser();
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
