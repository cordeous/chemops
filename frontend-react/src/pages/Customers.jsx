import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  companyName: '', taxId: '', creditLimit: 10000, currency: 'USD',
  complianceStatus: 'Pending',
  contactName: '', contactEmail: '', contactPhone: '',
  address: { street: '', city: '', state: '', country: '', postalCode: '' },
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.complianceStatus = filterStatus;
      const res = await api.get('/customers', { params });
      setCustomers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      companyName: c.companyName || '', taxId: c.taxId || '',
      creditLimit: c.creditLimit ?? 10000, currency: c.currency || 'USD',
      complianceStatus: c.complianceStatus || 'Pending',
      contactName: c.contactName || '', contactEmail: c.contactEmail || '', contactPhone: c.contactPhone || '',
      address: { street: c.address?.street || '', city: c.address?.city || '', state: c.address?.state || '', country: c.address?.country || '', postalCode: c.address?.postalCode || '' },
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer created');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
  const fa = (key) => (e) => setForm(p => ({ ...p, address: { ...p.address, [key]: e.target.value } }));

  return (
    <Layout
      title="Customers"
      actions={<button onClick={openAdd} className="btn btn-accent">+ Add Customer</button>}
    >
      <div className="filter-bar">
        <input className="input max-w-xs" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select max-w-[180px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Company</th>
                <th className="table-th">Contact</th>
                <th className="table-th">Tax ID</th>
                <th className="table-th">Credit Limit</th>
                <th className="table-th">Compliance</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading…</td></tr>}
              {!loading && customers.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">No customers found</td></tr>}
              {customers.map(c => (
                <tr key={c._id} className="table-row">
                  <td className="table-td">
                    <div className="font-medium text-gray-900">{c.companyName}</div>
                    <div className="text-xs text-gray-400">{c.address?.city}{c.address?.country ? `, ${c.address.country}` : ''}</div>
                  </td>
                  <td className="table-td">
                    <div>{c.contactName}</div>
                    <div className="text-xs text-gray-400">{c.contactEmail}</div>
                  </td>
                  <td className="table-td font-mono text-xs text-gray-500">{c.taxId || '—'}</td>
                  <td className="table-td">{formatCurrency(c.creditLimit, c.currency)}</td>
                  <td className="table-td"><StatusBadge status={c.complianceStatus} /></td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-xs text-[#1a2e5a] hover:underline">Edit</button>
                      <button onClick={() => handleDelete(c._id)} className="text-xs text-red-400 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg">
        <form onSubmit={handleSave}>
          <div className="modal-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Company Name *</label>
              <input className="input" value={form.companyName} onChange={f('companyName')} required />
            </div>
            <div>
              <label className="label">Tax ID</label>
              <input className="input" value={form.taxId} onChange={f('taxId')} />
            </div>
            <div>
              <label className="label">Compliance Status</label>
              <select className="select" value={form.complianceStatus} onChange={f('complianceStatus')}>
                <option>Pending</option><option>Verified</option><option>Rejected</option>
              </select>
            </div>
            <div>
              <label className="label">Credit Limit</label>
              <input className="input" type="number" min={0} value={form.creditLimit} onChange={f('creditLimit')} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="select" value={form.currency} onChange={f('currency')}>
                {['USD', 'EUR', 'GBP', 'CAD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 border-t border-gray-100 pt-2 mt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact</p>
            </div>
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={form.contactName} onChange={f('contactName')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.contactEmail} onChange={f('contactEmail')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" value={form.contactPhone} onChange={f('contactPhone')} />
            </div>
            <div className="sm:col-span-2 border-t border-gray-100 pt-2 mt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Address</p>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Street</label>
              <input className="input" value={form.address.street} onChange={fa('street')} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.address.city} onChange={fa('city')} />
            </div>
            <div>
              <label className="label">State / Province</label>
              <input className="input" value={form.address.state} onChange={fa('state')} />
            </div>
            <div>
              <label className="label">Postal Code</label>
              <input className="input" value={form.address.postalCode} onChange={fa('postalCode')} />
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" value={form.address.country} onChange={fa('country')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
