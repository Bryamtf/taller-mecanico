import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import LoginPage from '@/features/auth/pages/LoginPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        {/* Dashboard y demás páginas se agregarán aquí */}
        <Route path="/dashboard" element={<div className="p-8 text-xl">Dashboard (en construcción)</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
