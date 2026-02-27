import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', CASNumber: '', UNNumber: '', hazardClassification: '',
  storageRequirements: '', sdsDocumentUrl: '', unitOfMeasure: 'kg',
  inventoryLevel: 0, reorderThreshold: 10, price: 0, currency: 'USD',
  isHazardous: false,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHazardous, setFilterHazardous] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importInput, setImportInput] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterHazardous !== '') params.isHazardous = filterHazardous;
      const res = await api.get('/products', { params });
      setProducts(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, filterHazardous]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name, CASNumber: p.CASNumber || '', UNNumber: p.UNNumber || '',
      hazardClassification: p.hazardClassification || '',
      storageRequirements: p.storageRequirements || '',
      sdsDocumentUrl: p.sdsDocumentUrl || '',
      unitOfMeasure: p.unitOfMeasure || 'kg',
      inventoryLevel: p.inventoryLevel ?? 0,
      reorderThreshold: p.reorderThreshold ?? 10,
      price: p.price ?? 0,
      currency: p.currency || 'USD',
      isHazardous: p.isHazardous ?? false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (p) => {
    try {
      await api.put(`/products/${p._id}`, { isArchived: !p.isArchived });
      toast.success(p.isArchived ? 'Product restored' : 'Product archived');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/products/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'products.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/products/import', fd);
      toast.success(`Imported ${res.data?.data?.imported ?? res.data?.imported ?? 0} products`);
      load();
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  const f = (key) => (e) => setForm(prev => ({
    ...prev,
    [key]: e.target.type === 'checkbox' ? e.target.checked
         : e.target.type === 'number' ? Number(e.target.value)
         : e.target.value,
  }));

  return (
    <Layout
      title="Products"
      actions={
        <>
          <button onClick={handleExport} className="btn btn-outline">Export CSV</button>
          <label className="btn btn-outline cursor-pointer">
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} ref={setImportInput} />
          </label>
          <button onClick={openAdd} className="btn btn-accent">+ Add Product</button>
        </>
      }
    >
      {/* Filters */}
      <div className="filter-bar">
        <input
          className="input max-w-xs"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select max-w-[160px]" value={filterHazardous} onChange={e => setFilterHazardous(e.target.value)}>
          <option value="">All products</option>
          <option value="true">Hazardous only</option>
          <option value="false">Non-hazardous</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Product</th>
                <th className="table-th">CAS #</th>
                <th className="table-th">Hazard</th>
                <th className="table-th">Inventory</th>
                <th className="table-th">Price</th>
                <th className="table-th">SDS</th>
                <th className="table-th">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loading && products.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No products found</td></tr>
              )}
              {products.map(p => (
                <tr key={p._id} className={`table-row ${p.isArchived ? 'opacity-50' : ''}`}>
                  <td className="table-td">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.unitOfMeasure}</div>
                  </td>
                  <td className="table-td text-gray-500 font-mono text-xs">{p.CASNumber || '—'}</td>
                  <td className="table-td">
                    {p.isHazardous ? (
                      <span className="badge badge-red">⚠ Hazardous</span>
                    ) : (
                      <span className="badge badge-green">Safe</span>
                    )}
                  </td>
                  <td className="table-td">
                    <span className={p.inventoryLevel <= p.reorderThreshold ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                      {p.inventoryLevel}
                    </span>
                    <span className="text-gray-400 text-xs"> / {p.reorderThreshold} min</span>
                  </td>
                  <td className="table-td">{formatCurrency(p.price, p.currency)}</td>
                  <td className="table-td">
                    {p.sdsDocumentUrl
                      ? <a href={p.sdsDocumentUrl} target="_blank" rel="noreferrer" className="text-[#f07c1e] hover:underline text-xs">View SDS</a>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="table-td">
                    <span className={`badge ${p.isArchived ? 'badge-gray' : 'badge-blue'}`}>
                      {p.isArchived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs text-[#1a2e5a] hover:underline">Edit</button>
                      <button onClick={() => toggleArchive(p)} className="text-xs text-gray-400 hover:underline">
                        {p.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="modal-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input className="input" value={form.name} onChange={f('name')} required />
            </div>
            <div>
              <label className="label">CAS Number</label>
              <input className="input font-mono" placeholder="7647-01-0" value={form.CASNumber} onChange={f('CASNumber')} />
            </div>
            <div>
              <label className="label">UN Number</label>
              <input className="input font-mono" placeholder="UN1789" value={form.UNNumber} onChange={f('UNNumber')} />
            </div>
            <div>
              <label className="label">Hazard Classification</label>
              <input className="input" placeholder="Class 8 Corrosive" value={form.hazardClassification} onChange={f('hazardClassification')} />
            </div>
            <div>
              <label className="label">Unit of Measure</label>
              <select className="select" value={form.unitOfMeasure} onChange={f('unitOfMeasure')}>
                {['kg', 'g', 'L', 'mL', 'ton', 'lb', 'unit'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Inventory Level</label>
              <input className="input" type="number" min={0} value={form.inventoryLevel} onChange={f('inventoryLevel')} />
            </div>
            <div>
              <label className="label">Reorder Threshold</label>
              <input className="input" type="number" min={0} value={form.reorderThreshold} onChange={f('reorderThreshold')} />
            </div>
            <div>
              <label className="label">Price</label>
              <input className="input" type="number" min={0} step="0.01" value={form.price} onChange={f('price')} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="select" value={form.currency} onChange={f('currency')}>
                {['USD', 'EUR', 'GBP', 'CAD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Storage Requirements</label>
              <input className="input" placeholder="Store in cool, dry place away from direct sunlight" value={form.storageRequirements} onChange={f('storageRequirements')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">SDS Document URL</label>
              <input className="input" type="url" placeholder="https://…" value={form.sdsDocumentUrl} onChange={f('sdsDocumentUrl')} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input id="hazardous" type="checkbox" checked={form.isHazardous} onChange={f('isHazardous')} className="w-4 h-4 accent-[#f07c1e]" />
              <label htmlFor="hazardous" className="text-sm font-medium text-gray-700">Mark as Hazardous Material</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
