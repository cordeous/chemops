import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

const PIE_COLORS = ['#f07c1e', '#1a2e5a', '#10b981', '#ef4444', '#6366f1'];

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: accent + '15' }}>
        {icon}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safe = (p) => p.catch(() => ({ data: null }));
    Promise.all([
      safe(api.get('/reports/sales')),
      safe(api.get('/reports/outstanding-receivables')),
      safe(api.get('/orders')),
      safe(api.get('/admin/alerts')),
      safe(api.get('/admin/users')),
      safe(api.get('/audit')),
    ]).then(([salesRes, outRes, ordersRes, alertsRes, usersRes, auditRes]) => {
      const salesArr = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
      const outArr = Array.isArray(outRes.data?.data) ? outRes.data.data : [];
      const orders = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : [];
      const lowStock = Array.isArray(alertsRes.data?.data?.lowStock) ? alertsRes.data.data.lowStock : [];
      const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
      const auditLogs = Array.isArray(auditRes.data?.data) ? auditRes.data.data : [];

      const totalRevenue = salesArr.reduce((s, m) => s + (m.revenue ?? 0), 0);
      const totalOutstanding = outArr.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
      const monthly = salesArr.map(m => ({
        month: `${m._id?.year ?? ''}-${String(m._id?.month ?? '').padStart(2, '0')}`,
        revenue: m.revenue ?? 0,
      }));
      const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {});
      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      setData({ totalRevenue, totalOrders: orders.length, totalOutstanding, lowStock, users, auditLogs, orders: orders.slice(0, 6), monthly, byStatus });
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} sub="All time" icon="💰" accent="#1a2e5a" />
        <StatCard label="Total Orders" value={data.totalOrders} sub="All statuses" icon="📦" accent="#f07c1e" />
        <StatCard label="Outstanding" value={formatCurrency(data.totalOutstanding)} sub="Unpaid invoices" icon="📄" accent="#ef4444" />
        <StatCard label="Low Stock" value={data.lowStock.length} sub={data.lowStock.length === 0 ? 'All OK' : 'Need reorder'} icon="⚠️" accent={data.lowStock.length ? '#ef4444' : '#10b981'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="card-header"><span className="card-title">Monthly Revenue</span></div>
          <div className="p-4 h-60">
            {data.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#f07c1e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No revenue data yet</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Orders by Status</span></div>
          <div className="p-4 h-60">
            {data.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byStatus} dataKey="count" nameKey="status" cx="50%" cy="45%" outerRadius={75} innerRadius={35}>
                    {data.byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No orders yet</div>}
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <span className="card-title">Recent Orders</span>
            <Link to="/orders" className="text-xs text-[#f07c1e] hover:underline font-medium">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">Customer</th>
                <th className="table-th">Total</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
              </tr></thead>
              <tbody>
                {data.orders.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">No orders</td></tr>}
                {data.orders.map(o => (
                  <tr key={o._id} className="table-row">
                    <td className="table-td font-medium">{o.customerId?.companyName ?? '—'}</td>
                    <td className="table-td">{formatCurrency(o.totalAmount)}</td>
                    <td className="table-td"><StatusBadge status={o.status} /></td>
                    <td className="table-td text-gray-400">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions + alerts */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</div>
            <div className="space-y-2">
              <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a2e5a]/5 hover:bg-[#1a2e5a]/10 transition-colors group">
                <span className="text-sm">👤</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#1a2e5a]">Manage Users</span>
              </Link>
              <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                <span className="text-sm">🔗</span>
                <span className="text-sm font-medium text-gray-700">Manage Webhooks</span>
              </Link>
              <Link to="/compliance" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                <span className="text-sm">🛡</span>
                <span className="text-sm font-medium text-gray-700">Review Compliance</span>
              </Link>
              <Link to="/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                <span className="text-sm">📊</span>
                <span className="text-sm font-medium text-gray-700">View Reports</span>
              </Link>
            </div>
          </div>

          {data.lowStock.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⚠️</span>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Low Stock Alert</span>
              </div>
              <div className="space-y-2">
                {data.lowStock.slice(0, 4).map(p => (
                  <div key={p._id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate">{p.name}</span>
                    <span className="font-bold text-red-600 ml-2">{p.inventoryLevel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System users */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">System Users ({data.users.length})</span>
          <Link to="/admin" className="text-xs text-[#f07c1e] hover:underline">Manage →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="table-th">Name</th><th className="table-th">Email</th><th className="table-th">Role</th><th className="table-th">Status</th>
            </tr></thead>
            <tbody>
              {data.users.map(u => (
                <tr key={u._id} className="table-row">
                  <td className="table-td font-medium">{u.name}</td>
                  <td className="table-td text-gray-500">{u.email}</td>
                  <td className="table-td"><StatusBadge status={u.role} /></td>
                  <td className="table-td"><span className={`badge ${u.isActive ? 'badge-green' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
