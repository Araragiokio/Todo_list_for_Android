import {
    signOut as authSignOut,
    getCurrentUser,
    getValidIdToken,
    onAuthChange,
    restoreSession,
    signInWithGoogle,
} from '@/services/auth';
import { User } from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;

  // Actions
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;

  // Utilities
  getIdToken: () => Promise<string | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticating: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  getIdToken: async () => null,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore session on app boot
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to restore session from AsyncStorage
        const session = await restoreSession();

        if (session?.user) {
          // Session exists, set user
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      const signedInUser = await signInWithGoogle();
      setUser(signedInUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign-in failed';
      setError(errorMessage);
      setUser(null);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      await authSignOut();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign-out failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const handleGetIdToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getValidIdToken();
    } catch (err) {
      console.error('Failed to get ID token:', err);
      return null;
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticating,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    getIdToken: handleGetIdToken,
    isAuthenticated: user !== null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * Throws error if used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to check if user is authenticated (convenience)
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook to get current user (convenience)
 */
export const useUser = () => {
  const { user } = useAuth();
  return user;
};
