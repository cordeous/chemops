import { Component, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';

const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Products    = lazy(() => import('./pages/Products'));
const Batches     = lazy(() => import('./pages/Batches'));
const Customers   = lazy(() => import('./pages/Customers'));
const Orders      = lazy(() => import('./pages/Orders'));
const Invoices    = lazy(() => import('./pages/Invoices'));
const Reports     = lazy(() => import('./pages/Reports'));
const Compliance  = lazy(() => import('./pages/Compliance'));
const Admin       = lazy(() => import('./pages/Admin'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-8 h-8 border-2 border-[#1a2e5a] border-t-transparent rounded-full animate-spin" aria-label="Loading page" />
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#1a2e5a', color: '#fff', minHeight: '100vh' }}>
          <h2 style={{ color: '#f07c1e' }}>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ffd' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#aaa', fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children, roles }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/products"   element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/batches"    element={<PrivateRoute><Batches /></PrivateRoute>} />
        <Route path="/customers"  element={<PrivateRoute><Customers /></PrivateRoute>} />
        <Route path="/orders"     element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/invoices"   element={<PrivateRoute><Invoices /></PrivateRoute>} />
        <Route path="/reports"    element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/compliance" element={<PrivateRoute><Compliance /></PrivateRoute>} />
        <Route path="/admin"      element={<PrivateRoute roles={['Admin']}><Admin /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
