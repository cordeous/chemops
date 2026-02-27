const THEMES = {
  blue:   { bg: 'bg-[#1a2e5a]',      text: 'text-white',      sub: 'text-white/60', ring: 'bg-white/10' },
  orange: { bg: 'bg-[#f07c1e]',      text: 'text-white',      sub: 'text-white/60', ring: 'bg-white/10' },
  green:  { bg: 'bg-emerald-600',    text: 'text-white',      sub: 'text-white/60', ring: 'bg-white/10' },
  red:    { bg: 'bg-red-600',        text: 'text-white',      sub: 'text-white/60', ring: 'bg-white/10' },
  purple: { bg: 'bg-violet-600',     text: 'text-white',      sub: 'text-white/60', ring: 'bg-white/10' },
};

export default function KpiCard({ label, value, icon, color = 'blue', sub }) {
  const t = THEMES[color] ?? THEMES.blue;
  return (
    <div className={`kpi-card ${t.bg} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className={`text-xs font-semibold uppercase tracking-wider ${t.sub}`}>{label}</div>
        <div className={`w-9 h-9 rounded-xl ${t.ring} flex items-center justify-center text-xl`}>{icon}</div>
      </div>
      <div>
        <div className={`text-2xl font-bold ${t.text}`}>{value ?? '—'}</div>
        {sub && <div className={`text-xs mt-1 ${t.sub}`}>{sub}</div>}
      </div>
    </div>
  );
}
