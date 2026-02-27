import { useEffect, useState } from 'react';
import api from '../api/client';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

export default function Compliance() {
  const [sds, setSds] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sds');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sdsRes, custRes] = await Promise.all([
          api.get('/compliance/sds-tracker'),
          api.get('/customers'),
        ]);
        setSds(Array.isArray(sdsRes.data?.data?.products) ? sdsRes.data.data.products : Array.isArray(sdsRes.data?.data) ? sdsRes.data.data : []);
        setCustomers(Array.isArray(custRes.data?.data) ? custRes.data.data : []);
      } catch { toast.error('Failed to load compliance data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-sm">
        {[{id:'sds', label:'SDS Tracker'},{id:'customers', label:'Customer Compliance'}].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-[#1a2e5a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
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
                  <th className="table-th">Product</th>
                  <th className="table-th">CAS Number</th>
                  <th className="table-th">Hazardous</th>
                  <th className="table-th">Hazard Class</th>
                  <th className="table-th">SDS Status</th>
                  <th className="table-th">Document</th>
                </tr>
              </thead>
              <tbody>
                {sds.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">No products</td></tr>}
                {sds.map(p => (
                  <tr key={p._id} className="table-row">
                    <td className="table-td font-medium">{p.name}</td>
                    <td className="table-td font-mono text-xs text-gray-500">{p.CASNumber || '—'}</td>
                    <td className="table-td">
                      {p.isHazardous ? <span className="badge badge-red">⚠ Yes</span> : <span className="badge badge-green">No</span>}
                    </td>
                    <td className="table-td text-gray-600">{p.hazardClassification || '—'}</td>
                    <td className="table-td">
                      {p.sdsDocumentUrl
                        ? <span className="badge badge-green">✓ Complete</span>
                        : <span className="badge badge-red">Missing</span>}
                    </td>
                    <td className="table-td">
                      {p.sdsDocumentUrl
                        ? <a href={p.sdsDocumentUrl} target="_blank" rel="noreferrer" className="text-[#f07c1e] hover:underline text-xs">View SDS →</a>
                        : <span className="text-gray-300 text-xs">—</span>}
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
                  <th className="table-th">Company</th>
                  <th className="table-th">Contact</th>
                  <th className="table-th">Tax ID</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
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
                      <div className="flex gap-2">
                        {['Verified', 'Pending', 'Rejected'].filter(s => s !== c.complianceStatus).map(s => (
                          <button
                            key={s}
                            disabled={updatingId === c._id}
                            onClick={() => updateComplianceStatus(c._id, s)}
                            className={`text-xs hover:underline disabled:opacity-50 ${s === 'Verified' ? 'text-emerald-600' : s === 'Rejected' ? 'text-red-500' : 'text-gray-500'}`}
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
