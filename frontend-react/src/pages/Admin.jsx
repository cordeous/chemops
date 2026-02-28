import { useEffect, useState } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const ROLES = ['Admin', 'Sales', 'Finance', 'Compliance'];
const EMPTY_USER = { name: '', email: '', password: '', role: 'Sales', isActive: true };
const EMPTY_WEBHOOK = { url: '', events: [], secret: '', isActive: true };
const WEBHOOK_EVENTS = ['order.created', 'order.status_changed', 'invoice.issued', 'invoice.paid', 'product.low_stock'];

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [features, setFeatures] = useState({});
  const [webhooks, setWebhooks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [savingUser, setSavingUser] = useState(false);

  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [webhookForm, setWebhookForm] = useState(EMPTY_WEBHOOK);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [confirmWebhookId, setConfirmWebhookId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [uRes, fRes, wRes, aRes, lRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/features'),
          api.get('/webhooks'),
          api.get('/admin/alerts'),
          api.get('/audit'),
        ]);
        setUsers(Array.isArray(uRes.data?.data) ? uRes.data.data : []);
        setFeatures(!Array.isArray(fRes.data?.data) && typeof fRes.data?.data === "object" ? fRes.data.data : {});
        setWebhooks(Array.isArray(wRes.data?.data) ? wRes.data.data : []);
        setAlerts(Array.isArray(aRes.data?.data?.lowStock) ? aRes.data.data.lowStock : []);
        setAuditLogs(Array.isArray(lRes.data?.data) ? lRes.data.data : []);
      } catch { toast.error('Failed to load admin data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Users
  const openAddUser = () => { setEditingUser(null); setUserForm(EMPTY_USER); setUserModalOpen(true); };
  const openEditUser = (u) => {
    setEditingUser(u._id);
    setUserForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setUserModalOpen(true);
  };
  const saveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const payload = { ...userForm };
      if (!payload.password) delete payload.password;
      if (editingUser) {
        await api.put(`/admin/users/${editingUser}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/admin/users', payload);
        toast.success('User created');
      }
      setUserModalOpen(false);
      const res = await api.get('/admin/users');
      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSavingUser(false); }
  };
  const toggleUserActive = async (u) => {
    try {
      await api.put(`/admin/users/${u._id}`, { isActive: !u.isActive });
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
    } catch { toast.error('Update failed'); }
  };

  // Features
  const toggleFeature = async (key) => {
    try {
      const updated = { ...features, [key]: !features[key] };
      await api.put('/admin/features', updated);
      setFeatures(updated);
      toast.success('Feature flag updated');
    } catch { toast.error('Update failed'); }
  };

  // Webhooks
  const openAddWebhook = () => { setEditingWebhook(null); setWebhookForm(EMPTY_WEBHOOK); setWebhookModalOpen(true); };
  const openEditWebhook = (w) => {
    setEditingWebhook(w._id);
    setWebhookForm({ url: w.url, events: w.events ?? [], secret: w.secret || '', isActive: w.isActive });
    setWebhookModalOpen(true);
  };
  const saveWebhook = async (e) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      if (editingWebhook) {
        await api.put(`/webhooks/${editingWebhook}`, webhookForm);
        toast.success('Webhook updated');
      } else {
        await api.post('/webhooks', webhookForm);
        toast.success('Webhook created');
      }
      setWebhookModalOpen(false);
      const res = await api.get('/webhooks');
      setWebhooks(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSavingWebhook(false); }
  };
  const deleteWebhook = async () => {
    try {
      await api.delete(`/webhooks/${confirmWebhookId}`);
      setWebhooks(prev => prev.filter(w => w._id !== confirmWebhookId));
      toast.success('Webhook deleted');
      setConfirmWebhookId(null);
    } catch { toast.error('Delete failed'); }
  };
  const testWebhook = async (id) => {
    try { await api.post(`/webhooks/${id}/test`); toast.success('Test payload sent'); }
    catch { toast.error('Test failed'); }
  };
  const toggleWebhookEvent = (evt) => {
    setWebhookForm(f => ({ ...f, events: f.events.includes(evt) ? f.events.filter(e => e !== evt) : [...f.events, evt] }));
  };

  const TABS = [
    { id: 'users', label: 'Users' },
    { id: 'features', label: 'Feature Flags' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'alerts', label: 'Stock Alerts' },
    { id: 'audit', label: 'Audit Log' },
  ];

  return (
    <Layout title="Admin">
      <div className="flex gap-1 flex-wrap bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-[#1a2e5a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>

      {loading ? <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div> : (
        <>
          {/* Users */}
          {tab === 'users' && (
            <div className="card overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <span>Users ({users.length})</span>
                <button onClick={openAddUser} className="btn btn-accent text-sm py-1 px-3">+ Add User</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">Name</th>
                    <th className="table-th">Email</th>
                    <th className="table-th">Role</th>
                    <th className="table-th">Status</th>
                    <th className="table-th"></th>
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="table-row">
                        <td className="table-td font-medium">{u.name}</td>
                        <td className="table-td text-gray-500">{u.email}</td>
                        <td className="table-td"><span className="badge badge-blue">{u.role}</span></td>
                        <td className="table-td"><span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td className="table-td">
                          <div className="flex gap-2">
                            <button onClick={() => openEditUser(u)} className="text-xs text-[#1a2e5a] hover:underline">Edit</button>
                            <button onClick={() => toggleUserActive(u)} className="text-xs text-gray-400 hover:underline">{u.isActive ? 'Deactivate' : 'Activate'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Features */}
          {tab === 'features' && (
            <div className="card">
              <div className="card-header">Feature Flags</div>
              <div className="divide-y divide-gray-50">
                {Object.keys(features).length === 0 && <div className="py-8 text-center text-gray-400">No feature flags configured</div>}
                {Object.entries(features).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-800">{key}</div>
                      <div className="text-xs text-gray-400">Feature toggle</div>
                    </div>
                    <button
                      onClick={() => toggleFeature(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${val ? 'bg-[#f07c1e]' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${val ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhooks */}
          {tab === 'webhooks' && (
            <div className="card overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <span>Webhooks</span>
                <button onClick={openAddWebhook} className="btn btn-accent text-sm py-1 px-3">+ Add Webhook</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">URL</th>
                    <th className="table-th">Events</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Last Triggered</th>
                    <th className="table-th"></th>
                  </tr></thead>
                  <tbody>
                    {webhooks.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-gray-400">No webhooks configured</td></tr>}
                    {webhooks.map(w => (
                      <tr key={w._id} className="table-row">
                        <td className="table-td font-mono text-xs max-w-[200px] truncate">{w.url}</td>
                        <td className="table-td">
                          <div className="flex flex-wrap gap-1">
                            {(w.events ?? []).map(e => <span key={e} className="badge badge-blue text-xs">{e}</span>)}
                          </div>
                        </td>
                        <td className="table-td"><span className={`badge ${w.isActive ? 'badge-green' : 'badge-gray'}`}>{w.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td className="table-td text-gray-500">{w.lastTriggeredAt ? formatDate(w.lastTriggeredAt) : 'Never'}</td>
                        <td className="table-td">
                          <div className="flex gap-2">
                            <button onClick={() => openEditWebhook(w)} className="text-xs text-[#1a2e5a] hover:underline">Edit</button>
                            <button onClick={() => testWebhook(w._id)} className="text-xs text-[#f07c1e] hover:underline">Test</button>
                            <button onClick={() => setConfirmWebhookId(w._id)} className="text-xs text-red-400 hover:underline">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Alerts */}
          {tab === 'alerts' && (
            <div className="card">
              <div className="card-header">Low Stock Alerts ({alerts.length})</div>
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-gray-400">✓ All inventory levels are above thresholds</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100">
                      <th className="table-th">Product</th>
                      <th className="table-th">Current Stock</th>
                      <th className="table-th">Threshold</th>
                      <th className="table-th">Unit</th>
                    </tr></thead>
                    <tbody>
                      {alerts.map(p => (
                        <tr key={p._id} className="table-row">
                          <td className="table-td font-medium">{p.name}</td>
                          <td className="table-td font-bold text-red-600">{p.inventoryLevel}</td>
                          <td className="table-td text-gray-500">{p.reorderThreshold}</td>
                          <td className="table-td text-gray-500">{p.unitOfMeasure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Audit Log */}
          {tab === 'audit' && (
            <div className="card overflow-hidden">
              <div className="card-header">Audit Log</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">Action</th>
                    <th className="table-th">Entity</th>
                    <th className="table-th">User</th>
                    <th className="table-th">Date</th>
                  </tr></thead>
                  <tbody>
                    {auditLogs.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-400">No audit logs yet</td></tr>}
                    {auditLogs.slice(0, 50).map(log => (
                      <tr key={log._id} className="table-row">
                        <td className="table-td"><span className="badge badge-blue">{log.action}</span></td>
                        <td className="table-td text-gray-600">{log.entityType} <span className="font-mono text-xs text-gray-400">{String(log.entityId).slice(-8)}</span></td>
                        <td className="table-td">{log.userId?.name ?? log.userId ?? '—'}</td>
                        <td className="table-td text-gray-500">{formatDate(log.timestamp ?? log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!confirmWebhookId}
        title="Delete Webhook"
        message="This will permanently remove the webhook endpoint. This action cannot be undone."
        confirmLabel="Delete Webhook"
        onConfirm={deleteWebhook}
        onCancel={() => setConfirmWebhookId(null)}
      />

      {/* User Modal */}
      <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={saveUser}>
          <div className="modal-body space-y-4">
            <div><label className="label">Name *</label><input className="input" value={userForm.name} onChange={e => setUserForm(f => ({...f, name: e.target.value}))} required /></div>
            <div><label className="label">Email *</label><input className="input" type="email" value={userForm.email} onChange={e => setUserForm(f => ({...f, email: e.target.value}))} required /></div>
            <div><label className="label">{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label><input className="input" type="password" value={userForm.password} onChange={e => setUserForm(f => ({...f, password: e.target.value}))} required={!editingUser} /></div>
            <div><label className="label">Role</label>
              <select className="select" value={userForm.role} onChange={e => setUserForm(f => ({...f, role: e.target.value}))}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setUserModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={savingUser}>{savingUser ? 'Saving…' : 'Save User'}</button>
          </div>
        </form>
      </Modal>

      {/* Webhook Modal */}
      <Modal isOpen={webhookModalOpen} onClose={() => setWebhookModalOpen(false)} title={editingWebhook ? 'Edit Webhook' : 'Add Webhook'}>
        <form onSubmit={saveWebhook}>
          <div className="modal-body space-y-4">
            <div><label className="label">Endpoint URL *</label><input className="input" type="url" placeholder="https://example.com/webhook" value={webhookForm.url} onChange={e => setWebhookForm(f => ({...f, url: e.target.value}))} required /></div>
            <div><label className="label">Secret (for HMAC signature)</label><input className="input" value={webhookForm.secret} onChange={e => setWebhookForm(f => ({...f, secret: e.target.value}))} /></div>
            <div>
              <label className="label">Events *</label>
              <div className="grid grid-cols-1 gap-2 mt-1">
                {WEBHOOK_EVENTS.map(evt => (
                  <label key={evt} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={webhookForm.events.includes(evt)} onChange={() => toggleWebhookEvent(evt)} className="accent-[#f07c1e]" />
                    <span className="font-mono text-gray-700">{evt}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={webhookForm.isActive} onChange={e => setWebhookForm(f => ({...f, isActive: e.target.checked}))} className="accent-[#f07c1e]" />
              <span className="font-medium text-gray-700">Active</span>
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setWebhookModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={savingWebhook}>{savingWebhook ? 'Saving…' : 'Save Webhook'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
