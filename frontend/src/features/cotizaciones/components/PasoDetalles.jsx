import React, { useState } from "react";
import FormularioDetalle from "./FormularioDetalle";
import TablaDetalles from "./TablaDetalles";
import ResumenParcial from "./ResumenParcial";

const PasoDetalles = ({ data, onNext, onPrevious, onUpdate }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [detalles, setDetalles] = useState(data.detalles || []);
  const [descuentoGlobal, setDescuentoGlobal] = useState(
    data.descuento_global || 0,
  );

  const handleAgregarDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
    setMostrarFormulario(false);
  };

  const handleEliminarDetalle = (index) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
  };

  const handleSubmit = () => {
    if (detalles.length === 0) {
      alert("Debe agregar al menos un item a la cotización");
      return;
    }

    // Calcular totales
    const subtotal = detalles.reduce(
      (sum, item) => sum + (item.subtotal || 0),
      0,
    );
    const subtotalConDescuento = subtotal - descuentoGlobal;
    const igv = subtotalConDescuento * 0.18;
    const total = subtotalConDescuento + igv;

    onUpdate({
      detalles: detalles,
      descuento_global: descuentoGlobal,
      subtotal: subtotal,
      igv: igv,
      total: total,
    });

    onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Paso 3 de 4: Detalle de Cotización
      </h2>

      {/* Botón agregar */}
      {!mostrarFormulario && (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          + Agregar Item
        </button>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <FormularioDetalle
          onAgregar={handleAgregarDetalle}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {/* Tabla de detalles */}
      <TablaDetalles detalles={detalles} onEliminar={handleEliminarDetalle} />

      {/* Resumen parcial */}
      {detalles.length > 0 && (
        <ResumenParcial
          detalles={detalles}
          descuentoGlobal={descuentoGlobal}
          onDescuentoChange={setDescuentoGlobal}
        />
      )}

      {/* Botones */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onPrevious}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
};

export default PasoDetalles;
