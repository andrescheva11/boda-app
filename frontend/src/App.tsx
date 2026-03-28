import { useState } from 'react';
import { useStore } from './store/useStore';
import Dashboard from './pages/Dashboard';
import Proveedores from './pages/Proveedores';
import Presupuesto from './pages/Presupuesto';
import Invitados from './pages/Invitados';
import Configuracion from './pages/Configuracion';
import { Heart, LayoutDashboard, Users, Wallet, Store, Settings } from 'lucide-react';
import clsx from 'clsx';

type Page = 'dashboard' | 'proveedores' | 'presupuesto' | 'invitados' | 'configuracion';

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'proveedores', label: 'Proveedores', icon: <Store size={20} /> },
  { id: 'presupuesto', label: 'Presupuesto', icon: <Wallet size={20} /> },
  { id: 'invitados', label: 'Invitados', icon: <Users size={20} /> },
  { id: 'configuracion', label: 'Config', icon: <Settings size={20} /> },
];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const store = useStore();

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard store={store} />;
      case 'proveedores': return <Proveedores store={store} />;
      case 'presupuesto': return <Presupuesto store={store} />;
      case 'invitados': return <Invitados store={store} />;
      case 'configuracion': return <Configuracion store={store} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Heart className="text-rose-400 fill-rose-400" size={24} />
              <div>
                <h1 className="font-serif text-xl font-bold text-stone-800">
                  {store.config.nombreNovio} & {store.config.nombreNovia}
                </h1>
                <p className="text-xs text-stone-400">
                  {new Date(store.config.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <nav className="flex gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    page === item.id
                      ? 'bg-rose-50 text-rose-600'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                  )}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
}
