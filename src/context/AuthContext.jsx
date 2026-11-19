import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAdmin, getAuthProfile } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ocean_admin_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ocean_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    // If user has a valid stored token and role is admin, default to admin, otherwise citizen
    const saved = localStorage.getItem('ocean_admin_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin') return 'admin';
      } catch {
        // ignore
      }
    }
    return 'citizen';
  });
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Synchronize token and user into localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('ocean_admin_token', token);
    } else {
      localStorage.removeItem('ocean_admin_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ocean_admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ocean_admin_user');
    }
  }, [user]);

  // Listen to 401 unauthorized events from Axios client
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setRole('citizen');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Check existing token on initial load
  useEffect(() => {
    if (token && !user) {
      getAuthProfile()
        .then((fetchedUser) => {
          setUser(fetchedUser);
          if (fetchedUser.role === 'admin') {
            setRole('admin');
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          setRole('citizen');
        });
    }
  }, [token, user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginAdmin(email, password);
      const authToken = data.token;
      const authUser = data.user;
      setToken(authToken);
      setUser(authUser);
      if (authUser.role === 'admin') {
        setRole('admin');
      }
      setIsLoginModalOpen(false);
      return { success: true, user: authUser };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole('citizen');
  };

  const toggleRole = (targetRole) => {
    if (targetRole === 'admin') {
      if (user && user.role === 'admin' && token) {
        setRole('admin');
      } else {
        // Prompt for admin credentials if not logged in as admin
        setIsLoginModalOpen(true);
      }
    } else {
      setRole('citizen');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin' && !!token,
        login,
        logout,
        setRole: toggleRole,
        isLoginModalOpen,
        setIsLoginModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
