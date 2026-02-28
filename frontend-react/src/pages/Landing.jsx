import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" /></svg>,
    title: 'Product & Batch Tracking',
    desc: 'Full inventory control with CAS/UN numbers, hazard classification, expiry tracking, and SDS document management.',
    color: '#1a2e5a',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    title: 'Order Management',
    desc: 'Multi-item order builder with auto-pricing, tax calculation, and full status lifecycle from Pending to Paid.',
    color: '#f07c1e',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    title: 'Invoice & Billing',
    desc: 'Auto-generate invoices from orders, track outstanding receivables, mark payments, and export PDF documents.',
    color: '#10b981',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    title: 'Analytics & Reports',
    desc: 'Sales trends, top customers, inventory turnover, hazmat sales, and outstanding receivables in one view.',
    color: '#6366f1',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    title: 'Compliance Management',
    desc: 'SDS tracker, regulatory export, customer verification workflows, and hazmat classification at a glance.',
    color: '#8b5cf6',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    title: 'Role-Based Access',
    desc: 'Tailored dashboards for Admin, Sales, Finance, and Compliance — each sees exactly what they need.',
    color: '#ef4444',
  },
];

const ROLES = [
  {
    role: 'Admin',
    color: '#f07c1e',
    desc: 'Full system control — users, feature flags, audit log, webhooks, stock alerts.',
    metrics: ['System users', 'Audit log', 'Feature flags', 'Low stock alerts'],
    charts: ['Revenue + Orders bar chart', 'Orders by status donut', 'Cumulative growth area chart'],
  },
  {
    role: 'Sales',
    color: '#3b82f6',
    desc: 'Orders pipeline, customer management, quick approve and ship actions.',
    metrics: ['Period revenue', 'Pending orders', 'Active orders', 'Verified customers'],
    charts: ['Sales performance bar chart', 'Pipeline distribution donut', 'Revenue trend area'],
  },
  {
    role: 'Finance',
    color: '#10b981',
    desc: 'Revenue trends, outstanding invoices, mark paid, PDF export, product margins.',
    metrics: ['Total revenue', 'Outstanding balance', 'Overdue count', 'Collected amount'],
    charts: ['Revenue + order volume bars', 'Invoice status donut', 'Revenue area trend'],
  },
  {
    role: 'Compliance',
    color: '#8b5cf6',
    desc: 'SDS completeness, regulatory export, customer verification queue.',
    metrics: ['SDS completeness %', 'Missing SDS', 'Hazmat products', 'Pending reviews'],
    charts: ['SDS coverage bar', 'Customer status donut', 'Hazmat vs safe donut'],
  },
];

const STATS = [
  { value: '10+', label: 'Core modules' },
  { value: '4', label: 'Role dashboards' },
  { value: '100%', label: 'API-driven' },
  { value: 'Real-time', label: 'Stock alerts' },
];

// Inline SVG dashboard mockup for each role
function DashboardMockup({ role }) {
  const colors = {
    Admin: { primary: '#f07c1e', secondary: '#1a2e5a', bars: ['#f07c1e', '#1a2e5a', '#f07c1e', '#1a2e5a', '#f07c1e', '#1a2e5a'] },
    Sales: { primary: '#3b82f6', secondary: '#f07c1e', bars: ['#3b82f6', '#f07c1e', '#3b82f6', '#f07c1e', '#3b82f6', '#f07c1e'] },
    Finance: { primary: '#10b981', secondary: '#1a2e5a', bars: ['#10b981', '#1a2e5a', '#10b981', '#1a2e5a', '#10b981', '#1a2e5a'] },
    Compliance: { primary: '#8b5cf6', secondary: '#ef4444', bars: ['#8b5cf6', '#ef4444', '#8b5cf6', '#ef4444', '#8b5cf6', '#8b5cf6'] },
  };
  const c = colors[role];
  const heights = [40, 65, 50, 80, 55, 70];

  return (
    <svg viewBox="0 0 360 220" className="w-full rounded-xl" style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.10))' }}>
      {/* bg */}
      <rect width="360" height="220" rx="12" fill="white" />
      {/* topbar */}
      <rect width="360" height="36" rx="12" fill="#f9fafb" />
      <rect width="360" height="24" y="12" fill="#f9fafb" />
      <circle cx="18" cy="18" r="7" fill={c.primary} opacity="0.8" />
      <rect x="32" y="13" width="60" height="10" rx="5" fill="#1a2e5a" opacity="0.15" />
      <rect x="300" y="11" width="48" height="14" rx="7" fill={c.primary} opacity="0.9" />

      {/* KPI cards */}
      {[0, 1, 2, 3].map(i => (
        <g key={i} transform={'translate(' + (8 + i * 86) + ',44)'}>
          <rect width="80" height="42" rx="8" fill="white" stroke="#f3f4f6" strokeWidth="1" />
          <rect x="6" y="6" width="28" height="5" rx="2.5" fill="#9ca3af" opacity="0.5" />
          <rect x="6" y="16" width="50" height="10" rx="3" fill={i === 0 ? c.primary : '#1a2e5a'} opacity={i === 0 ? 0.9 : 0.15} />
          <rect x="6" y="31" width="30" height="4" rx="2" fill="#9ca3af" opacity="0.3" />
        </g>
      ))}

      {/* Main chart area */}
      <rect x="8" y="94" width="228" height="118" rx="8" fill="white" stroke="#f3f4f6" strokeWidth="1" />
      <rect x="16" y="100" width="80" height="7" rx="3" fill="#1a2e5a" opacity="0.12" />
      {/* Chart bars */}
      {heights.map((h, i) => (
        <rect key={i} x={24 + i * 34} y={200 - h} width="22" height={h} rx="3" fill={c.bars[i]} opacity="0.85" />
      ))}
      {/* X axis */}
      <line x1="16" y1="200" x2="228" y2="200" stroke="#f3f4f6" strokeWidth="1" />

      {/* Donut chart */}
      <g transform="translate(248,94)">
        <rect width="104" height="118" rx="8" fill="white" stroke="#f3f4f6" strokeWidth="1" />
        <rect x="8" y="6" width="60" height="7" rx="3" fill="#1a2e5a" opacity="0.12" />
        <circle cx="52" cy="72" r="30" fill="none" stroke={c.primary} strokeWidth="16" strokeDasharray="75 125" strokeDashoffset="-10" />
        <circle cx="52" cy="72" r="30" fill="none" stroke={c.secondary} strokeWidth="16" strokeDasharray="45 155" strokeDashoffset="65" opacity="0.7" />
        <circle cx="52" cy="72" r="30" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeDasharray="20 180" strokeDashoffset="110" />
        <circle cx="52" cy="72" r="18" fill="white" />
        {/* legend dots */}
        <circle cx="14" cy="108" r="4" fill={c.primary} />
        <rect x="22" y="105" width="28" height="5" rx="2" fill="#9ca3af" opacity="0.4" />
        <circle cx="62" cy="108" r="4" fill={c.secondary} />
        <rect x="70" y="105" width="24" height="5" rx="2" fill="#9ca3af" opacity="0.4" />
      </g>
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef(null);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const handler = () => {
      if (heroRef.current) heroRef.current.style.backgroundPositionY = (window.scrollY * 0.25) + 'px';
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a2e5a] flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">CO</span>
            </div>
            <span className="font-bold text-[#1a2e5a] text-lg tracking-tight">ChemOps</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-[#1a2e5a] transition-colors hidden sm:block font-medium">Features</a>
            <a href="#dashboards" className="text-sm text-gray-500 hover:text-[#1a2e5a] transition-colors hidden sm:block font-medium">Dashboards</a>
            <a href="#roles" className="text-sm text-gray-500 hover:text-[#1a2e5a] transition-colors hidden sm:block font-medium">Roles</a>
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#1a2e5a] text-white hover:bg-[#243d73] transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-36 pb-28 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1d3a 0%, #1a2e5a 50%, #243d73 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #f07c1e, transparent)', transform: 'translate(30%, -30%)' }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#f07c1e] animate-pulse" />
              <span className="text-white/80 text-xs font-medium tracking-widest uppercase">Chemical Sales and Billing Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Manage Chemicals.<br />
              <span className="text-[#f07c1e]">Ship Compliance.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              The all-in-one platform for chemical distributors — inventory, orders, invoices, compliance tracking, and role-based dashboards with real analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#f07c1e] text-white font-semibold text-base hover:bg-[#d96b10] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                Launch App
              </button>
              <a href="#dashboards" className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/25 text-white font-medium text-base hover:bg-white/10 transition-colors text-center">
                See Dashboards
              </a>
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/10 border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e5a] mb-4">Everything your team needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built for chemical distributors and compliance officers who need a reliable, integrated system.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feat => (
              <div key={feat.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ background: feat.color + '12', color: feat.color }}>
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD MOCKUPS */}
      <section id="dashboards" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e5a] mb-4">Role-specific dashboards</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Each role gets a custom view with the charts and actions that matter most to their workflow.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {ROLES.map(r => (
              <div key={r.role} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
                {/* Dashboard header bar */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100" style={{ background: r.color + '08' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: r.color }}>{r.role[0]}</div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.role} Dashboard</div>
                    <div className="text-xs text-gray-400">{r.desc}</div>
                  </div>
                </div>
                {/* SVG Mockup */}
                <div className="bg-gray-50 p-4">
                  <DashboardMockup role={r.role} />
                </div>
                {/* Details */}
                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">KPI Cards</div>
                    <ul className="space-y-1">
                      {r.metrics.map(m => (
                        <li key={m} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Charts</div>
                    <ul className="space-y-1">
                      {r.charts.map(c => (
                        <li key={c} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-300" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e5a] mb-4">One platform, four perspectives</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Login with any demo account to explore the full system from that role's perspective.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ROLES.map(r => (
              <div key={r.role} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: r.color }}>
                    {r.role[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{r.role}</div>
                    <div className="text-xs text-gray-400">{r.role.toLowerCase()}@chemops.com</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(135deg, #1a2e5a 0%, #243d73 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to streamline operations?</h2>
          <p className="text-white/70 mb-10 text-lg">Sign in with any demo account and explore every feature.</p>
          <button onClick={() => navigate('/login')} className="px-10 py-4 rounded-xl bg-[#f07c1e] text-white font-semibold text-lg hover:bg-[#d96b10] transition-all shadow-lg hover:-translate-y-0.5">
            Get Started Free
          </button>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {[['Admin', '#f07c1e'], ['Sales', '#3b82f6'], ['Finance', '#10b981'], ['Compliance', '#8b5cf6']].map(([role, color]) => (
              <div key={role} className="bg-white/10 rounded-lg p-3 text-center border border-white/10">
                <div className="text-white font-medium text-sm">{role}</div>
                <div className="text-white/50 text-xs mt-0.5">{role.toLowerCase()}123</div>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-4">All accounts use @chemops.com email</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 bg-[#0f1d3a] text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded bg-[#1a2e5a] flex items-center justify-center">
            <span className="text-white text-xs font-bold">CO</span>
          </div>
          <span className="text-white/40 text-sm font-medium">ChemOps</span>
        </div>
        <p className="text-white/20 text-xs">Chemical Sales and Billing Management Platform &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
