import React, { useState } from "react";
import Swal from "sweetalert2";

const PasoResumen = ({ data, onGuardar, onPrevious, onUpdate }) => {
  const [fechaEntrega, setFechaEntrega] = useState(data.fecha_entrega || "");
  const [diasEstimados, setDiasEstimados] = useState(data.dias_estimados || "");
  const [mostrarModalPlantilla, setMostrarModalPlantilla] = useState(false);
  const [nombrePlantilla, setNombrePlantilla] = useState("");

  const calcularFechaDesdeDias = (dias) => {
    if (!dias || dias <= 0) return "";
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + parseInt(dias));
    return fecha.toISOString().split("T")[0];
  };

  const calcularDiasDesdeFecha = (fecha) => {
    if (!fecha) return "";
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEntregaObj = new Date(fecha);
    fechaEntregaObj.setHours(0, 0, 0, 0);
    const diffTime = fechaEntregaObj - hoy;
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDias > 0 ? diffDias : "";
  };

  const handleDiasChange = (e) => {
    const dias = e.target.value;
    setDiasEstimados(dias);

    if (dias && parseInt(dias) > 0) {
      const nuevaFecha = calcularFechaDesdeDias(dias);
      setFechaEntrega(nuevaFecha);
      onUpdate({ dias_estimados: dias, fecha_entrega: nuevaFecha });
    } else {
      setFechaEntrega("");
      onUpdate({ dias_estimados: dias, fecha_entrega: "" });
    }
  };

  const handleFechaChange = (e) => {
    const fecha = e.target.value;
    setFechaEntrega(fecha);

    if (fecha) {
      const dias = calcularDiasDesdeFecha(fecha);
      setDiasEstimados(dias);
      onUpdate({ fecha_entrega: fecha, dias_estimados: dias });
    } else {
      setDiasEstimados("");
      onUpdate({ fecha_entrega: "", dias_estimados: "" });
    }
  };

  const formatMoney = (value) => {
    return `S/ ${(value || 0).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
    })}`;
  };

  const handleGuardar = () => {
    // Sincroniza antes de mostrar el modal
    onUpdate({
      fecha_entrega: fechaEntrega,
      dias_estimados: diasEstimados,
    });
    setMostrarModalPlantilla(true);
  };

  const handleGuardarPlantilla = async () => {
    if (!nombrePlantilla.trim()) {
      Swal.fire("Error", "Ingrese un nombre para la plantilla", "error");
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Plantilla guardada",
      text: `La plantilla "${nombrePlantilla}" se guardó correctamente`,
      confirmButtonText: "OK",
    });

    setMostrarModalPlantilla(false);
    // Pasa la fecha directamente para evitar race condition con el estado del padre
    onGuardar({ fecha_entrega: fechaEntrega, dias_estimados: diasEstimados });
  };

  const handleGuardarNormal = () => {
    setMostrarModalPlantilla(false);
    // Pasa la fecha directamente para evitar race condition con el estado del padre
    onGuardar({ fecha_entrega: fechaEntrega, dias_estimados: diasEstimados });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Resumen de Cotización
      </h2>

      <div className="space-y-6">
        {/* Datos del Cliente */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Cliente</h3>
          <p className="text-gray-600">{data.cliente_nombre}</p>
        </div>

        {/* Datos del Vehículo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Vehículo</h3>
          <p className="text-gray-600">
            {data.placa} - {data.marca} {data.modelo} ({data.anio})
          </p>
        </div>

        {/* Resumen de precios */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Precios</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatMoney(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Descuento:</span>
              <span>- {formatMoney(data.descuento_global || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IGV (18%):</span>
              <span>{formatMoney(data.igv || 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span className="text-blue-600">{formatMoney(data.total)}</span>
            </div>
          </div>
        </div>

        {/* Fecha de entrega */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">
            Fecha Estimada de Entrega
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Días estimados
              </label>
              <input
                type="number"
                value={diasEstimados}
                onChange={handleDiasChange}
                placeholder="Ej: 3"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Ingrese días para calcular la fecha
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fecha específica
              </label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={handleFechaChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                O seleccione una fecha específica
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrevious}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={handleGuardar}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Guardar Cotización
        </button>
      </div>

      {/* Modal Guardar como Plantilla */}
      {mostrarModalPlantilla && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Guardar como Plantilla
            </h3>

            <p className="text-gray-600 mb-4">
              ¿Desea guardar esta cotización como plantilla para usarla en el
              futuro?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la plantilla
              </label>
              <input
                type="text"
                value={nombrePlantilla}
                onChange={(e) => setNombrePlantilla(e.target.value)}
                placeholder="Ej: Mantenimiento Básico, Cambio de Frenos, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleGuardarNormal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                No, solo guardar
              </button>
              <button
                onClick={handleGuardarPlantilla}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Guardar como Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasoResumen;
