import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/client';
import Layout from '../components/Layout';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';

const PIE_COLORS = ['#f07c1e', '#1a2e5a', '#10b981', '#ef4444', '#6366f1'];

export default function Dashboard() {
  const [kpis, setKpis] = useState({ revenue: 0, activeOrders: 0, lowStockCount: 0, outstandingInvoices: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safe = (p) => p.catch(() => ({ data: null }));

    const load = async () => {
      const [salesRes, outstandingRes, ordersRes, alertsRes] = await Promise.all([
        safe(api.get('/reports/sales')),
        safe(api.get('/reports/outstanding-receivables')),
        safe(api.get('/orders')),
        safe(api.get('/admin/alerts')),
      ]);

      // /reports/sales → { data: [{ _id:{year,month}, revenue, orders }] }
      const salesArr = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
      const totalRevenue = salesArr.reduce((s, m) => s + (m.revenue ?? 0), 0);
      const totalOrders = salesArr.reduce((s, m) => s + (m.orders ?? 0), 0);
      const monthly = salesArr.map(m => ({
        month: `${m._id?.year ?? ''}-${String(m._id?.month ?? '').padStart(2, '0')}`,
        revenue: m.revenue ?? 0,
      }));

      // /reports/outstanding-receivables → { data: [invoices...] }
      const outArr = Array.isArray(outstandingRes.data?.data) ? outstandingRes.data.data : [];
      const totalOutstanding = outArr.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);

      // /orders → { data: [...] }
      const orders = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : [];

      // /admin/alerts → { data: { lowStock: [...] } }
      const lowStockArr = Array.isArray(alertsRes.data?.data?.lowStock) ? alertsRes.data.data.lowStock : [];

      // build orders-by-status from the orders list
      const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      }, {});
      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      setKpis({ revenue: totalRevenue, activeOrders: totalOrders, lowStockCount: lowStockArr.length, outstandingInvoices: totalOutstanding });
      setMonthlyRevenue(monthly);
      setOrdersByStatus(byStatus);
      setRecentOrders(orders.slice(0, 5));
      setLowStock(lowStockArr);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <Layout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue" value={formatCurrency(kpis.revenue)} icon="💰" color="blue" />
            <KpiCard label="Active Orders" value={kpis.activeOrders} icon="📦" color="orange" />
            <KpiCard label="Low Stock Items" value={kpis.lowStockCount} icon="⚠️" color="red" />
            <KpiCard label="Outstanding Invoices" value={formatCurrency(kpis.outstandingInvoices)} icon="📄" color="green" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card xl:col-span-2">
              <div className="card-header">Monthly Revenue</div>
              <div className="p-4 h-64">
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="#f07c1e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No revenue data yet</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">Orders by Status</div>
              <div className="p-4 h-64">
                {ordersByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">No orders yet</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="card xl:col-span-2">
              <div className="card-header flex items-center justify-between">
                <span>Recent Orders</span>
                <Link to="/orders" className="text-xs text-[#f07c1e] hover:underline font-medium">View all →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="table-th">Customer</th>
                      <th className="table-th">Total</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">No orders yet</td></tr>
                    )}
                    {recentOrders.map(o => (
                      <tr key={o._id} className="table-row">
                        <td className="table-td font-medium">{o.customerId?.companyName ?? '—'}</td>
                        <td className="table-td">{formatCurrency(o.totalAmount)}</td>
                        <td className="table-td"><StatusBadge status={o.status} /></td>
                        <td className="table-td text-gray-500">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center justify-between">
                <span>Low Stock Alerts</span>
                <Link to="/products" className="text-xs text-[#f07c1e] hover:underline font-medium">View all →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {lowStock.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-sm">All stock levels OK ✓</div>
                )}
                {lowStock.slice(0, 6).map(p => (
                  <div key={p._id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.unitOfMeasure}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{p.inventoryLevel}</div>
                      <div className="text-xs text-gray-400">min: {p.reorderThreshold}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
