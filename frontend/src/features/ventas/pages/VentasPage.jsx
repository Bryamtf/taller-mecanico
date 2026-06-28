import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Clock, CheckCircle, DollarSign, Search, Eye, Receipt } from "lucide-react";
import ventaService from "../services/ventaService";
import GenerarVentaModal from "../components/GenerarVentaModal";
import DetalleVentaModal from "../components/DetalleVentaModal";
import { swalError } from "@/lib/swal";

const formatMoney = (v) =>
  `S/ ${(parseFloat(v) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const formatFecha = (f) => {
  if (!f) return "-";
  return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const KPICard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-[#bababa] uppercase">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

const VentasPage = () => {
  const [tab, setTab] = useState("pendientes");
  const [resumen, setResumen] = useState({ ventasHoy: 0, totalHoy: 0, pendientes: 0 });
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loadingP, setLoadingP] = useState(false);
  const [loadingH, setLoadingH] = useState(false);
  const [busquedaP, setBusquedaP] = useState("");
  const [busquedaH, setBusquedaH] = useState("");
  const [paginaP, setPaginaP] = useState(1);
  const [paginaH, setPaginaH] = useState(1);
  const [totalPagP, setTotalPagP] = useState(1);
  const [totalPagH, setTotalPagH] = useState(1);
  const [cotizacionModal, setCotizacionModal] = useState(null);
  const [ventaIdDetalle, setVentaIdDetalle] = useState(null);

  const cargarResumen = useCallback(async () => {
    try {
      const data = await ventaService.obtenerResumen();
      setResumen(data);
    } catch {
      /* silencioso */
    }
  }, []);

  const cargarPendientes = useCallback(async () => {
    setLoadingP(true);
    try {
      const data = await ventaService.listarPendientes({ pagina: paginaP, busqueda: busquedaP });
      setPendientes(data.pendientes || []);
      setTotalPagP(data.totalPaginas || 1);
    } catch {
      swalError("Error", "No se pudieron cargar las cotizaciones pendientes.");
    } finally {
      setLoadingP(false);
    }
  }, [paginaP, busquedaP]);

  const cargarHistorial = useCallback(async () => {
    setLoadingH(true);
    try {
      const data = await ventaService.listarHistorial({ pagina: paginaH, busqueda: busquedaH });
      setHistorial(data.ventas || []);
      setTotalPagH(data.totalPaginas || 1);
    } catch {
      swalError("Error", "No se pudo cargar el historial de ventas.");
    } finally {
      setLoadingH(false);
    }
  }, [paginaH, busquedaH]);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);
  useEffect(() => { cargarPendientes(); }, [cargarPendientes]);
  useEffect(() => { if (tab === "historial") cargarHistorial(); }, [tab, cargarHistorial]);

  const handleVentaGenerada = () => {
    setCotizacionModal(null);
    cargarResumen();
    cargarPendientes();
    if (tab === "historial") cargarHistorial();
  };

  const handleAnulada = () => {
    cargarResumen();
    if (tab === "historial") cargarHistorial();
  };

  const tabClass = (t) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t ? "bg-[#e5ba4a] text-white" : "text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
        <p className="text-sm text-[#bababa]">Gestiona cobros y consulta el historial de ventas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Ventas hoy" value={resumen.ventasHoy} icon={CheckCircle} color="bg-green-500" />
        <KPICard label="Total hoy" value={formatMoney(resumen.totalHoy)} icon={DollarSign} color="bg-[#e5ba4a]" />
        <KPICard label="Por cobrar" value={resumen.pendientes} sub="cotizaciones aprobadas" icon={Clock} color="bg-blue-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
          <button className={tabClass("pendientes")} onClick={() => setTab("pendientes")}>
            Por cobrar
            {resumen.pendientes > 0 && (
              <span className="ml-2 bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {resumen.pendientes}
              </span>
            )}
          </button>
          <button className={tabClass("historial")} onClick={() => setTab("historial")}>
            Historial
          </button>
        </div>

        {tab === "pendientes" && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={busquedaP}
                  onChange={(e) => { setBusquedaP(e.target.value); setPaginaP(1); }}
                  placeholder="Buscar por cliente, placa o cotización..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a]"
                />
              </div>
            </div>

            {loadingP ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e5ba4a]" />
              </div>
            ) : pendientes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No hay cotizaciones pendientes de cobro</p>
                <p className="text-sm mt-1">Las cotizaciones aprobadas aparecerán aquí</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-xs text-[#bababa] font-medium">Cotización</th>
                      <th className="text-left px-3 py-2 text-xs text-[#bababa] font-medium">Cliente</th>
                      <th className="text-left px-3 py-2 text-xs text-[#bababa] font-medium">Vehículo</th>
                      <th className="text-center px-3 py-2 text-xs text-[#bababa] font-medium">Ítems</th>
                      <th className="text-right px-3 py-2 text-xs text-[#bababa] font-medium">Total</th>
                      <th className="text-center px-3 py-2 text-xs text-[#bababa] font-medium">Fecha</th>
                      <th className="text-center px-3 py-2 text-xs text-[#bababa] font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map((c) => (
                      <tr key={c.cotizacion_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3">
                          <span className="font-medium text-gray-800">{c.numero_cotizacion}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-700">{c.cliente_nombre}</td>
                        <td className="px-3 py-3">
                          <p className="font-medium">{c.placa}</p>
                          <p className="text-xs text-gray-400">{c.vehiculo_marca} {c.vehiculo_modelo}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">{c.total_items}</td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-800">{formatMoney(c.total)}</td>
                        <td className="px-3 py-3 text-center text-gray-500">{formatFecha(c.fecha_registro)}</td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setCotizacionModal(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#e5ba4a] hover:bg-[#d4a93a] text-white rounded-lg font-medium transition-colors"
                          >
                            <Receipt size={13} />
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPagP > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button disabled={paginaP === 1} onClick={() => setPaginaP(p => p - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
                    <span className="px-3 py-1 text-sm text-gray-500">{paginaP} / {totalPagP}</span>
                    <button disabled={paginaP === totalPagP} onClick={() => setPaginaP(p => p + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "historial" && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={busquedaH}
                  onChange={(e) => { setBusquedaH(e.target.value); setPaginaH(1); }}
                  placeholder="Buscar por cliente, placa o número de venta..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a]"
                />
              </div>
            </div>

            {loadingH ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e5ba4a]" />
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Receipt size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No hay ventas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-xs text-[#bababa] font-medium">N° Venta</th>
                      <th className="text-left px-3 py-2 text-xs text-[#bababa] font-medium">Cliente</th>
                      <th className="text-left px-3 py-2 text-xs text-[#bababa] font-medium">Vehículo</th>
                      <th className="text-left px-3 py-2 text-xs text-[#bababa] font-medium">Comprobante</th>
                      <th className="text-right px-3 py-2 text-xs text-[#bababa] font-medium">Total</th>
                      <th className="text-center px-3 py-2 text-xs text-[#bababa] font-medium">Fecha</th>
                      <th className="text-center px-3 py-2 text-xs text-[#bababa] font-medium">Estado</th>
                      <th className="text-center px-3 py-2 text-xs text-[#bababa] font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((v) => (
                      <tr key={v.venta_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 font-medium text-gray-800">{v.numero_venta}</td>
                        <td className="px-3 py-3 text-gray-700">{v.cliente_nombre}</td>
                        <td className="px-3 py-3">
                          <p className="font-medium">{v.placa || "-"}</p>
                          <p className="text-xs text-gray-400">{v.vehiculo_marca} {v.vehiculo_modelo}</p>
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs">
                          {v.comprobante ? (
                            <span>{v.tipo_comprobante_nombre}: {v.comprobante}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-800">{formatMoney(v.total)}</td>
                        <td className="px-3 py-3 text-center text-gray-500">{formatFecha(v.fecha_venta)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.estado === "anulada" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                            {v.estado === "anulada" ? "Anulada" : "Completada"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setVentaIdDetalle(v.venta_id)}
                            className="p-1.5 text-gray-400 hover:text-[#e5ba4a] rounded transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPagH > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button disabled={paginaH === 1} onClick={() => setPaginaH(p => p - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
                    <span className="px-3 py-1 text-sm text-gray-500">{paginaH} / {totalPagH}</span>
                    <button disabled={paginaH === totalPagH} onClick={() => setPaginaH(p => p + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {cotizacionModal && (
        <GenerarVentaModal
          cotizacion={cotizacionModal}
          onClose={() => setCotizacionModal(null)}
          onSuccess={handleVentaGenerada}
        />
      )}

      {ventaIdDetalle && (
        <DetalleVentaModal
          ventaId={ventaIdDetalle}
          onClose={() => setVentaIdDetalle(null)}
          onAnulada={handleAnulada}
        />
      )}
    </div>
  );
};

export default VentasPage;
