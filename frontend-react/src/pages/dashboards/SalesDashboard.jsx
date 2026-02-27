import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDate, STATUS_TRANSITIONS } from '../../utils/format';
import toast from 'react-hot-toast';

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: accent + '18' }}>
        {icon}
      </div>
    </div>
  );
}

export default function SalesDashboard() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const safe = (p) => p.catch(() => ({ data: null }));
    const [ordersRes, custRes, salesRes] = await Promise.all([
      safe(api.get('/orders')),
      safe(api.get('/customers')),
      safe(api.get('/reports/sales')),
    ]);
    setOrders(Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : []);
    setCustomers(Array.isArray(custRes.data?.data) ? custRes.data.data : []);
    const arr = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
    setSalesData(arr.map(m => ({ month: `${m._id?.year}-${String(m._id?.month).padStart(2,'0')}`, revenue: m.revenue ?? 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order → ${status}`);
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;

  const pending = orders.filter(o => o.status === 'Pending');
  const active = orders.filter(o => ['Approved', 'Shipped'].includes(o.status));
  const totalRevenue = salesData.reduce((s, m) => s + m.revenue, 0);
  const verifiedCustomers = customers.filter(c => c.complianceStatus === 'Verified').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Revenue (MTD)" value={formatCurrency(totalRevenue)} sub="This period" icon="💰" accent="#f07c1e" />
        <StatCard label="Pending Orders" value={pending.length} sub="Awaiting approval" icon="⏳" accent="#f59e0b" />
        <StatCard label="Active Orders" value={active.length} sub="In progress" icon="🚚" accent="#3b82f6" />
        <StatCard label="Verified Customers" value={verifiedCustomers} sub={`of ${customers.length} total`} icon="✅" accent="#10b981" />
      </div>

      {/* Revenue chart */}
      <div className="card">
        <div className="card-header"><span className="card-title">Sales Performance</span></div>
        <div className="p-4 h-56">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#f07c1e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No revenue data</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Pending orders — needs action */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Orders</span>
            <Link to="/orders" className="text-xs text-[#f07c1e] hover:underline">All orders →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pending.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">No pending orders ✓</div>}
            {pending.slice(0, 5).map(o => (
              <div key={o._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{o.customerId?.companyName ?? '—'}</div>
                  <div className="text-xs text-gray-400">{formatCurrency(o.totalAmount)} · {formatDate(o.createdAt)}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {(STATUS_TRANSITIONS[o.status] ?? []).map(t => (
                    <button key={t} onClick={() => updateStatus(o._id, t)}
                      className={`btn btn-sm ${t === 'Approved' ? 'btn-primary' : t === 'Cancelled' ? 'btn-danger' : 'btn-outline'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Customers</span>
            <Link to="/customers" className="text-xs text-[#f07c1e] hover:underline">Manage →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">Company</th>
                <th className="table-th">Status</th>
                <th className="table-th">Orders</th>
              </tr></thead>
              <tbody>
                {customers.slice(0, 6).map(c => (
                  <tr key={c._id} className="table-row">
                    <td className="table-td font-medium">{c.companyName}</td>
                    <td className="table-td"><StatusBadge status={c.complianceStatus} /></td>
                    <td className="table-td text-gray-400">{orders.filter(o => o.customerId?._id === c._id || o.customerId === c._id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</div>
        <div className="flex flex-wrap gap-3">
          <Link to="/orders" className="btn btn-accent">+ New Order</Link>
          <Link to="/customers" className="btn btn-outline">+ New Customer</Link>
          <Link to="/products" className="btn btn-outline">View Products</Link>
          <Link to="/reports" className="btn btn-ghost">Sales Reports</Link>
        </div>
      </div>
    </div>
  );
}
