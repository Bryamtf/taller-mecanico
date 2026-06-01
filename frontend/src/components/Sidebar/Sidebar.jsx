import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Package, FileText, ShoppingBag,
  TrendingUp, ArrowDownLeft, ArrowUpRight, Users, UsersRound,
  X, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { swalConfirm } from '@/lib/swal';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { label: 'Inicio',       icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Clientes',     icon: UsersRound,      to: '/clientes' },
      { label: 'Citas',        icon: Calendar,        to: '/citas' },
      { label: 'Inventario',   icon: Package,         to: '/inventario' },
      { label: 'Cotizaciones', icon: FileText,        to: '/cotizaciones' },
      { label: 'Ventas',       icon: ShoppingBag,     to: '/ventas' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { label: 'Reportes', icon: TrendingUp,    to: '/reportes', badge: 7 },
      { label: 'Ingresos', icon: ArrowDownLeft, to: '/ingresos' },
      { label: 'Egresos',  icon: ArrowUpRight,  to: '/egresos' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Usuarios', icon: Users, to: '/usuarios' },
    ],
  },
];

export default function Sidebar({ isCollapsed, isMobileOpen, onClose, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.username?.[0]?.toUpperCase() ?? 'A';

  const handleLogout = async () => {
    const result = await swalConfirm('¿Cerrar sesión?', '¿Estás seguro de que deseas salir?');
    if (result.isConfirmed) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <aside
      className={[
        'bg-[#111827] text-white flex flex-col shrink-0 transition-all duration-300',
        // Mobile: fixed overlay full-height
        'fixed inset-y-0 left-0 z-30 w-64',
        // Mobile open/close via translate
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: relative, always visible, width depends on collapsed state
        'lg:relative lg:translate-x-0 lg:z-auto',
        isCollapsed ? 'lg:w-16' : 'lg:w-64',
      ].join(' ')}
    >
      {/* Header del sidebar: avatar + info */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
        <div className="shrink-0 w-9 h-9 rounded-full bg-[#e5ba4a] flex items-center justify-center font-bold text-sm">
          {initial}
        </div>
        <div className={`overflow-hidden ${isCollapsed ? 'lg:hidden' : ''}`}>
          <p className="text-sm font-semibold leading-tight truncate">Autonort Perú SAC</p>
          <p className="text-xs text-gray-400 capitalize">{user?.rol ?? 'Administrador'}</p>
        </div>
        {/* Botón cerrar — solo mobile */}
        <button onClick={onClose} className="ml-auto lg:hidden text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className={[
              'px-4 mb-1 text-[10px] font-semibold tracking-widest text-gray-500 uppercase',
              isCollapsed ? 'lg:hidden' : '',
            ].join(' ')}>
              {section.label}
            </p>

            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) => [
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'text-[#e5ba4a] bg-white/5'
                    : 'text-gray-300 hover:text-white hover:bg-white/5',
                  isCollapsed ? 'lg:justify-center lg:px-0' : '',
                ].join(' ')}
              >
                <item.icon size={18} className="shrink-0" />
                <span className={`flex-1 tracking-widest truncate ${isCollapsed ? 'lg:hidden' : ''}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className={`text-[10px] font-bold bg-[#e5ba4a] text-white rounded-full px-1.5 py-0.5 ${isCollapsed ? 'lg:hidden' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Botón cerrar sesión */}
      <button
        onClick={handleLogout}
        title={isCollapsed ? 'Cerrar sesión' : undefined}
        className={[
          'flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-red-400 transition-colors border-t border-white/10',
          isCollapsed ? 'lg:justify-center lg:px-0' : '',
        ].join(' ')}
      >
        <LogOut size={18} className="shrink-0" />
        <span className={isCollapsed ? 'lg:hidden' : ''}>Cerrar sesión</span>
      </button>

      {/* Botón colapsar — solo desktop */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center py-3 border-t border-white/10 text-gray-400 hover:text-white transition-colors"
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
