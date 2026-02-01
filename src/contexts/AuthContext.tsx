import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '../services/firebase';
import { authService, itemsService } from '../services/firebase';
import { authAPI } from '../services/api';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

/**
 * User profile interface matching Firebase/Backend schema
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  trustScore: number;
  itemsReported: number;
  itemsRecovered: number;
  createdAt: string;
  role: 'user' | 'admin';
}

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  
  // Auth functions
  register: (email: string, password: string, name: string, phone?: string) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Helper functions
  clearError: () => void;
}

/**
 * Create the authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 */
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          
          // Get user profile from Firestore
          const profile = await authService.getUserProfile(fbUser.uid);
          if (profile) {
            setUser(profile);
            // Get Firebase ID token for Firestore operations
            const firebaseToken = await fbUser.getIdToken();
            localStorage.setItem('firebaseToken', firebaseToken);
            // Note: JWT token will be set during login/register via authAPI
          } else {
            // Profile doesn't exist, logout
            await authService.logout();
            setUser(null);
            setFirebaseUser(null);
          }
        } else {
          // User not logged in
          setUser(null);
          setFirebaseUser(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('firebaseToken');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
        setUser(null);
        setFirebaseUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<UserProfile> => {
    try {
      setError(null);
      setIsLoading(true);

      // Register with backend API to get JWT token
      const response = await authAPI.register(email, password, name, phone);
      const token = response.token || response.data?.token;
      
      if (token) {
        console.log('✅ Received JWT token from register:', token.substring(0, 20) + '...');
        localStorage.setItem('authToken', token);
      } else {
        console.error('❌ No token in register response:', response);
      }

      // Also register with Firebase for Firestore access
      try {
        const { profile } = await authService.register({ email, password, name, phone });
        setUser(profile);
        return profile;
      } catch (fbError) {
        console.warn('Firebase registration error (non-critical):', fbError);
        // Continue even if Firebase registration fails
        const backendProfile = response.user || response.data?.user;
        if (backendProfile) {
          setUser(backendProfile);
          return backendProfile;
        }
        throw new Error('Registration failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<UserProfile> => {
    try {
      setError(null);
      setIsLoading(true);

      // Login with backend API to get JWT token
      const response = await authAPI.login(email, password);
      const token = response.token || response.data?.token;
      
      if (token) {
        console.log('✅ Received JWT token from login:', token.substring(0, 20) + '...');
        localStorage.setItem('authToken', token);
      } else {
        console.error('❌ No token in login response:', response);
      }

      // Get user profile from response
      const profile = response.user || response.data?.user;
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Try to also login with Firebase for Firestore access
      try {
        const fbUser = await authService.login({ email, password });
        setFirebaseUser(fbUser);
        const firebaseToken = await fbUser.getIdToken();
        localStorage.setItem('firebaseToken', firebaseToken);
      } catch (fbError) {
        console.warn('Firebase login error (non-critical):', fbError);
        // Continue even if Firebase login fails
      }

      setUser(profile);
      return profile;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await authService.logout();
      localStorage.removeItem('authToken');
      localStorage.removeItem('firebaseToken');
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setError(null);
      setIsLoading(true);

      await authService.updateUserProfile(user.id, updates);

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Context value
   */
  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!user && !!firebaseUser,
    isLoading,
    isAdmin: user?.role === 'admin',
    error,
    register,
    login,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
