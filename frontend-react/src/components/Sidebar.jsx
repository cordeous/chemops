import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { section: 'Main' },
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { section: 'Operations' },
  { to: '/products', icon: '📦', label: 'Products' },
  { to: '/batches', icon: '🗂', label: 'Batches' },
  { to: '/customers', icon: '👥', label: 'Customers' },
  { to: '/orders', icon: '🛒', label: 'Orders' },
  { to: '/invoices', icon: '🧾', label: 'Invoices' },
  { section: 'Analytics' },
  { to: '/reports', icon: '📊', label: 'Reports' },
  { to: '/compliance', icon: '🛡', label: 'Compliance' },
  { section: 'Admin', role: 'Admin' },
  { to: '/admin', icon: '⚙️', label: 'Admin Panel', role: 'Admin' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-[250px] bg-[#1a2e5a] flex flex-col fixed top-0 left-0 bottom-0 z-40">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-xl font-bold text-white tracking-wide">
          🧪 Chem<span className="text-[#f07c1e]">Ops</span>
        </div>
        <div className="text-xs text-white/40 mt-0.5">Chemical Sales & Billing</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {links.map((item, i) => {
          if (item.section) {
            if (item.role && user?.role !== item.role) return null;
            return (
              <div key={i} className="px-2 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {item.section}
              </div>
            );
          }
          if (item.role && user?.role !== item.role) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-white/80 text-sm font-medium truncate">{user?.name}</div>
        <div className="text-white/40 text-xs mt-0.5">{user?.role}</div>
        <button
          onClick={logout}
          className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          ← Sign out
        </button>
      </div>
    </aside>
  );
}
