import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import ErrorState from '../components/ErrorState';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const STATUSES = ['Draft', 'Issued', 'Paid', 'Overdue'];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await api.get('/invoices', { params });
      setInvoices(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) { setError(err.message || 'Failed to load invoices'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/invoices/${id}/status`, { status });
      toast.success(`Invoice marked as ${status}`);
      load();
    } catch (err) { toast.error(err.message || 'Update failed'); }
  };

  const downloadPdf = async (inv) => {
    setDownloading(inv._id);
    try {
      const res = await api.get(`/invoices/${inv._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('PDF download failed'); }
    finally { setDownloading(null); }
  };

  return (
    <Layout title="Invoices">
      {error && <ErrorState message={error} onRetry={load} />}

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
                <th scope="col" className="table-th">Invoice #</th>
                <th scope="col" className="table-th">Order</th>
                <th scope="col" className="table-th">Subtotal</th>
                <th scope="col" className="table-th">Tax</th>
                <th scope="col" className="table-th">Total</th>
                <th scope="col" className="table-th">Due Date</th>
                <th scope="col" className="table-th">Status</th>
                <th scope="col" className="table-th"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody aria-live="polite" aria-busy={loading}>
              {loading && <tr><td colSpan={8} className="py-12 text-center text-gray-400" aria-label="Loading invoices">Loading…</td></tr>}
              {!loading && invoices.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-gray-400">No invoices found</td></tr>}
              {invoices.map(inv => {
                const isOverdue = inv.status !== 'Paid' && inv.dueDate && new Date(inv.dueDate) < new Date();
                return (
                  <tr key={inv._id} className="table-row">
                    <td className="table-td font-mono font-medium">{inv.invoiceNumber}</td>
                    <td className="table-td text-gray-500 font-mono text-xs">{inv.orderId?._id ?? inv.orderId ?? '—'}</td>
                    <td className="table-td">{formatCurrency(inv.subtotal, inv.currency)}</td>
                    <td className="table-td text-gray-500">{formatCurrency(inv.taxAmount, inv.currency)}</td>
                    <td className="table-td font-semibold">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                    <td className="table-td">
                      {inv.dueDate ? (
                        <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}>{formatDate(inv.dueDate)}</span>
                      ) : '—'}
                    </td>
                    <td className="table-td"><StatusBadge status={isOverdue && inv.status !== 'Paid' ? 'Overdue' : inv.status} /></td>
                    <td className="table-td">
                      <div className="flex gap-1 flex-wrap">
                        {inv.status === 'Draft' && (
                          <button onClick={() => updateStatus(inv._id, 'Issued')} className="btn btn-ghost btn-xs min-h-[36px]" aria-label={`Issue invoice ${inv.invoiceNumber}`}>Issue</button>
                        )}
                        {(inv.status === 'Issued' || inv.status === 'Overdue') && (
                          <button onClick={() => updateStatus(inv._id, 'Paid')} className="btn btn-ghost btn-xs min-h-[36px] text-emerald-600 hover:bg-emerald-50" aria-label={`Mark invoice ${inv.invoiceNumber} as paid`}>Mark Paid</button>
                        )}
                        <button
                          onClick={() => downloadPdf(inv)}
                          disabled={downloading === inv._id}
                          aria-label={`Download PDF for invoice ${inv.invoiceNumber}`}
                          className="btn btn-ghost btn-xs min-h-[36px] text-[#f07c1e] hover:bg-orange-50 disabled:opacity-50"
                        >
                          {downloading === inv._id ? '…' : 'PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
