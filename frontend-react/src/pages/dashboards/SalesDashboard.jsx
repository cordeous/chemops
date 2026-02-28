import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDate, STATUS_TRANSITIONS } from '../../utils/format';
import toast from 'react-hot-toast';

const STATUS_COLORS = { Pending: '#f59e0b', Approved: '#3b82f6', Shipped: '#6366f1', Invoiced: '#8b5cf6', Paid: '#10b981', Cancelled: '#ef4444' };

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
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
          {p.name}: {typeof p.value === 'number' && p.value > 500 ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function SalesDashboard() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const safe = (p) => p.catch(() => ({ data: null }));
    const [ordersRes, custRes, salesRes, topCustRes] = await Promise.all([
      safe(api.get('/orders')),
      safe(api.get('/customers')),
      safe(api.get('/reports/sales')),
      safe(api.get('/reports/top-customers')),
    ]);
    setOrders(Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : []);
    setCustomers(Array.isArray(custRes.data?.data) ? custRes.data.data : []);
    const arr = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
    setSalesData(arr.map(m => ({
      month: String(m._id?.month ?? '').padStart(2, '0') + '/' + String(m._id?.year ?? '').slice(-2),
      revenue: m.revenue ?? 0,
      orders: m.orders ?? 0,
    })));
    setTopCustomers(Array.isArray(topCustRes.data?.data) ? topCustRes.data.data.slice(0, 5) : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put('/orders/' + orderId + '/status', { status });
      toast.success('Order moved to ' + status);
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pending = orders.filter(o => o.status === 'Pending');
  const active = orders.filter(o => ['Approved', 'Shipped'].includes(o.status));
  const totalRevenue = salesData.reduce((s, m) => s + m.revenue, 0);
  const verifiedCustomers = customers.filter(c => c.complianceStatus === 'Verified').length;

  const statusDist = Object.entries(
    orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Period Revenue" value={formatCurrency(totalRevenue)} sub="From all orders" color="#f07c1e" />
        <StatCard label="Pending Orders" value={pending.length} sub="Need approval" color="#f59e0b" />
        <StatCard label="Active Orders" value={active.length} sub="In progress" color="#3b82f6" />
        <StatCard label="Verified Customers" value={verifiedCustomers} sub={'of ' + customers.length + ' total'} color="#10b981" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="card-header"><span className="card-title">Monthly Sales Performance</span></div>
          <div className="p-4 h-64">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} barSize={18} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar yAxisId="rev" dataKey="revenue" name="Revenue ($)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="ord" dataKey="orders" name="Orders (#)" fill="#f07c1e" radius={[3, 3, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No sales data yet</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Pipeline Distribution</span></div>
          <div className="p-4 h-64">
            {statusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="count" nameKey="status" cx="50%" cy="42%" outerRadius={80} innerRadius={42} paddingAngle={3}>
                    {statusDist.map((d, i) => <Cell key={i} fill={STATUS_COLORS[d.status] ?? '#9ca3af'} />)}
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
        <div className="card-header"><span className="card-title">Revenue Trend</span></div>
        <div className="p-4 h-48">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGrad)" dot={{ r: 3, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending — Action Required</span>
            <Link to="/orders" className="text-xs text-[#f07c1e] hover:underline">All orders</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pending.length === 0 && <div className="py-10 text-center text-gray-400 text-sm">No pending orders</div>}
            {pending.slice(0, 6).map(o => (
              <div key={o._id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{o.customerId?.companyName ?? '-'}</div>
                  <div className="text-xs text-gray-400">{formatCurrency(o.totalAmount)} · {o.items?.length ?? 0} items · {formatDate(o.createdAt)}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {(STATUS_TRANSITIONS[o.status] ?? []).map(t => (
                    <button key={t} onClick={() => updateStatus(o._id, t)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        t === 'Approved' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                        t === 'Cancelled' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
                        'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Customers by Revenue</span>
            <Link to="/customers" className="text-xs text-[#f07c1e] hover:underline">All customers</Link>
          </div>
          <div className="p-5">
            {topCustomers.length > 0 ? (
              <div className="space-y-4">
                {topCustomers.map((c, i) => {
                  const maxSpend = topCustomers[0]?.totalSpend ?? 1;
                  return (
                    <div key={c._id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                          <span className="font-medium text-gray-800 truncate">{c.companyName ?? 'Unknown'}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="font-semibold text-gray-800">{formatCurrency(c.totalSpend)}</div>
                          <div className="text-xs text-gray-400">{c.orders} orders</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: (c.totalSpend / maxSpend * 100) + '%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {customers.slice(0, 5).map(c => (
                  <div key={c._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="font-medium text-sm text-gray-800">{c.companyName}</div>
                    <StatusBadge status={c.complianceStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</div>
        <div className="flex flex-wrap gap-3">
          <Link to="/orders" className="btn btn-accent">+ New Order</Link>
          <Link to="/customers" className="btn btn-outline">+ New Customer</Link>
          <Link to="/products" className="btn btn-outline">Browse Products</Link>
          <Link to="/reports" className="btn btn-ghost">Sales Reports</Link>
          <Link to="/invoices" className="btn btn-ghost">Invoices</Link>
        </div>
      </div>
    </div>
  );
}
