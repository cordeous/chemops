import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  productId: '', batchNumber: '', quantity: 0,
  expirationDate: '', warehouseLocation: '',
};

function expiryBadge(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((new Date(dateStr) - Date.now()) / 86400000);
  if (days < 0) return <span className="badge badge-red">Expired</span>;
  if (days <= 30) return <span className="badge badge-orange">Exp in {days}d</span>;
  return <span className="badge badge-green">{formatDate(dateStr)}</span>;
}

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        api.get('/batches', { params: filterProduct ? { productId: filterProduct } : {} }),
        api.get('/products'),
      ]);
      setBatches(Array.isArray(bRes.data?.data) ? bRes.data.data : []);
      setProducts(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
    } catch { toast.error('Failed to load batches'); }
    finally { setLoading(false); }
  }, [filterProduct]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (b) => {
    setEditing(b._id);
    setForm({
      productId: b.productId?._id ?? b.productId ?? '',
      batchNumber: b.batchNumber || '',
      quantity: b.quantity ?? 0,
      expirationDate: b.expirationDate ? b.expirationDate.slice(0, 10) : '',
      warehouseLocation: b.warehouseLocation || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/batches/${editing}`, form);
        toast.success('Batch updated');
      } else {
        await api.post('/batches', form);
        toast.success('Batch created');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/batches/${confirmId}`);
      toast.success('Batch deleted');
      setConfirmId(null);
      load();
    } catch { toast.error('Delete failed'); }
  };

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

  return (
    <Layout
      title="Batches"
      actions={<button onClick={openAdd} className="btn btn-accent">+ Add Batch</button>}
    >
      <div className="filter-bar">
        <select className="select max-w-xs" value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
          <option value="">All products</option>
          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Batch #</th>
                <th className="table-th">Product</th>
                <th className="table-th">Quantity</th>
                <th className="table-th">Location</th>
                <th className="table-th">Expiration</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading…</td></tr>}
              {!loading && batches.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">No batches found</td></tr>}
              {batches.map(b => (
                <tr key={b._id} className="table-row">
                  <td className="table-td font-mono font-medium">{b.batchNumber}</td>
                  <td className="table-td">{b.productId?.name ?? '—'}</td>
                  <td className="table-td">{b.quantity} {b.productId?.unitOfMeasure}</td>
                  <td className="table-td text-gray-500">{b.warehouseLocation || '—'}</td>
                  <td className="table-td">{expiryBadge(b.expirationDate)}</td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="text-xs text-[#1a2e5a] hover:underline">Edit</button>
                      <button onClick={() => setConfirmId(b._id)} className="text-xs text-red-400 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmId}
        title="Delete Batch"
        message="This will permanently delete the batch record. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Batch' : 'Add Batch'}>
        <form onSubmit={handleSave}>
          <div className="modal-body space-y-4">
            <div>
              <label className="label">Product *</label>
              <select className="select" value={form.productId} onChange={f('productId')} required>
                <option value="">Select product…</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Batch Number *</label>
              <input className="input font-mono" value={form.batchNumber} onChange={f('batchNumber')} required />
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input className="input" type="number" min={0} value={form.quantity} onChange={f('quantity')} required />
            </div>
            <div>
              <label className="label">Expiration Date</label>
              <input className="input" type="date" value={form.expirationDate} onChange={f('expirationDate')} />
            </div>
            <div>
              <label className="label">Warehouse Location</label>
              <input className="input" placeholder="Aisle B, Shelf 3" value={form.warehouseLocation} onChange={f('warehouseLocation')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Batch'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
