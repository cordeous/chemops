const API_BASE = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('chemops_token');
const getUser = () => JSON.parse(localStorage.getItem('chemops_user') || 'null');

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('chemops_token');
    localStorage.removeItem('chemops_user');
    window.location.href = '/index.html';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const apiUpload = async (endpoint, formData) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });
  if (res.status === 401) { window.location.href = '/index.html'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
};

const apiDownload = async (endpoint, filename) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const requireAuth = () => {
  if (!getToken()) window.location.href = '/index.html';
};

const requireRole = (...roles) => {
  const user = getUser();
  if (!user || !roles.includes(user.role)) {
    showToast('Insufficient permissions', 'danger');
    return false;
  }
  return true;
};

const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.style.cssText = 'position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `alert alert-${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'success'} alert-dismissible shadow`;
  toast.style.cssText = 'min-width:280px;margin:0;animation:fadeIn 0.3s;';
  toast.innerHTML = `${message}<button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
};

const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const statusBadge = (status) => {
  const map = {
    Verified: 'verified', Pending: 'pending', Rejected: 'rejected',
    Draft: 'draft', Issued: 'issued', Paid: 'paid', Overdue: 'overdue',
    Approved: 'approved', Shipped: 'shipped', Invoiced: 'invoiced', Cancelled: 'cancelled'
  };
  return `<span class="badge-status badge-${map[status] || 'pending'}">${status}</span>`;
};

const setCurrentPage = (page) => {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
};

const initSidebar = () => {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('sidebar-user');
  if (el) el.textContent = user.name;
  const roleEl = document.getElementById('sidebar-role');
  if (roleEl) roleEl.textContent = user.role;

  // Hide role-restricted nav items
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(',');
    if (!roles.includes(user.role)) el.style.display = 'none';
  });
};
