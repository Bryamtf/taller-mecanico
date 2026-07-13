import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage    from "@/features/dashboard/pages/DashboardPage";
import ClientesPage    from "@/features/clientes/pages/ClientesPage";
import InventarioPage  from "@/features/inventario/pages/InventarioPage";
import IncidenciasPage from "@/features/incidencias/pages/IncidenciasPage";
import ProveedoresPage from "@/features/proveedores/pages/ProveedoresPage";
import UsuariosPage from "@/features/usuarios/pages/UsuariosPage";

import ListaCotizaciones from "@/features/cotizaciones/pages/ListaCotizaciones";
import NuevaCotizacion from "@/features/cotizaciones/pages/NuevaCotizacion";
import EditarCotizacion from "@/features/cotizaciones/pages/EditarCotizacion";
import VerCotizacion from "@/features/cotizaciones/pages/VerCotizacion";
import VerCotizacionPublica from "@/features/cotizaciones/pages/VerCotizacionPublica";
import ElegirTipoCotizacion from "@/features/cotizaciones/pages/ElegirTipoCotizacion";
import SeleccionarPlantilla from "@/features/cotizaciones/pages/SeleccionarPlantilla";
import VentasPage from "@/features/ventas/pages/VentasPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cotizacion/:token" element={<VerCotizacionPublica />} />

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route
            path="/citas"
            element={<div className="text-xl font-semibold">Citas</div>}
          />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/incidencias" element={<IncidenciasPage />} />
          <Route path="/cotizaciones" element={<ListaCotizaciones />} />
          <Route path="/cotizaciones/nueva" element={<ElegirTipoCotizacion />}/>
          <Route path="/cotizaciones/nueva/desde-cero" element={<NuevaCotizacion />} />
          <Route path="/cotizaciones/nueva/plantilla" element={<SeleccionarPlantilla />} />
          <Route path="/cotizaciones/:id" element={<VerCotizacion />} />
          <Route path="/cotizaciones/:id/editar" element={<EditarCotizacion />}/>

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
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
