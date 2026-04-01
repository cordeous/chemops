import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('chemops_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed._id) {
        localStorage.removeItem('chemops_user');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('chemops_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('chemops_token');
    return t && typeof t === 'string' && t.length > 10 ? t : null;
  });
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token: t, user: u } = data.data;
      localStorage.setItem('chemops_token', t);
      localStorage.setItem('chemops_user', JSON.stringify(u));
      setToken(t);
      setUser(u);
    } catch (err) {
      const status = err?.status;
      if (status === 401 || status === 400) {
        throw new Error('Invalid email or password. Please try again.');
      }
      if (status === 403) {
        throw new Error('Your account has been deactivated. Contact an administrator.');
      }
      if (err?.message?.includes('Network') || err?.message?.includes('timeout')) {
        throw new Error('Cannot connect to server. Check your connection and try again.');
      }
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('chemops_token');
    localStorage.removeItem('chemops_user');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
