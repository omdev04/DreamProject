import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/apiService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedAdmin = localStorage.getItem('admin');
    
    if (token && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
      // Optionally validate token with backend
      authService.getProfile()
        .then(response => {
          setAdmin(response.data.admin);
          localStorage.setItem('admin', JSON.stringify(response.data.admin));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { admin: adminData, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify(adminData));
      setAdmin(adminData);
      
      toast.success('Login successful!');
      return adminData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setAdmin(null);
    toast.info('Logged out successfully');
  };

  const isSuperAdmin = () => {
    return admin?.role === 'super_admin';
  };

  const isCustomerAdmin = () => {
    return admin?.role === 'customer_admin';
  };

  const value = {
    admin,
    loading,
    login,
    logout,
    isSuperAdmin,
    isCustomerAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
