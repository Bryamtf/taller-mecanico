import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  calcularFechaDesdeDias,
  calcularDiasDesdeFecha,
  inicializarFechaYDias,
} from "../utils/fechaEntrega";
import cotizacionService from "../services/cotizacionService";
const PasoResumen = ({ data, onGuardar, onPrevious, onUpdate }) => {
  const entrega = inicializarFechaYDias(data.fecha_entrega);
  const [fechaEntrega, setFechaEntrega] = useState(entrega.fecha);
  const [diasEstimados, setDiasEstimados] = useState(entrega.dias);

  const vencimiento = inicializarFechaYDias(data.fecha_vencimiento, 15);
  const [fechaVencimiento, setFechaVencimiento] = useState(vencimiento.fecha);
  const [diasVencimiento, setDiasVencimiento] = useState(vencimiento.dias);
  const [mostrarModalPlantilla, setMostrarModalPlantilla] = useState(false);
  const [nombrePlantilla, setNombrePlantilla] = useState("");
  // Cuando cambian los días, actualizar la fecha
  const handleDiasChange = (e) => {
    let dias = e.target.value;

    if (dias && parseInt(dias) > 90) {
      dias = "90";
    }

    setDiasEstimados(dias);

    if (dias && parseInt(dias) > 0) {
      const nuevaFecha = calcularFechaDesdeDias(dias);
      setFechaEntrega(nuevaFecha);
      onUpdate({
        dias_estimados: dias,
        fecha_entrega: nuevaFecha,
      });
    } else {
      setFechaEntrega("");
      onUpdate({
        dias_estimados: dias,
        fecha_entrega: "",
      });
    }
  };
  // Cuando cambia la fecha, actualizar los días
  const handleFechaChange = (e) => {
    const fecha = e.target.value;
    setFechaEntrega(fecha);

    if (fecha) {
      const dias = calcularDiasDesdeFecha(fecha);
      setDiasEstimados(dias);
      onUpdate({
        fecha_entrega: fecha,
        dias_estimados: dias,
      });
    } else {
      setDiasEstimados("");
      onUpdate({
        fecha_entrega: "",
        dias_estimados: "",
      });
    }
  };
  const handleDiasVencimientoChange = (e) => {
    let dias = e.target.value;
    if (dias && parseInt(dias) > 99) dias = "99";
    setDiasVencimiento(dias);

    if (dias && parseInt(dias) > 0) {
      const nuevaFecha = calcularFechaDesdeDias(dias);
      setFechaVencimiento(nuevaFecha);
      onUpdate({ dias_vencimiento: dias, fecha_vencimiento: nuevaFecha });
    } else {
      setFechaVencimiento("");
      onUpdate({ dias_vencimiento: dias, fecha_vencimiento: "" });
    }
  };

  const handleFechaVencimientoChange = (e) => {
    const fecha = e.target.value;
    setFechaVencimiento(fecha);
    const dias = calcularDiasDesdeFecha(fecha);
    setDiasVencimiento(dias);
    onUpdate({ fecha_vencimiento: fecha, dias_vencimiento: dias });
  };

  const formatMoney = (value) => {
    return `S/ ${(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
  };

  const handleGuardar = () => {
    onUpdate({
      fecha_entrega: fechaEntrega,
      dias_estimados: diasEstimados,
      fecha_vencimiento: fechaVencimiento,
      dias_vencimiento: diasVencimiento,
    });
    setMostrarModalPlantilla(true);
  };

 const handleGuardarPlantilla = async () => {
   if (!nombrePlantilla.trim()) {
     Swal.fire("Error", "Ingrese un nombre para la plantilla", "error");
     return;
   }

   try {
     // Preparar detalles sin descuentos (se resetean a 0 en plantillas)
     const detallesParaPlantilla = (data.detalles || []).map((d) => ({
       descripcion_custom: d.descripcion_custom,
       cantidad: d.cantidad,
       precio_unitario: d.precio_unitario,
       descuento: 0,
       es_servicio: d.es_servicio || 0,
       articulo_id: d.articulo_id || null,
       marca_id: d.marca_id || null,
     }));

     await cotizacionService.guardarComoPlantilla(
       nombrePlantilla.trim(),
       detallesParaPlantilla,
     );

     Swal.fire({
       icon: "success",
       title: "Plantilla guardada",
       text: `La plantilla "${nombrePlantilla}" se guardó correctamente`,
       confirmButtonText: "OK",
     });

     setMostrarModalPlantilla(false);
     onGuardar(); // guarda la cotización normal también
   } catch (error) {
     console.error("Error al guardar plantilla:", error);
     Swal.fire(
       "Error",
       error.response?.data?.message || "No se pudo guardar la plantilla",
       "error",
     );
   }
 };

  const handleGuardarNormal = () => {
    setMostrarModalPlantilla(false);
    onGuardar();
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

        {/* Fecha de entrega - Interactivo */}
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
                max="90"
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

        {/* Fecha de vencimiento */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">
            Vigencia de la Cotización
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Días de vigencia
              </label>
              <input
                type="number"
                value={diasVencimiento}
                onChange={handleDiasVencimientoChange}
                placeholder="Ej: 15"
                min="1"
                max="99"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Por defecto 15 días</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={handleFechaVencimientoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
