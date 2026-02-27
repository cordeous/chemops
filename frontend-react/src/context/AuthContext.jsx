import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chemops_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('chemops_token'));
  const navigate = useNavigate();

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = data.data;
    localStorage.setItem('chemops_token', t);
    localStorage.setItem('chemops_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
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
