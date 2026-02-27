import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, STATUS_TRANSITIONS } from '../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  customerId: '', currency: 'USD', taxRate: 0, notes: '',
  items: [{ productId: '', batchId: '', quantity: 1, unitPrice: 0 }],
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batchesMap, setBatchesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const [oRes, cRes, pRes] = await Promise.all([
        api.get('/orders', { params }),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setOrders(Array.isArray(oRes.data?.data) ? oRes.data.data : []);
      setCustomers(Array.isArray(cRes.data?.data) ? cRes.data.data : []);
      setProducts(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const loadBatches = async (productId) => {
    if (!productId || batchesMap[productId]) return;
    try {
      const res = await api.get(`/products/${productId}/batches`);
      setBatchesMap(prev => ({ ...prev, [productId]: Array.isArray(res.data?.data) ? res.data.data : [] }));
    } catch { /* ignore */ }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', batchId: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, value) => {
    setForm(f => {
      const items = f.items.map((item, idx) => idx === i ? { ...item, [key]: value } : item);
      // auto-fill price from product
      if (key === 'productId') {
        const prod = products.find(p => p._id === value);
        if (prod) items[i].unitPrice = prod.price;
        loadBatches(value);
      }
      return { ...f, items };
    });
  };

  const calcSubtotal = () => form.items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
  const calcTotal = () => { const s = calcSubtotal(); return s + (s * Number(form.taxRate) / 100); };

  const openAdd = () => { setForm(EMPTY_FORM); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, items: form.items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })) };
      await api.post('/orders', payload);
      toast.success('Order created');
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message || 'Failed to create order'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order ${newStatus}`);
      load();
      if (detailOrder?._id === orderId) setDetailOrder(prev => ({ ...prev, status: newStatus }));
    } catch (err) { toast.error(err.message || 'Status update failed'); }
  };

  const STATUSES = ['Pending', 'Approved', 'Shipped', 'Invoiced', 'Paid', 'Cancelled'];

  return (
    <Layout
      title="Orders"
      actions={<button onClick={openAdd} className="btn btn-accent">+ New Order</button>}
    >
      <div className="filter-bar">
        <select className="select max-w-[180px]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Customer</th>
                <th className="table-th">Items</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading…</td></tr>}
              {!loading && orders.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">No orders found</td></tr>}
              {orders.map(o => {
                const transitions = STATUS_TRANSITIONS[o.status] ?? [];
                return (
                  <tr key={o._id} className="table-row">
                    <td className="table-td font-medium">{o.customerId?.companyName ?? '—'}</td>
                    <td className="table-td text-gray-500">{o.items?.length ?? 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td className="table-td font-semibold">{formatCurrency(o.totalAmount, o.currency)}</td>
                    <td className="table-td"><StatusBadge status={o.status} /></td>
                    <td className="table-td text-gray-500">{formatDate(o.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setDetailOrder(o)} className="text-xs text-[#1a2e5a] hover:underline">View</button>
                        {transitions.map(t => (
                          <button key={t} onClick={() => updateStatus(o._id, t)} className="text-xs text-[#f07c1e] hover:underline">{t}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailOrder} onClose={() => setDetailOrder(null)} title="Order Details" size="lg">
        {detailOrder && (
          <>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{detailOrder.customerId?.companyName ?? '—'}</span></div>
                <div><span className="text-gray-500">Status:</span> <StatusBadge status={detailOrder.status} /></div>
                <div><span className="text-gray-500">Currency:</span> <span className="font-medium">{detailOrder.currency}</span></div>
                <div><span className="text-gray-500">Tax Rate:</span> <span className="font-medium">{detailOrder.taxRate}%</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(detailOrder.createdAt)}</span></div>
              </div>
              {detailOrder.notes && <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{detailOrder.notes}</div>}
              <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Product</th>
                    <th className="table-th">Qty</th>
                    <th className="table-th">Unit Price</th>
                    <th className="table-th">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailOrder.items?.map((it, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="table-td">{it.productId?.name ?? it.productId}</td>
                      <td className="table-td">{it.quantity}</td>
                      <td className="table-td">{formatCurrency(it.unitPrice, detailOrder.currency)}</td>
                      <td className="table-td font-semibold">{formatCurrency(it.total ?? it.quantity * it.unitPrice, detailOrder.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr><td colSpan={3} className="table-td text-right">Subtotal</td><td className="table-td">{formatCurrency(detailOrder.subtotal, detailOrder.currency)}</td></tr>
                  <tr><td colSpan={3} className="table-td text-right">Tax</td><td className="table-td">{formatCurrency(detailOrder.taxAmount, detailOrder.currency)}</td></tr>
                  <tr><td colSpan={3} className="table-td text-right text-[#1a2e5a]">Total</td><td className="table-td text-[#1a2e5a]">{formatCurrency(detailOrder.totalAmount, detailOrder.currency)}</td></tr>
                </tfoot>
              </table>
              {(STATUS_TRANSITIONS[detailOrder.status] ?? []).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-gray-500 self-center">Advance to:</span>
                  {(STATUS_TRANSITIONS[detailOrder.status] ?? []).map(t => (
                    <button key={t} onClick={() => updateStatus(detailOrder._id, t)} className="btn btn-outline text-xs py-1 px-3">
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setDetailOrder(null)} className="btn btn-outline">Close</button>
            </div>
          </>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Order" size="xl">
        <form onSubmit={handleSave}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Customer *</label>
                <select className="select" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tax Rate (%)</label>
                <input className="input" type="number" min={0} max={100} step={0.01} value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))} />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Line Items *</label>
                <button type="button" onClick={addItem} className="text-xs text-[#f07c1e] hover:underline">+ Add item</button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {i === 0 && <label className="label text-xs">Product</label>}
                      <select className="select text-sm" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                        <option value="">Select…</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="label text-xs">Batch</label>}
                      <select className="select text-sm" value={item.batchId} onChange={e => updateItem(i, 'batchId', e.target.value)}>
                        <option value="">Any</option>
                        {(batchesMap[item.productId] ?? []).map(b => <option key={b._id} value={b._id}>{b.batchNumber}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="label text-xs">Qty</label>}
                      <input className="input text-sm" type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="label text-xs">Unit Price</label>}
                      <input className="input text-sm" type="number" min={0} step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                    </div>
                    <div className="col-span-1 flex items-end">
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg leading-none pb-2">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-right space-y-1">
              <div>Subtotal: <span className="font-semibold">{formatCurrency(calcSubtotal())}</span></div>
              <div>Tax ({form.taxRate}%): <span className="font-semibold">{formatCurrency(calcSubtotal() * Number(form.taxRate) / 100)}</span></div>
              <div className="text-base font-bold text-[#1a2e5a]">Total: {formatCurrency(calcTotal())}</div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Order'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
