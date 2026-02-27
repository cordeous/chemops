import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ title, subtitle, actions, children }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-7 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
