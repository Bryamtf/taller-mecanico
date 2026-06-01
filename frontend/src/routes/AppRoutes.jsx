import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/features/auth/pages/LoginPage';
import ClientesPage from '@/features/clientes/pages/ClientesPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard"     element={<div className="text-xl font-semibold">Dashboard</div>} />
          <Route path="/clientes"      element={<ClientesPage />} />
          <Route path="/citas"         element={<div className="text-xl font-semibold">Citas</div>} />
          <Route path="/inventario"    element={<div className="text-xl font-semibold">Inventario</div>} />
          <Route path="/cotizaciones"  element={<div className="text-xl font-semibold">Cotizaciones</div>} />
          <Route path="/ventas"        element={<div className="text-xl font-semibold">Ventas</div>} />
          <Route path="/reportes"      element={<div className="text-xl font-semibold">Reportes</div>} />
          <Route path="/ingresos"      element={<div className="text-xl font-semibold">Ingresos</div>} />
          <Route path="/egresos"       element={<div className="text-xl font-semibold">Egresos</div>} />
          <Route path="/usuarios"      element={<div className="text-xl font-semibold">Usuarios</div>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
