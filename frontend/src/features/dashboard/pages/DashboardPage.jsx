import {
  CheckCircle, DollarSign, Clock, Calendar, CalendarClock,
  Package, AlertTriangle, Boxes, Flame,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import KpiCard from '../components/KpiCard';
import {
  IncidenciasPorEstadoChart, InventarioAlertaChart, CitasPendientesChart,
} from '../components/ResumenCharts';

const formatMoney = (v) =>
  `S/ ${(parseFloat(v) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

const Seccion = ({ titulo, children }) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-gray-600">{titulo}</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">{children}</div>
  </div>
);

export default function DashboardPage() {
  const {
    ventas, inventario, incidencias, citas,
    puedeVentas, puedeInventario, puedeCitas,
    loading,
  } = useDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Inicio</h1>
        <p className="text-sm text-[#bababa]">Resumen general del taller</p>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12 text-sm">Cargando...</p>
      ) : (
        <>
          {puedeVentas && ventas && (
            <Seccion titulo="Ventas">
              <KpiCard icon={CheckCircle} label="Ventas hoy" value={ventas.ventasHoy} iconBgClass="bg-green-50" iconColorClass="text-green-500" />
              <KpiCard icon={DollarSign} label="Total hoy" value={formatMoney(ventas.totalHoy)} iconBgClass="bg-amber-50" iconColorClass="text-[#e5ba4a]" />
              <KpiCard icon={Clock} label="Pendientes de pago" value={ventas.pendientes} iconBgClass="bg-orange-50" iconColorClass="text-orange-500" />
            </Seccion>
          )}

          {puedeCitas && citas && (
            <Seccion titulo="Citas">
              <KpiCard icon={Calendar} label="Total citas" value={citas.totalCitas} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" />
              <KpiCard icon={CalendarClock} label="Pendientes" value={citas.citasPendientes} iconBgClass="bg-orange-50" iconColorClass="text-orange-500" />
            </Seccion>
          )}

          {puedeInventario && inventario && (
            <Seccion titulo="Inventario">
              <KpiCard icon={Boxes} label="Artículos" value={inventario.totalItems} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" />
              <KpiCard icon={DollarSign} label="Valor total" value={formatMoney(inventario.valorTotal)} iconBgClass="bg-amber-50" iconColorClass="text-[#e5ba4a]" />
              <KpiCard icon={AlertTriangle} label="En alerta" value={inventario.articulosEnAlerta} iconBgClass="bg-red-50" iconColorClass="text-red-500" />
              <KpiCard icon={Package} label="Movimientos del mes" value={inventario.movimientosDelMes} iconBgClass="bg-purple-50" iconColorClass="text-purple-500" />
            </Seccion>
          )}

          <Seccion titulo="Incidencias">
            <KpiCard icon={AlertTriangle} label="Abiertas" value={incidencias.abiertas} iconBgClass="bg-blue-50" iconColorClass="text-blue-500" />
            <KpiCard icon={Clock} label="En proceso" value={incidencias.en_proceso} iconBgClass="bg-orange-50" iconColorClass="text-orange-500" />
            <KpiCard icon={Flame} label="Críticas" value={incidencias.criticas} iconBgClass="bg-red-50" iconColorClass="text-red-500" />
          </Seccion>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <IncidenciasPorEstadoChart resumen={incidencias} />
            {puedeInventario && inventario && <InventarioAlertaChart resumen={inventario} />}
            {puedeCitas && citas && <CitasPendientesChart resumen={citas} />}
          </div>
        </>
      )}
    </div>
  );
}
