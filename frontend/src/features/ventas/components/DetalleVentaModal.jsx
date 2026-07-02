import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal/Modal";
import { swalConfirm, swalSuccess, swalError } from "@/lib/swal";
import ventaService from "../services/ventaService";

const formatMoney = (v) =>
  `S/ ${(parseFloat(v) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const formatFecha = (f) => {
  if (!f) return "-";
  return new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const METODO_LABEL = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  yape: "Yape",
  plin: "Plin",
  mixto: "Mixto",
};

const DetalleVentaModal = ({ ventaId, onClose, onAnulada }) => {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anulando, setAnulando] = useState(false);

  useEffect(() => {
    if (!ventaId) return;
    ventaService.obtenerPorId(ventaId).then(setVenta).catch(() => swalError("Error", "No se pudo cargar la venta.")).finally(() => setLoading(false));
  }, [ventaId]);

  const handleAnular = async () => {
    const result = await swalConfirm(
      "¿Anular venta?",
      "Se revertirá el stock y se marcará el comprobante como anulado. Esta acción no se puede deshacer."
    );
    if (!result.isConfirmed) return;
    setAnulando(true);
    try {
      await ventaService.anular(ventaId);
      swalSuccess("Venta anulada correctamente.");
      onAnulada?.();
      onClose();
    } catch (error) {
      swalError("Error", error?.response?.data?.message || "Error al anular la venta.");
    } finally {
      setAnulando(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Detalle de venta" size="lg">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e5ba4a]" />
        </div>
      ) : !venta ? (
        <p className="text-center text-gray-500 py-10">No se pudo cargar la información.</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-gray-400">VENTA</p>
              <p className="text-xl font-bold text-gray-800">{venta.numero_venta}</p>
              {venta.comprobante_numero && (
                <p className="text-xs text-gray-500">{venta.comprobante_tipo}: {venta.comprobante_numero}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full ${venta.estado === "anulada" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                {venta.estado === "anulada" ? "Anulada" : "Completada"}
              </span>
              <span className="text-xs text-gray-400">{formatFecha(venta.fecha_venta)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 uppercase mb-1">Cliente</p>
              <p className="font-medium">{venta.cliente_nombre}</p>
              {venta.dni_ruc && <p className="text-gray-500">{venta.dni_ruc}</p>}
              {venta.telefono && <p className="text-gray-500">{venta.telefono}</p>}
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 uppercase mb-1">Vehículo</p>
              <p className="font-medium">{venta.placa || "-"}</p>
              <p className="text-gray-500">{venta.vehiculo_marca} {venta.vehiculo_modelo}</p>
              {venta.numero_cotizacion && <p className="text-gray-500">Cotiz.: {venta.numero_cotizacion}</p>}
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-2">Ítems</p>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs text-gray-500">Descripción</th>
                    <th className="text-center px-3 py-2 text-xs text-gray-500">Cant.</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">P. Unit.</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(venta.detalles || []).map((d, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <p>{d.descripcion_custom || d.articulo_nombre || "Ítem"}</p>
                        {d.marca_nombre && <p className="text-xs text-gray-400">{d.marca_nombre}</p>}
                        {Boolean(d.es_servicio) && <span className="text-[10px] text-blue-500">Servicio</span>}
                      </td>
                      <td className="text-center px-3 py-2">{d.cantidad}</td>
                      <td className="text-right px-3 py-2">{formatMoney(d.precio_unitario)}</td>
                      <td className="text-right px-3 py-2 font-medium">{formatMoney(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="font-medium text-gray-700 mb-2">Pagos</p>
              <div className="space-y-1">
                {(venta.pagos || []).length > 0 ? (
                  venta.pagos.map((p, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-gray-500 w-28">{METODO_LABEL[p.metodo] || p.metodo}:</span>
                      <span className="font-medium">{formatMoney(p.monto)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs">{METODO_LABEL[venta.tipo_pago] || venta.tipo_pago}</p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg min-w-[180px]">
              <div className="flex justify-between mb-1 text-gray-500">
                <span>Subtotal:</span><span>{formatMoney(venta.subtotal)}</span>
              </div>
              {parseFloat(venta.descuento) > 0 && (
                <div className="flex justify-between mb-1 text-green-600">
                  <span>Descuento:</span><span>- {formatMoney(venta.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between mb-1 text-gray-500">
                <span>IGV:</span><span>{formatMoney(venta.igv)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total:</span><span className="text-[#e5ba4a]">{formatMoney(venta.total)}</span>
              </div>
            </div>
          </div>

          {venta.observaciones && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 uppercase mb-1">Observaciones</p>
              <p className="text-gray-600 whitespace-pre-wrap">{venta.observaciones}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            {venta.estado !== "anulada" ? (
              <button
                onClick={handleAnular}
                disabled={anulando}
                className="px-4 py-2 text-sm text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60"
              >
                {anulando ? "Anulando..." : "Anular venta"}
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DetalleVentaModal;
