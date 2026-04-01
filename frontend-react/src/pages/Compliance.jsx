import { useEffect, useState } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

export default function Compliance() {
  const [sds, setSds] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sds');
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sdsRes, custRes] = await Promise.all([
        api.get('/compliance/sds-tracker'),
        api.get('/customers'),
      ]);
      setSds(Array.isArray(sdsRes.data?.data?.products) ? sdsRes.data.data.products : Array.isArray(sdsRes.data?.data) ? sdsRes.data.data : []);
      setCustomers(Array.isArray(custRes.data?.data) ? custRes.data.data : []);
    } catch (err) { setError(err.message || 'Failed to load compliance data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateComplianceStatus = async (customerId, status) => {
    setUpdatingId(customerId);
    try {
      await api.put(`/compliance/customers/${customerId}/status`, { complianceStatus: status });
      setCustomers(prev => prev.map(c => c._id === customerId ? { ...c, complianceStatus: status } : c));
      toast.success(`Status updated to ${status}`);
    } catch (err) { toast.error(err.message || 'Update failed'); }
    finally { setUpdatingId(null); }
  };

  const handleRegulatoryExport = async () => {
    try {
      const res = await api.get('/compliance/regulatory-export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'regulatory-export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const sdsComplete = sds.filter(p => p.sdsDocumentUrl);
  const sdsMissing = sds.filter(p => !p.sdsDocumentUrl);

  return (
    <Layout
      title="Compliance"
      actions={<button onClick={handleRegulatoryExport} className="btn btn-outline">Regulatory Export</button>}
    >
      {error && <ErrorState message={error} onRetry={load} />}

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Products</div>
          <div className="text-2xl font-bold text-[#1a2e5a]">{sds.length}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">SDS Complete</div>
          <div className="text-2xl font-bold text-emerald-600">{sdsComplete.length}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">SDS Missing</div>
          <div className="text-2xl font-bold text-red-600">{sdsMissing.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Compliance views" className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-sm">
        {[{id:'sds', label:'SDS Tracker'},{id:'customers', label:'Customer Compliance'}].map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-[#1a2e5a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400" aria-live="polite" aria-label="Loading compliance data">Loading…</div>
      ) : tab === 'sds' ? (
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span>SDS Document Tracker</span>
            <span className="text-xs text-gray-400">{sdsComplete.length}/{sds.length} complete</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th scope="col" className="table-th">Product</th>
                  <th scope="col" className="table-th">CAS Number</th>
                  <th scope="col" className="table-th">Hazardous</th>
                  <th scope="col" className="table-th">Hazard Class</th>
                  <th scope="col" className="table-th">SDS Status</th>
                  <th scope="col" className="table-th">Document</th>
                </tr>
              </thead>
              <tbody>
                {sds.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">No products</td></tr>}
                {sds.map(p => (
                  <tr key={p._id} className="table-row">
                    <td className="table-td font-medium max-w-[180px] truncate" title={p.name}>{p.name || '—'}</td>
                    <td className="table-td font-mono text-xs text-gray-500">{p.CASNumber || '—'}</td>
                    <td className="table-td">
                      {p.isHazardous
                        ? <span className="badge badge-red" aria-label="Hazardous: Yes">⚠ Yes</span>
                        : <span className="badge badge-green" aria-label="Hazardous: No">No</span>}
                    </td>
                    <td className="table-td text-gray-600">{p.hazardClassification || '—'}</td>
                    <td className="table-td">
                      {p.sdsDocumentUrl
                        ? <span className="badge badge-green" aria-label="SDS Status: Complete">✓ Complete</span>
                        : <span className="badge badge-red" aria-label="SDS Status: Missing">Missing</span>}
                    </td>
                    <td className="table-td">
                      {p.sdsDocumentUrl
                        ? <a href={p.sdsDocumentUrl} target="_blank" rel="noreferrer" className="text-[#f07c1e] hover:underline text-xs" aria-label={`View SDS document for ${p.name}`}>View SDS →</a>
                        : <span className="text-gray-300 text-xs" aria-label="No SDS document">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="card-header">Customer Compliance Status</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th scope="col" className="table-th">Company</th>
                  <th scope="col" className="table-th">Contact</th>
                  <th scope="col" className="table-th">Tax ID</th>
                  <th scope="col" className="table-th">Status</th>
                  <th scope="col" className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-gray-400">No customers</td></tr>}
                {customers.map(c => (
                  <tr key={c._id} className="table-row">
                    <td className="table-td font-medium">{c.companyName}</td>
                    <td className="table-td text-gray-500">{c.contactEmail || '—'}</td>
                    <td className="table-td font-mono text-xs">{c.taxId || '—'}</td>
                    <td className="table-td"><StatusBadge status={c.complianceStatus} /></td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        {['Verified', 'Pending', 'Rejected'].filter(s => s !== c.complianceStatus).map(s => (
                          <button
                            key={s}
                            disabled={updatingId === c._id}
                            onClick={() => updateComplianceStatus(c._id, s)}
                            aria-label={`Set ${c.companyName} compliance status to ${s}`}
                            className={`btn btn-ghost btn-xs min-h-[36px] disabled:opacity-50 ${s === 'Verified' ? 'text-emerald-600 hover:bg-emerald-50' : s === 'Rejected' ? 'text-red-500 hover:bg-red-50' : 'text-gray-500'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
