import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

const PIE_COLORS = ['#f07c1e', '#1a2e5a', '#10b981', '#ef4444', '#6366f1', '#f59e0b'];
const ROLE_COLORS = { Admin: '#f07c1e', Sales: '#3b82f6', Finance: '#10b981', Compliance: '#8b5cf6' };

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-5" style={{ borderTop: '3px solid ' + color }}>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safe = (p) => p.catch(() => ({ data: null }));
    Promise.all([
      safe(api.get('/reports/sales')),
      safe(api.get('/reports/outstanding-receivables')),
      safe(api.get('/reports/top-customers')),
      safe(api.get('/orders')),
      safe(api.get('/admin/alerts')),
      safe(api.get('/admin/users')),
      safe(api.get('/audit')),
    ]).then(([salesRes, outRes, topCustRes, ordersRes, alertsRes, usersRes, auditRes]) => {
      const salesArr = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
      const outArr = Array.isArray(outRes.data?.data) ? outRes.data.data : [];
      const topCustomers = Array.isArray(topCustRes.data?.data) ? topCustRes.data.data : [];
      const orders = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : [];
      const lowStock = Array.isArray(alertsRes.data?.data?.lowStock) ? alertsRes.data.data.lowStock : [];
      const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
      const auditLogs = Array.isArray(auditRes.data?.data) ? auditRes.data.data : [];

      const totalRevenue = salesArr.reduce((s, m) => s + (m.revenue ?? 0), 0);
      const totalOrders = salesArr.reduce((s, m) => s + (m.orders ?? 0), 0);
      const totalOutstanding = outArr.reduce((s, i) => s + (i.totalAmount ?? 0), 0);

      const monthly = salesArr.map(m => ({
        month: String(m._id?.month ?? '').padStart(2, '0') + '/' + String(m._id?.year ?? '').slice(-2),
        revenue: m.revenue ?? 0,
        orders: m.orders ?? 0,
      }));

      let cum = 0;
      const cumulative = monthly.map(m => { cum += m.revenue; return { ...m, cumRevenue: cum }; });
      const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {});
      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      setData({ totalRevenue, totalOrders, totalOutstanding, lowStock, users, auditLogs, orders: orders.slice(0, 6), monthly, cumulative, byStatus, topCustomers: topCustomers.slice(0, 5) });
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#f07c1e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <div className="text-gray-400 text-sm">Loading dashboard...</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} sub="All time" color="#f07c1e" />
        <StatCard label="Total Orders" value={data.totalOrders} sub="All statuses" color="#1a2e5a" />
        <StatCard label="Outstanding" value={formatCurrency(data.totalOutstanding)} sub="Unpaid invoices" color="#ef4444" />
        <StatCard label="Low Stock Items" value={data.lowStock.length} sub={data.lowStock.length === 0 ? 'All stocked' : 'Need reorder'} color={data.lowStock.length ? '#ef4444' : '#10b981'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="card-header"><span className="card-title">Revenue and Orders — Monthly</span></div>
          <div className="p-4 h-64">
            {data.monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly} barSize={20} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#f07c1e" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="ord" dataKey="orders" name="Orders" fill="#1a2e5a" radius={[3, 3, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No revenue data yet</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Orders by Status</span></div>
          <div className="p-4 h-64">
            {data.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byStatus} dataKey="count" nameKey="status" cx="50%" cy="42%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                    {data.byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No orders yet</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Cumulative Revenue Growth</span></div>
        <div className="p-4 h-52">
          {data.cumulative.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cumulative}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a2e5a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1a2e5a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cumRevenue" name="Cumulative Revenue" stroke="#1a2e5a" strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: '#1a2e5a' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="card-header">
            <span className="card-title">Recent Orders</span>
            <Link to="/orders" className="text-xs text-[#f07c1e] hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">Customer</th><th className="table-th">Total</th><th className="table-th">Status</th><th className="table-th">Date</th>
              </tr></thead>
              <tbody>
                {data.orders.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">No orders</td></tr>}
                {data.orders.map(o => (
                  <tr key={o._id} className="table-row">
                    <td className="table-td font-medium">{o.customerId?.companyName ?? '-'}</td>
                    <td className="table-td">{formatCurrency(o.totalAmount)}</td>
                    <td className="table-td"><StatusBadge status={o.status} /></td>
                    <td className="table-td text-gray-400">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          {data.topCustomers.length > 0 && (
            <div className="card p-5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Top Customers</div>
              <div className="space-y-2">
                {data.topCustomers.map((c, i) => {
                  const maxSpend = data.topCustomers[0]?.totalSpend ?? 1;
                  return (
                    <div key={c._id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700 font-medium truncate">{c.companyName ?? ('Customer ' + (i + 1))}</span>
                        <span className="text-gray-500 ml-2 flex-shrink-0">{formatCurrency(c.totalSpend)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 rounded-full bg-[#f07c1e]" style={{ width: (c.totalSpend / maxSpend * 100) + '%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</div>
            <div className="space-y-2">
              {[
                { to: '/admin', label: 'Manage Users', path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
                { to: '/admin', label: 'Feature Flags', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                { to: '/compliance', label: 'Compliance', path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { to: '/reports', label: 'Analytics', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              ].map(a => (
                <Link key={a.label} to={a.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-[#1a2e5a] transition-colors group">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#1a2e5a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    {a.path.split(' M').map((d, i) => (
                      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={i === 0 ? d : 'M' + d} />
                    ))}
                  </svg>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#1a2e5a]">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {data.lowStock.length > 0 && (
            <div className="card p-5 border-l-4 border-amber-400">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">⚠️</span>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Low Stock Alert</span>
              </div>
              {data.lowStock.slice(0, 4).map(p => (
                <div key={p._id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700 truncate">{p.name}</span>
                  <span className="font-bold text-red-600 ml-2">{p.inventoryLevel}/{p.reorderThreshold}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <span className="card-title">System Users</span>
            <Link to="/admin" className="text-xs text-[#f07c1e] hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.users.map(u => (
              <div key={u._id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: ROLE_COLORS[u.role] ?? '#1a2e5a' }}>
                    {u.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{u.name}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ background: ROLE_COLORS[u.role] ?? '#6b7280' }}>{u.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {u.isActive ? 'Active' : 'Off'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Audit Log</span>
            <Link to="/admin" className="text-xs text-[#f07c1e] hover:underline">Full log</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.auditLogs.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">No audit entries yet</div>}
            {data.auditLogs.slice(0, 8).map(log => (
              <div key={log._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{log.action} <span className="text-gray-400 font-normal">{log.entityType}</span></div>
                  <div className="text-xs text-gray-400">{log.userId?.name ?? 'System'} · {formatDate(log.timestamp ?? log.createdAt)}</div>
                </div>
                <span className="text-xs font-mono text-gray-300">{String(log.entityId).slice(-6)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
