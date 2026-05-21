import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Synchronize authentication validation on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Verify token against database profile
          const res = await authAPI.getMe();
          setUser(res.data.user);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Initial token verification failed:', error.message);
          // Token is invalid, purge local session cache
          logoutAction();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to session expiry events fired by our Axios interceptors
    const handleAuthLogout = () => {
      logoutAction();
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);

  const logoutAction = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Register a new account
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authAPI.register(userData);
      const { user: newUser, token: newToken } = res.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      return newUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log in an existing user
   */
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authAPI.login(credentials);
      const { user: loadedUser, token: newToken } = res.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(loadedUser));
      
      setToken(newToken);
      setUser(loadedUser);
      setIsAuthenticated(true);
      return loadedUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out currently active session
   */
  const logout = () => {
    logoutAction();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to invoke auth context operations instantly
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider element');
  }
  return context;
};
