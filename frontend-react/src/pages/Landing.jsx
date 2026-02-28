import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
      </svg>
    ),
    title: 'Product & Batch Tracking',
    desc: 'Full inventory control with CAS/UN numbers, hazard classification, expiry tracking, and SDS document management.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Order Management',
    desc: 'Multi-item order builder with auto-pricing, tax calculation, and full status lifecycle from Pending to Paid.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Invoice & Billing',
    desc: 'Auto-generate invoices from orders, track outstanding receivables, mark payments, and export PDF documents.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Analytics & Reports',
    desc: 'Sales trends, top customers, inventory turnover, hazmat sales analysis, and outstanding receivables — all in one view.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Compliance Management',
    desc: 'SDS tracker, regulatory export, customer verification workflows, and hazardous material classification at a glance.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Role-Based Access',
    desc: 'Tailored dashboards for Admin, Sales, Finance, and Compliance — each team sees exactly what they need.',
  },
];

const ROLES = [
  { role: 'Admin', color: '#f07c1e', desc: 'Full system control: users, features, alerts, audit log, webhooks.' },
  { role: 'Sales', color: '#3b82f6', desc: 'Orders pipeline, customer management, quick approve & ship actions.' },
  { role: 'Finance', color: '#10b981', desc: 'Revenue trends, outstanding invoices, mark paid, PDF export.' },
  { role: 'Compliance', color: '#8b5cf6', desc: 'SDS completeness, regulatory export, customer verification status.' },
];

const STATS = [
  { value: '10+', label: 'Core modules' },
  { value: '4', label: 'Role dashboards' },
  { value: '100%', label: 'API-driven' },
  { value: 'Real-time', label: 'Stock alerts' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef(null);

  // If already logged in, go straight to app
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // Subtle parallax on hero
  useEffect(() => {
    const handler = () => {
      if (heroRef.current) {
        heroRef.current.style.backgroundPositionY = `${window.scrollY * 0.3}px`;
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1a2e5a] flex items-center justify-center">
              <span className="text-white text-xs font-bold">CO</span>
            </div>
            <span className="font-bold text-[#1a2e5a] text-lg">ChemOps</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-500 hover:text-[#1a2e5a] transition-colors hidden sm:block">Features</a>
            <a href="#roles" className="text-sm text-gray-500 hover:text-[#1a2e5a] transition-colors hidden sm:block">Roles</a>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#1a2e5a] text-white hover:bg-[#243d73] transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-24 px-6 bg-gradient-to-br from-[#0f1d3a] via-[#1a2e5a] to-[#243d73] overflow-hidden"
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#f07c1e] animate-pulse" />
            <span className="text-white/80 text-xs font-medium tracking-wide uppercase">Chemical Sales & Billing Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Manage Chemicals.
            <br />
            <span className="text-[#f07c1e]">Ship Compliance.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one platform for chemical sales teams — inventory, orders, invoices, compliance tracking, and role-based dashboards, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#f07c1e] text-white font-semibold text-base hover:bg-[#d96b10] transition-all shadow-lg shadow-orange-900/30 hover:shadow-xl hover:scale-105 active:scale-100"
            >
              Launch App
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/20 text-white font-medium text-base hover:bg-white/10 transition-colors text-center"
            >
              See Features
            </a>
          </div>
        </div>

        {/* Stat strip */}
        <div className="relative max-w-4xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white/10 border border-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e5a] mb-4">Everything your team needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built for chemical distributors, manufacturers, and compliance officers who need a reliable, integrated system.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feat => (
              <div
                key={feat.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1a2e5a]/8 text-[#1a2e5a] flex items-center justify-center mb-4 bg-blue-50">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e5a] mb-4">One platform, four perspectives</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Every role gets a purpose-built dashboard — no clutter, just the tools each team actually needs.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {ROLES.map(r => (
              <div
                key={r.role}
                className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: r.color }}
                >
                  {r.role[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{r.role}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#1a2e5a] to-[#243d73]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to streamline your operations?</h2>
          <p className="text-white/70 mb-10 text-lg">Sign in with any demo account and explore every feature today.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 rounded-xl bg-[#f07c1e] text-white font-semibold text-lg hover:bg-[#d96b10] transition-all shadow-lg hover:scale-105 active:scale-100"
          >
            Get Started
          </button>
          <p className="text-white/40 text-sm mt-6">admin@chemops.com / admin123 &bull; sales@chemops.com / sales123</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 bg-[#0f1d3a] text-center">
        <p className="text-white/30 text-sm">
          ChemOps &copy; {new Date().getFullYear()} &mdash; Chemical Sales &amp; Billing Management Platform
        </p>
      </footer>
    </div>
  );
}
