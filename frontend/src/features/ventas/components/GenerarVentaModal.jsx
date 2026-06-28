import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal/Modal";
import { swalConfirm, swalSuccess, swalError } from "@/lib/swal";
import ventaService from "../services/ventaService";
import api from "@/lib/axios";
import { Plus, Trash2 } from "lucide-react";

const METODOS = ["efectivo", "tarjeta", "transferencia", "yape", "plin"];

const formatMoney = (v) =>
  `S/ ${(parseFloat(v) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const GenerarVentaModal = ({ cotizacion, onClose, onSuccess }) => {
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [tipoComprobanteId, setTipoComprobanteId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [pagos, setPagos] = useState([{ metodo: "efectivo", monto: "" }]);
  const [guardando, setGuardando] = useState(false);

  const total = parseFloat(cotizacion?.total || 0);

  useEffect(() => {
    api.get("/comprobantes/tipos").then((r) => setTiposComprobante(r.data || [])).catch(() => {});
    if (cotizacion) {
      setPagos([{ metodo: "efectivo", monto: String(parseFloat(cotizacion.total || 0).toFixed(2)) }]);
    }
  }, [cotizacion]);

  const totalPagos = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
  const diferencia = total - totalPagos;
  const pagosValidos = Math.abs(diferencia) < 0.01;

  const agregarPago = () => {
    if (pagos.length >= 4) return;
    const restante = Math.max(0, diferencia).toFixed(2);
    setPagos((prev) => [...prev, { metodo: "efectivo", monto: restante }]);
  };

  const quitarPago = (i) => setPagos((prev) => prev.filter((_, idx) => idx !== i));

  const actualizarPago = (i, field, value) =>
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const handleSubmit = async () => {
    if (!pagosValidos) {
      swalError("Error de pago", "El total de los pagos debe coincidir con el total de la cotización.");
      return;
    }
    const result = await swalConfirm(
      "¿Generar venta?",
      `Se generará la venta por ${formatMoney(total)} y se descontará el stock definitivamente.`
    );
    if (!result.isConfirmed) return;

    setGuardando(true);
    try {
      const resultado = await ventaService.generarVenta({
        cotizacion_id: cotizacion.cotizacion_id,
        tipo_comprobante_id: tipoComprobanteId || null,
        pagos: pagos.map((p) => ({ metodo: p.metodo, monto: parseFloat(p.monto) })),
        observaciones: observaciones || null,
      });
      swalSuccess(`Venta generada: ${resultado.numero_venta}`);
      onSuccess();
    } catch (error) {
      const msg = error?.response?.data?.message || "Error al generar la venta.";
      swalError("Error", msg);
    } finally {
      setGuardando(false);
    }
  };

  if (!cotizacion) return null;

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a] focus:border-transparent";

  return (
    <Modal open onClose={onClose} title="Generar venta" size="lg">
      <div className="space-y-5">
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Cotización:</span>
            <span className="font-medium">{cotizacion.numero_cotizacion}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Cliente:</span>
            <span className="font-medium">{cotizacion.cliente_nombre}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Vehículo:</span>
            <span className="font-medium">{cotizacion.placa} — {cotizacion.vehiculo_marca} {cotizacion.vehiculo_modelo}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
            <span className="font-semibold text-gray-700">Total a cobrar:</span>
            <span className="font-bold text-lg text-[#e5ba4a]">{formatMoney(cotizacion.total)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Comprobante (opcional)</label>
          <select
            value={tipoComprobanteId}
            onChange={(e) => setTipoComprobanteId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin comprobante</option>
            {tiposComprobante.map((t) => (
              <option key={t.tipo_comprobante_id} value={t.tipo_comprobante_id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Pago</span>
            {pagos.length < 4 && (
              <button
                type="button"
                onClick={agregarPago}
                className="text-xs flex items-center gap-1 text-[#e5ba4a] hover:text-[#d4a93a] transition-colors"
              >
                <Plus size={14} />
                Agregar método
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pagos.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={p.metodo}
                  onChange={(e) => actualizarPago(i, "metodo", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a] flex-1"
                >
                  {METODOS.map((m) => (
                    <option key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.monto}
                  onChange={(e) => actualizarPago(i, "monto", e.target.value)}
                  placeholder="0.00"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a] text-right"
                />
                {pagos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarPago(i)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className={`flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 font-medium ${!pagosValidos ? "text-red-600" : "text-green-600"}`}>
            <span>Total pagado:</span>
            <span>{formatMoney(totalPagos)}</span>
          </div>
          {!pagosValidos && (
            <p className="text-xs text-red-500 mt-1">
              {diferencia > 0 ? `Faltan ${formatMoney(diferencia)}` : `Excede en ${formatMoney(-diferencia)}`}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            maxLength={300}
            className={inputClass}
            placeholder="Observaciones opcionales..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando || !pagosValidos}
            className="px-5 py-2 text-sm bg-[#e5ba4a] hover:bg-[#d4a93a] text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? "Generando..." : "Generar venta"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GenerarVentaModal;
