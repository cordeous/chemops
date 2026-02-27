import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/client';
import Layout from '../components/Layout';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#1a2e5a', '#f07c1e', '#10b981', '#ef4444', '#6366f1', '#f59e0b'];

const TABS = [
  { id: 'sales', label: 'Sales Overview' },
  { id: 'top-customers', label: 'Top Customers' },
  { id: 'inventory-turnover', label: 'Inventory' },
  { id: 'expiration-risk', label: 'Expiration Risk' },
  { id: 'outstanding-receivables', label: 'Receivables' },
  { id: 'hazmat-sales', label: 'Hazmat Sales' },
];

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data[tab] !== undefined) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/${tab}`);
        setData(prev => ({ ...prev, [tab]: res.data?.data ?? [] }));
      } catch {
        toast.error('Failed to load report');
        setData(prev => ({ ...prev, [tab]: [] }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/export/orders', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const d = data[tab];

  // === SALES tab ===
  // API: [{ _id:{year,month}, revenue, orders }]
  const salesArr = tab === 'sales' && Array.isArray(d) ? d : [];
  const totalRevenue = salesArr.reduce((s, m) => s + (m.revenue ?? 0), 0);
  const totalOrders = salesArr.reduce((s, m) => s + (m.orders ?? 0), 0);
  const monthlyData = salesArr.map(m => ({
    month: `${m._id?.year ?? ''}-${String(m._id?.month ?? '').padStart(2, '0')}`,
    revenue: m.revenue ?? 0,
  }));

  return (
    <Layout
      title="Reports & Analytics"
      actions={<button onClick={handleExportCSV} className="btn btn-outline">Export Orders CSV</button>}
    >
      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-[#1a2e5a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >{t.label}</button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-64 text-gray-400">Loading report…</div>}

      {/* SALES */}
      {!loading && tab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Revenue</div>
              <div className="text-3xl font-bold text-[#1a2e5a]">{formatCurrency(totalRevenue)}</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Orders</div>
              <div className="text-3xl font-bold text-[#f07c1e]">{totalOrders}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">Monthly Revenue</div>
            <div className="p-4 h-72">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#f07c1e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No revenue data yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOP CUSTOMERS */}
      {/* API: [{ _id, companyName, totalSpend, orders }] */}
      {!loading && tab === 'top-customers' && (
        <div className="card overflow-hidden">
          <div className="card-header">Top Customers by Revenue</div>
          {!Array.isArray(d) || d.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-th">Rank</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Orders</th>
                  <th className="table-th">Revenue</th>
                </tr></thead>
                <tbody>
                  {d.map((c, i) => (
                    <tr key={c._id} className="table-row">
                      <td className="table-td font-bold text-[#f07c1e]">#{i + 1}</td>
                      <td className="table-td font-medium">{c.companyName}</td>
                      <td className="table-td">{c.orders}</td>
                      <td className="table-td font-semibold">{formatCurrency(c.totalSpend ?? c.totalRevenue ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INVENTORY TURNOVER */}
      {/* API: [{ _id, name, inventoryLevel, reorderThreshold, price, unitOfMeasure }] */}
      {!loading && tab === 'inventory-turnover' && (
        <div className="card overflow-hidden">
          <div className="card-header">Inventory Levels</div>
          {!Array.isArray(d) || d.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No data yet</div>
          ) : (
            <>
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                    <Tooltip />
                    <Bar dataKey="inventoryLevel" name="Stock" fill="#1a2e5a" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="reorderThreshold" name="Min" fill="#f07c1e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">Product</th>
                    <th className="table-th">Stock</th>
                    <th className="table-th">Min Threshold</th>
                    <th className="table-th">Unit</th>
                    <th className="table-th">Price</th>
                  </tr></thead>
                  <tbody>
                    {d.map(p => (
                      <tr key={p._id} className="table-row">
                        <td className="table-td font-medium">{p.name}</td>
                        <td className={`table-td font-semibold ${p.inventoryLevel <= p.reorderThreshold ? 'text-red-600' : 'text-gray-800'}`}>{p.inventoryLevel}</td>
                        <td className="table-td text-gray-500">{p.reorderThreshold}</td>
                        <td className="table-td text-gray-500">{p.unitOfMeasure}</td>
                        <td className="table-td">{formatCurrency(p.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* EXPIRATION RISK */}
      {/* API: [] (batches expiring soon) */}
      {!loading && tab === 'expiration-risk' && (
        <div className="card overflow-hidden">
          <div className="card-header">Batches Expiring Within 60 Days</div>
          {!Array.isArray(d) || d.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No expiring batches found ✓</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-th">Batch</th>
                  <th className="table-th">Product</th>
                  <th className="table-th">Quantity</th>
                  <th className="table-th">Expires</th>
                  <th className="table-th">Days Left</th>
                </tr></thead>
                <tbody>
                  {d.map(b => {
                    const days = b.expirationDate ? Math.floor((new Date(b.expirationDate) - Date.now()) / 86400000) : null;
                    return (
                      <tr key={b._id} className="table-row">
                        <td className="table-td font-mono">{b.batchNumber}</td>
                        <td className="table-td">{b.productId?.name ?? '—'}</td>
                        <td className="table-td">{b.quantity}</td>
                        <td className="table-td">{b.expirationDate ? new Date(b.expirationDate).toLocaleDateString() : '—'}</td>
                        <td className="table-td">
                          {days !== null && (
                            <span className={`badge ${days < 0 ? 'badge-red' : days <= 30 ? 'badge-orange' : 'badge-yellow'}`}>
                              {days < 0 ? 'Expired' : `${days}d`}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* OUTSTANDING RECEIVABLES */}
      {/* API: [invoices...] */}
      {!loading && tab === 'outstanding-receivables' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Outstanding</div>
              <div className="text-3xl font-bold text-[#1a2e5a]">
                {formatCurrency(Array.isArray(d) ? d.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0) : 0)}
              </div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Overdue</div>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(Array.isArray(d) ? d.filter(inv => inv.status === 'Overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date())).reduce((s, inv) => s + (inv.totalAmount ?? 0), 0) : 0)}
              </div>
            </div>
          </div>
          {Array.isArray(d) && d.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">Outstanding Invoices</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">Invoice #</th>
                    <th className="table-th">Customer</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Due Date</th>
                    <th className="table-th">Status</th>
                  </tr></thead>
                  <tbody>
                    {d.map(inv => (
                      <tr key={inv._id} className="table-row">
                        <td className="table-td font-mono">{inv.invoiceNumber}</td>
                        <td className="table-td">{inv.orderId?.customerId?.companyName ?? '—'}</td>
                        <td className="table-td font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                        <td className="table-td">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                        <td className="table-td"><span className="badge badge-orange">{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(!Array.isArray(d) || d.length === 0) && (
            <div className="card py-12 text-center text-gray-400">No outstanding invoices ✓</div>
          )}
        </div>
      )}

      {/* HAZMAT SALES */}
      {/* API: [{ _id, name, hazardClass, totalRevenue, totalQty }] */}
      {!loading && tab === 'hazmat-sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Hazmat Revenue</div>
              <div className="text-3xl font-bold text-[#1a2e5a]">
                {formatCurrency(Array.isArray(d) ? d.reduce((s, p) => s + (p.totalRevenue ?? 0), 0) : 0)}
              </div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Hazmat Products</div>
              <div className="text-3xl font-bold text-[#f07c1e]">{Array.isArray(d) ? d.length : 0}</div>
            </div>
          </div>
          {Array.isArray(d) && d.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">Hazmat Products by Revenue</div>
              <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={v => formatCurrency(v)} />
                    <Bar dataKey="totalRevenue" name="Revenue" fill="#f07c1e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">Product</th>
                    <th className="table-th">Hazard Class</th>
                    <th className="table-th">Qty Sold</th>
                    <th className="table-th">Revenue</th>
                  </tr></thead>
                  <tbody>
                    {d.map(p => (
                      <tr key={p._id} className="table-row">
                        <td className="table-td font-medium">{p.name}</td>
                        <td className="table-td text-gray-500">{p.hazardClass ?? '—'}</td>
                        <td className="table-td">{p.totalQty}</td>
                        <td className="table-td font-semibold">{formatCurrency(p.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(!Array.isArray(d) || d.length === 0) && (
            <div className="card py-12 text-center text-gray-400">No hazmat sales data yet</div>
          )}
        </div>
      )}
    </Layout>
  );
}
