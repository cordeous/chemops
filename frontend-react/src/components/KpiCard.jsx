export default function KpiCard({ label, value, icon, color }) {
  const colors = {
    blue:   'from-[#1a2e5a] to-[#243b73]',
    orange: 'from-[#f07c1e] to-[#d96c10]',
    green:  'from-emerald-600 to-emerald-700',
    red:    'from-red-600 to-red-700',
  };
  return (
    <div className={`kpi-card bg-gradient-to-br ${colors[color] || colors.blue}`}>
      <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold text-white">{value ?? '—'}</div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-15 select-none">{icon}</div>
    </div>
  );
}
