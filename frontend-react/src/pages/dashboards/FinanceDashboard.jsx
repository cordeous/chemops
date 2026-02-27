import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
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
    setSalesData(arr.map(m => ({ month: `${m._id?.year}-${String(m._id?.month).padStart(2,'0')}`, revenue: m.revenue ?? 0, orders: m.orders ?? 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    try {
      await api.put(`/invoices/${id}/status`, { status: 'Paid' });
      toast.success('Invoice marked as Paid');
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const issueInvoice = async (id) => {
    try {
      await api.put(`/invoices/${id}/status`, { status: 'Issued' });
      toast.success('Invoice issued');
      load();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const downloadPdf = async (inv) => {
    try {
      const res = await api.get(`/invoices/${inv._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `${inv.invoiceNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('PDF download failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;

  const paid = invoices.filter(i => i.status === 'Paid');
  const outstanding = invoices.filter(i => ['Issued', 'Overdue'].includes(i.status));
  const overdue = invoices.filter(i => i.status !== 'Paid' && i.dueDate && new Date(i.dueDate) < new Date());
  const totalRevenue = salesData.reduce((s, m) => s + m.revenue, 0);
  const totalOutstanding = outstanding.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const totalPaid = paid.reduce((s, i) => s + (i.totalAmount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} sub="All invoices paid" icon="💰" accent="#10b981" />
        <StatCard label="Outstanding" value={formatCurrency(totalOutstanding)} sub={`${outstanding.length} invoices`} icon="📄" accent="#f07c1e" />
        <StatCard label="Overdue" value={overdue.length} sub="Past due date" icon="🔴" accent="#ef4444" />
        <StatCard label="Collected" value={formatCurrency(totalPaid)} sub={`${paid.length} paid`} icon="✅" accent="#1a2e5a" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card xl:col-span-2">
          <div className="card-header"><span className="card-title">Revenue Trend</span></div>
          <div className="p-4 h-56">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data</div>}
          </div>
        </div>

        {/* Margin table */}
        <div className="card">
          <div className="card-header"><span className="card-title">Top Margins</span></div>
          <div className="divide-y divide-gray-100">
            {margins.slice(0, 5).map((p, i) => (
              <div key={p._id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800 truncate max-w-[120px]">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.totalQty} units</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600">{formatCurrency(p.totalRevenue)}</div>
                  <div className="text-xs text-gray-400">${(p.avgSellPrice ?? p.unitPrice ?? 0).toFixed(2)}/unit</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices needing action */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Invoices Needing Action</span>
          <Link to="/invoices" className="text-xs text-[#f07c1e] hover:underline">All invoices →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="table-th">Invoice #</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Due</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr></thead>
            <tbody>
              {invoices.filter(i => i.status !== 'Paid').length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">All invoices paid ✓</td></tr>
              )}
              {invoices.filter(i => i.status !== 'Paid').slice(0, 8).map(inv => {
                const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
                return (
                  <tr key={inv._id} className="table-row">
                    <td className="table-td font-mono font-medium">{inv.invoiceNumber}</td>
                    <td className="table-td font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                    <td className="table-td">
                      <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                      </span>
                    </td>
                    <td className="table-td">
                      <StatusBadge status={isOverdue && inv.status !== 'Paid' ? 'Overdue' : inv.status} />
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        {inv.status === 'Draft' && (
                          <button onClick={() => issueInvoice(inv._id)} className="btn btn-sm btn-outline">Issue</button>
                        )}
                        {['Issued', 'Overdue'].includes(inv.status) && (
                          <button onClick={() => markPaid(inv._id)} className="btn btn-sm btn-success">Mark Paid</button>
                        )}
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
    </div>
  );
}
