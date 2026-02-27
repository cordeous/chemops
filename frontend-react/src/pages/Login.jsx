import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2e5a] to-[#0f1c3a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f07c1e] mb-4 shadow-lg">
            <span className="text-3xl">⚗️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">ChemOps</h1>
          <p className="text-white/60 text-sm mt-1">Chemical Sales & Billing Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@chemops.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', email: 'admin@chemops.com', pwd: 'admin123' },
                { label: 'Sales', email: 'sales@chemops.com', pwd: 'sales123' },
                { label: 'Finance', email: 'finance@chemops.com', pwd: 'finance123' },
                { label: 'Compliance', email: 'compliance@chemops.com', pwd: 'compliance123' },
              ].map(({ label, email, pwd }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => fillDemo(email, pwd)}
                  className="text-left px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#f07c1e] hover:bg-orange-50 transition-colors"
                >
                  <div className="text-xs font-semibold text-[#1a2e5a]">{label}</div>
                  <div className="text-xs text-gray-400 truncate">{email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
