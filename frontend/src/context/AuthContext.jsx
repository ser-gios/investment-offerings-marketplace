import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nv_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    console.log('Login - Attempting with email:', email);
    const { data } = await api.post('/auth/login', { email, password });
    console.log('Login - Token received:', !!data.token);
    localStorage.setItem('nv_token', data.token);
    localStorage.setItem('nv_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, name, role) => {
    const { data } = await api.post('/auth/register', { email, password, name, role });
    console.log('Register - Token received:', !!data.token);
    console.log('Register - User data:', data.user);
    localStorage.setItem('nv_token', data.token);
    localStorage.setItem('nv_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('nv_token');
    localStorage.removeItem('nv_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
