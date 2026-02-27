import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
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

export default function ComplianceDashboard() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    const safe = (p) => p.catch(() => ({ data: null }));
    const [sdsRes, custRes] = await Promise.all([
      safe(api.get('/compliance/sds-tracker')),
      safe(api.get('/customers')),
    ]);
    const sdsData = sdsRes.data?.data;
    setProducts(Array.isArray(sdsData?.products) ? sdsData.products : Array.isArray(sdsData) ? sdsData : []);
    setCustomers(Array.isArray(custRes.data?.data) ? custRes.data.data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateCustomerStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/compliance/customers/${id}/status`, { complianceStatus: status });
      setCustomers(prev => prev.map(c => c._id === id ? { ...c, complianceStatus: status } : c));
      toast.success(`Set to ${status}`);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setUpdating(null); }
  };

  const exportRegulatory = async () => {
    try {
      const res = await api.get('/compliance/regulatory-export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'regulatory-export.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch { toast.error('Export failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>;

  const sdsComplete = products.filter(p => p.sdsDocumentUrl);
  const sdsMissing = products.filter(p => !p.sdsDocumentUrl);
  const hazardous = products.filter(p => p.isHazardous);
  const pendingCustomers = customers.filter(c => c.complianceStatus === 'Pending');
  const rejectedCustomers = customers.filter(c => c.complianceStatus === 'Rejected');
  const sdsPercent = products.length ? Math.round((sdsComplete.length / products.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="SDS Complete" value={`${sdsPercent}%`} sub={`${sdsComplete.length}/${products.length} products`} icon="📋" accent="#10b981" />
        <StatCard label="SDS Missing" value={sdsMissing.length} sub="Need documents" icon="⚠️" accent={sdsMissing.length ? '#ef4444' : '#10b981'} />
        <StatCard label="Hazmat Products" value={hazardous.length} sub="Require SDS" icon="☢️" accent="#f59e0b" />
        <StatCard label="Pending Reviews" value={pendingCustomers.length} sub="Customers awaiting" icon="⏳" accent="#6366f1" />
      </div>

      {/* SDS Progress bar */}
      {sdsMissing.length > 0 && (
        <div className="alert-warning">
          <span className="text-lg">⚠️</span>
          <div>
            <div className="font-semibold">{sdsMissing.length} product{sdsMissing.length !== 1 ? 's' : ''} missing SDS documentation</div>
            <div className="text-xs mt-0.5 opacity-80">{sdsMissing.map(p => p.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* SDS tracker */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">SDS Document Status</span>
            <Link to="/compliance" className="text-xs text-[#f07c1e] hover:underline">Full tracker →</Link>
          </div>
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Completeness</span><span className="font-semibold text-gray-700">{sdsPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${sdsPercent}%`, background: sdsPercent === 100 ? '#10b981' : sdsPercent > 60 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="table-th">Product</th>
                <th className="table-th">Hazardous</th>
                <th className="table-th">SDS</th>
              </tr></thead>
              <tbody>
                {products.slice(0, 8).map(p => (
                  <tr key={p._id} className="table-row">
                    <td className="table-td font-medium">{p.name}</td>
                    <td className="table-td">
                      {p.isHazardous ? <span className="badge badge-orange">⚠ Yes</span> : <span className="badge badge-gray">No</span>}
                    </td>
                    <td className="table-td">
                      {p.sdsDocumentUrl
                        ? <span className="badge badge-green">✓ Complete</span>
                        : <span className="badge badge-red">Missing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer compliance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Customer Compliance</span>
            <Link to="/compliance" className="text-xs text-[#f07c1e] hover:underline">Manage →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {customers.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">No customers</div>}
            {customers.slice(0, 8).map(c => (
              <div key={c._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{c.companyName}</div>
                  <div className="text-xs text-gray-400">{c.contactEmail || c.taxId || '—'}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={c.complianceStatus} />
                  <div className="flex gap-1">
                    {c.complianceStatus !== 'Verified' && (
                      <button disabled={updating === c._id} onClick={() => updateCustomerStatus(c._id, 'Verified')}
                        className="btn btn-xs btn-success disabled:opacity-50">✓</button>
                    )}
                    {c.complianceStatus !== 'Rejected' && (
                      <button disabled={updating === c._id} onClick={() => updateCustomerStatus(c._id, 'Rejected')}
                        className="btn btn-xs btn-danger disabled:opacity-50">✗</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportRegulatory} className="btn btn-primary">Export Regulatory CSV</button>
          <Link to="/compliance" className="btn btn-outline">SDS Tracker</Link>
          <Link to="/products" className="btn btn-outline">Review Products</Link>
        </div>
      </div>
    </div>
  );
}
