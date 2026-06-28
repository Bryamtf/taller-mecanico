import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/features/auth/pages/LoginPage";
import ClientesPage    from "@/features/clientes/pages/ClientesPage";
import InventarioPage  from "@/features/inventario/pages/InventarioPage";
import IncidenciasPage from "@/features/incidencias/pages/IncidenciasPage";
import ProveedoresPage from "@/features/proveedores/pages/ProveedoresPage";

import ListaCotizaciones from "@/features/cotizaciones/pages/ListaCotizaciones";
import NuevaCotizacion from "@/features/cotizaciones/pages/NuevaCotizacion";
import EditarCotizacion from "@/features/cotizaciones/pages/EditarCotizacion";
import VerCotizacion from "@/features/cotizaciones/pages/VerCotizacion";
import VerCotizacionPublica from "@/features/cotizaciones/pages/VerCotizacionPublica";
import VentasPage from "@/features/ventas/pages/VentasPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cotizacion/:token" element={<VerCotizacionPublica />} />

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={<div className="text-xl font-semibold">Dashboard</div>}
          />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route
            path="/citas"
            element={<div className="text-xl font-semibold">Citas</div>}
          />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/incidencias" element={<IncidenciasPage />} />
          <Route path="/cotizaciones" element={<ListaCotizaciones />} />
          <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
          <Route path="/cotizaciones/:id" element={<VerCotizacion />} />
          <Route
            path="/cotizaciones/:id/editar"
            element={<EditarCotizacion />}
          />

          <Route path="/ventas" element={<VentasPage />} />
          <Route
            path="/reportes"
            element={<div className="text-xl font-semibold">Reportes</div>}
          />
          <Route
            path="/ingresos"
            element={<div className="text-xl font-semibold">Ingresos</div>}
          />
          <Route
            path="/egresos"
            element={<div className="text-xl font-semibold">Egresos</div>}
          />
          <Route
            path="/usuarios"
            element={<div className="text-xl font-semibold">Usuarios</div>}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
