import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const STATUS_PIE_COLORS = { Verified: '#10b981', Pending: '#f59e0b', Rejected: '#ef4444' };

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
      {payload.map((p, i) => <div key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</div>)}
    </div>
  );
};

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
      await api.put('/compliance/customers/' + id + '/status', { complianceStatus: status });
      setCustomers(prev => prev.map(c => c._id === id ? { ...c, complianceStatus: status } : c));
      toast.success('Set to ' + status);
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const sdsComplete = products.filter(p => p.sdsDocumentUrl);
  const sdsMissing = products.filter(p => !p.sdsDocumentUrl);
  const hazardous = products.filter(p => p.isHazardous);
  const pendingCustomers = customers.filter(c => c.complianceStatus === 'Pending');
  const sdsPercent = products.length ? Math.round((sdsComplete.length / products.length) * 100) : 100;

  const custStatusDist = Object.entries(
    customers.reduce((acc, c) => { acc[c.complianceStatus] = (acc[c.complianceStatus] ?? 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ status, count }));

  const hazardChartData = [
    { name: 'Hazardous', value: hazardous.length, fill: '#ef4444' },
    { name: 'Non-Hazardous', value: products.length - hazardous.length, fill: '#10b981' },
  ].filter(d => d.value > 0);

  const sdsBarData = [
    { name: 'With SDS', value: sdsComplete.length, fill: '#10b981' },
    { name: 'Missing', value: sdsMissing.length, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="SDS Completeness" value={sdsPercent + '%'} sub={sdsComplete.length + '/' + products.length + ' products'} color="#10b981" />
        <StatCard label="SDS Missing" value={sdsMissing.length} sub={sdsMissing.length ? 'Need documents' : 'All complete'} color={sdsMissing.length ? '#ef4444' : '#10b981'} />
        <StatCard label="Hazmat Products" value={hazardous.length} sub="Require SDS" color="#f59e0b" />
        <StatCard label="Pending Reviews" value={pendingCustomers.length} sub="Customers awaiting" color="#8b5cf6" />
      </div>

      {sdsMissing.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-lg">⚠️</span>
          <div>
            <div className="font-semibold text-amber-800">{sdsMissing.length} product{sdsMissing.length !== 1 ? 's' : ''} missing SDS documentation</div>
            <div className="text-xs text-amber-600 mt-0.5">{sdsMissing.map(p => p.name).join(', ')}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card">
          <div className="card-header"><span className="card-title">SDS Coverage</span></div>
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sdsBarData} layout="vertical" barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Products" radius={[0, 4, 4, 0]}>
                  {sdsBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Customer Status Split</span></div>
          <div className="p-4 h-56">
            {custStatusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={custStatusDist} dataKey="count" nameKey="status" cx="50%" cy="42%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                    {custStatusDist.map((d, i) => <Cell key={i} fill={STATUS_PIE_COLORS[d.status] ?? '#9ca3af'} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No customers</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Hazmat vs Safe</span></div>
          <div className="p-4 h-56">
            {hazardChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={hazardChartData} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                    {hazardChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No products</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <span className="card-title">SDS Document Tracker</span>
            <Link to="/compliance" className="text-xs text-[#f07c1e] hover:underline">Full tracker</Link>
          </div>
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Completeness</span><span className="font-semibold text-gray-700">{sdsPercent}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all" style={{
                width: sdsPercent + '%',
                background: sdsPercent === 100 ? '#10b981' : sdsPercent > 60 ? '#f59e0b' : '#ef4444'
              }} />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {products.slice(0, 7).map(p => (
              <div key={p._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.CASNumber ?? '-'} · {p.hazardClassification ?? 'Unclassified'}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.isHazardous && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Hazmat</span>}
                  {p.sdsDocumentUrl
                    ? <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">SDS OK</span>
                    : <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Missing</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Customer Compliance Queue</span>
            <Link to="/compliance" className="text-xs text-[#f07c1e] hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {customers.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">No customers</div>}
            {customers.slice(0, 8).map(c => (
              <div key={c._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{c.companyName}</div>
                  <div className="text-xs text-gray-400">{c.contactEmail || c.taxId || '-'}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={c.complianceStatus} />
                  <div className="flex gap-1">
                    {c.complianceStatus !== 'Verified' && (
                      <button disabled={updating === c._id} onClick={() => updateCustomerStatus(c._id, 'Verified')}
                        className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center text-xs font-bold disabled:opacity-50">✓</button>
                    )}
                    {c.complianceStatus !== 'Rejected' && (
                      <button disabled={updating === c._id} onClick={() => updateCustomerStatus(c._id, 'Rejected')}
                        className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xs font-bold disabled:opacity-50">✗</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Compliance Actions</div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportRegulatory} className="btn btn-primary">Export Regulatory CSV</button>
          <Link to="/compliance" className="btn btn-outline">SDS Tracker</Link>
          <Link to="/products" className="btn btn-outline">Review Products</Link>
          <Link to="/customers" className="btn btn-ghost">All Customers</Link>
        </div>
      </div>
    </div>
  );
}
