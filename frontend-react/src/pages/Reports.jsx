import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/client';
import Layout from '../components/Layout';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#1a2e5a', '#f07c1e', '#10b981', '#ef4444', '#6366f1', '#f59e0b'];

const TABS = [
  { id: 'sales', label: 'Sales Overview' },
  { id: 'top-customers', label: 'Top Customers' },
  { id: 'inventory-turnover', label: 'Inventory Turnover' },
  { id: 'expiration-risk', label: 'Expiration Risk' },
  { id: 'outstanding-receivables', label: 'Outstanding Receivables' },
  { id: 'hazmat-sales', label: 'Hazmat Sales' },
];

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/${tab}`);
        setData(prev => ({ ...prev, [tab]: res.data }));
      } catch (err) {
        toast.error('Failed to load report');
        setData(prev => ({ ...prev, [tab]: null }));
      } finally { setLoading(false); }
    };
    if (!data[tab]) load();
  }, [tab]);

  const handleExportCSV = async () => {
    try {
      const res = await api.get(`/export/orders`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const d = data[tab];

  return (
    <Layout
      title="Reports & Analytics"
      actions={<button onClick={handleExportCSV} className="btn btn-outline">Export Orders CSV</button>}
    >
      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-[#1a2e5a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center h-64 text-gray-400">Loading report…</div>}

      {!loading && tab === 'sales' && d && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-[#1a2e5a]">{formatCurrency(d.totalRevenue)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active Orders</div>
              <div className="text-2xl font-bold text-[#f07c1e]">{d.activeOrders ?? 0}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Order Value</div>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(d.avgOrderValue ?? 0)}</div>
            </div>
          </div>
          {d.monthly?.length > 0 && (
            <div className="card">
              <div className="card-header">Monthly Revenue</div>
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#f07c1e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {d.byStatus?.length > 0 && (
            <div className="card">
              <div className="card-header">Orders by Status</div>
              <div className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                      {d.byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'top-customers' && d && (
        <div className="card">
          <div className="card-header">Top Customers by Revenue</div>
          {d.length === 0 ? (
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
                    <tr key={i} className="table-row">
                      <td className="table-td font-bold text-[#f07c1e]">#{i+1}</td>
                      <td className="table-td font-medium">{c.companyName}</td>
                      <td className="table-td">{c.orderCount}</td>
                      <td className="table-td font-semibold">{formatCurrency(c.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'inventory-turnover' && d && (
        <div className="card">
          <div className="card-header">Inventory Turnover</div>
          {(!d.turnover || d.turnover.length === 0) ? (
            <div className="py-12 text-center text-gray-400">No data yet</div>
          ) : (
            <div className="p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.turnover} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="turnover" fill="#1a2e5a" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'expiration-risk' && d && (
        <div className="card">
          <div className="card-header">Expiration Risk — Batches expiring within 60 days</div>
          {(!d.batches || d.batches.length === 0) ? (
            <div className="py-12 text-center text-gray-400">No expiring batches</div>
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
                  {d.batches.map(b => {
                    const days = Math.floor((new Date(b.expirationDate) - Date.now()) / 86400000);
                    return (
                      <tr key={b._id} className="table-row">
                        <td className="table-td font-mono">{b.batchNumber}</td>
                        <td className="table-td">{b.productId?.name ?? '—'}</td>
                        <td className="table-td">{b.quantity}</td>
                        <td className="table-td">{b.expirationDate ? new Date(b.expirationDate).toLocaleDateString() : '—'}</td>
                        <td className="table-td">
                          <span className={`badge ${days < 0 ? 'badge-red' : days <= 30 ? 'badge-orange' : 'badge-yellow'}`}>
                            {days < 0 ? 'Expired' : `${days}d`}
                          </span>
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

      {!loading && tab === 'outstanding-receivables' && d && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Outstanding</div>
              <div className="text-2xl font-bold text-[#1a2e5a]">{formatCurrency(d.totalOutstanding)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Overdue Amount</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(d.overdueAmount ?? 0)}</div>
            </div>
          </div>
          {d.invoices?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">Outstanding Invoices</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">Invoice #</th>
                    <th className="table-th">Amount</th>
                    <th className="table-th">Due Date</th>
                    <th className="table-th">Status</th>
                  </tr></thead>
                  <tbody>
                    {d.invoices.map(inv => (
                      <tr key={inv._id} className="table-row">
                        <td className="table-td font-mono">{inv.invoiceNumber}</td>
                        <td className="table-td font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                        <td className="table-td">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</td>
                        <td className="table-td"><span className={`badge badge-${inv.status === 'Overdue' ? 'red' : 'orange'}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'hazmat-sales' && d && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Hazmat Revenue</div>
              <div className="text-2xl font-bold text-[#1a2e5a]">{formatCurrency(d.hazmatRevenue)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">% of Total Revenue</div>
              <div className="text-2xl font-bold text-[#f07c1e]">{(d.percentOfTotal ?? 0).toFixed(1)}%</div>
            </div>
          </div>
          {d.products?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">Top Hazmat Products</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-th">Product</th>
                    <th className="table-th">Units Sold</th>
                    <th className="table-th">Revenue</th>
                  </tr></thead>
                  <tbody>
                    {d.products.map((p, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-td font-medium">{p.name}</td>
                        <td className="table-td">{p.unitsSold}</td>
                        <td className="table-td font-semibold">{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
