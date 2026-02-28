import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#10b981', '#f07c1e', '#ef4444', '#6366f1'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
      <div className="mt-3 h-1 rounded-full bg-gray-100">
        <div className="h-1 rounded-full" style={{ width: '70%', background: color }} />
      </div>
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
          {p.name}: {typeof p.value === 'number' && p.value > 10 ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function FinanceDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [margins, setMargins] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const safe = (p) => p.catch(() => ({ data: null }));
    const [invRes, marginsRes, salesRes] = await Promise.all([
      safe(api.get('/invoices')),
      safe(api.get('/reports/margins')),
      safe(api.get('/reports/sales')),
    ]);
    setInvoices(Array.isArray(invRes.data?.data) ? invRes.data.data : []);
    setMargins(Array.isArray(marginsRes.data?.data) ? marginsRes.data.data : []);
    const arr = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
    setSalesData(arr.map(m => ({
      month: String(m._id?.month ?? '').padStart(2, '0') + '/' + String(m._id?.year ?? '').slice(-2),
      revenue: m.revenue ?? 0,
      orders: m.orders ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    try { await api.put('/invoices/' + id + '/status', { status: 'Paid' }); toast.success('Marked Paid'); load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  const issueInvoice = async (id) => {
    try { await api.put('/invoices/' + id + '/status', { status: 'Issued' }); toast.success('Invoice issued'); load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  const downloadPdf = async (inv) => {
    try {
      const res = await api.get('/invoices/' + inv._id + '/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = inv.invoiceNumber + '.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('PDF failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const paid = invoices.filter(i => i.status === 'Paid');
  const outstanding = invoices.filter(i => ['Issued', 'Overdue'].includes(i.status));
  const overdue = invoices.filter(i => i.status !== 'Paid' && i.dueDate && new Date(i.dueDate) < new Date());
  const draft = invoices.filter(i => i.status === 'Draft');
  const totalRevenue = salesData.reduce((s, m) => s + m.revenue, 0);
  const totalOutstanding = outstanding.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const totalPaid = paid.reduce((s, i) => s + (i.totalAmount ?? 0), 0);

  const invStatusDist = [
    { name: 'Paid', value: paid.length },
    { name: 'Issued', value: outstanding.length },
    { name: 'Overdue', value: overdue.length },
    { name: 'Draft', value: draft.length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} sub="All periods" color="#10b981" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} sub={outstanding.length + ' invoices'} color="#f07c1e" />
        <StatCard label="Overdue" value={overdue.length} sub="Past due date" color="#ef4444" />
        <StatCard label="Collected" value={formatCurrency(totalPaid)} sub={paid.length + ' paid invoices'} color="#1a2e5a" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="card-header"><span className="card-title">Revenue Trend with Order Volume</span></div>
          <div className="p-4 h-64">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} barSize={20} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                  <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="ord" dataKey="orders" name="Orders" fill="#1a2e5a" radius={[3, 3, 0, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Invoice Status</span></div>
          <div className="p-4 h-64">
            {invStatusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={invStatusDist} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius={80} innerRadius={42} paddingAngle={3}>
                    {invStatusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No invoices yet</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Revenue Area Chart</span></div>
        <div className="p-4 h-48">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#finGrad)" dot={{ r: 3, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="card-header">
            <span className="card-title">Invoices Needing Action</span>
            <Link to="/invoices" className="text-xs text-[#f07c1e] hover:underline">All invoices</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">Invoice #</th><th className="table-th">Amount</th><th className="table-th">Due</th><th className="table-th">Status</th><th className="table-th">Actions</th>
              </tr></thead>
              <tbody>
                {invoices.filter(i => i.status !== 'Paid').length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">All invoices paid</td></tr>
                )}
                {invoices.filter(i => i.status !== 'Paid').slice(0, 8).map(inv => {
                  const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                  return (
                    <tr key={inv._id} className="table-row">
                      <td className="table-td font-mono font-medium">{inv.invoiceNumber}</td>
                      <td className="table-td font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                      <td className="table-td">
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>{inv.dueDate ? formatDate(inv.dueDate) : '-'}</span>
                      </td>
                      <td className="table-td"><StatusBadge status={isOverdue && inv.status !== 'Paid' ? 'Overdue' : inv.status} /></td>
                      <td className="table-td">
                        <div className="flex gap-2">
                          {inv.status === 'Draft' && <button onClick={() => issueInvoice(inv._id)} className="btn btn-sm btn-outline">Issue</button>}
                          {['Issued', 'Overdue'].includes(inv.status) && <button onClick={() => markPaid(inv._id)} className="btn btn-sm btn-success">Mark Paid</button>}
                          <button onClick={() => downloadPdf(inv)} className="btn btn-sm btn-ghost">PDF</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Top Products by Revenue</span></div>
          <div className="divide-y divide-gray-100">
            {margins.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">No margin data</div>}
            {margins.slice(0, 6).map((p, i) => {
              const maxRev = margins[0]?.totalRevenue ?? 1;
              return (
                <div key={p._id ?? i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[130px]">{p.name}</span>
                    <span className="text-sm font-bold text-emerald-600 ml-2">{formatCurrency(p.totalRevenue)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: (p.totalRevenue / maxRev * 100) + '%' }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{p.totalQty} units · ${(p.avgSellPrice ?? p.unitPrice ?? 0).toFixed(2)}/unit</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
