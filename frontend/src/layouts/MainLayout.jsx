import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar/Sidebar';

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* Overlay oscuro detrás del sidebar en mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white shadow-sm flex items-center px-4 gap-3 shrink-0">
          {/* Hamburguesa — solo mobile */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-700 tracking-wide">Mi Autonort</span>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
