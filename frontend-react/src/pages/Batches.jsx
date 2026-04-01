import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ErrorState from '../components/ErrorState';
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
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, pRes] = await Promise.all([
        api.get('/batches', { params: filterProduct ? { productId: filterProduct } : {} }),
        api.get('/products'),
      ]);
      setBatches(Array.isArray(bRes.data?.data) ? bRes.data.data : []);
      setProducts(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
    } catch (err) { setError(err.message || 'Failed to load batches'); }
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
      {error && <ErrorState message={error} onRetry={load} />}

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
                <th scope="col" className="table-th">Batch #</th>
                <th scope="col" className="table-th">Product</th>
                <th scope="col" className="table-th">Quantity</th>
                <th scope="col" className="table-th">Location</th>
                <th scope="col" className="table-th">Expiration</th>
                <th scope="col" className="table-th"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody aria-live="polite" aria-busy={loading}>
              {loading && <tr><td colSpan={6} className="py-12 text-center text-gray-400" aria-label="Loading batches">Loading…</td></tr>}
              {!loading && batches.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <span className="text-sm">No batches found</span>
                    <button onClick={openAdd} className="btn btn-accent btn-sm mt-1">Add your first batch</button>
                  </div>
                </td></tr>
              )}
              {batches.map(b => (
                <tr key={b._id} className="table-row">
                  <td className="table-td font-mono font-medium max-w-[120px] truncate" title={b.batchNumber}>{b.batchNumber || '—'}</td>
                  <td className="table-td max-w-[160px] truncate" title={b.productId?.name}>{b.productId?.name ?? '—'}</td>
                  <td className="table-td">{b.quantity ?? 0} {b.productId?.unitOfMeasure}</td>
                  <td className="table-td text-gray-500 max-w-[120px] truncate" title={b.warehouseLocation}>{b.warehouseLocation || '—'}</td>
                  <td className="table-td">{expiryBadge(b.expirationDate)}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(b)} className="btn btn-ghost btn-xs min-h-[36px]" aria-label={`Edit batch ${b.batchNumber}`}>Edit</button>
                      <button onClick={() => setConfirmId(b._id)} className="btn btn-ghost btn-xs min-h-[36px] text-red-400 hover:text-red-600 hover:bg-red-50" aria-label={`Delete batch ${b.batchNumber}`}>Delete</button>
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
              <input className="input font-mono" value={form.batchNumber} onChange={f('batchNumber')} required maxLength={50} />
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
              <input className="input" placeholder="Aisle B, Shelf 3" value={form.warehouseLocation} onChange={f('warehouseLocation')} maxLength={100} />
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
