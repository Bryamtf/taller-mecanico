import React, { useState } from "react";
import { Plus } from "lucide-react";
import Swal from "sweetalert2";
import FormularioDetalle from "./FormularioDetalle";
import TablaDetalles from "./TablaDetalles";
import ResumenParcial from "./ResumenParcial";

const PasoDetalles = ({ data, onNext, onPrevious, onUpdate }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [detalles, setDetalles] = useState(data.detalles || []);
  const [descuentoGlobal, setDescuentoGlobal] = useState(
    data.descuento_global || 0,
  );
  const [itemEditandoIndex, setItemEditandoIndex] = useState(null);

  const handleGuardarDetalle = (item) => {
    if (itemEditandoIndex !== null) {
      const nuevosDetalles = [...detalles];
      nuevosDetalles[itemEditandoIndex] = item;
      setDetalles(nuevosDetalles);
      setItemEditandoIndex(null);
    } else {
      setDetalles([...detalles, item]);
    }
    setMostrarFormulario(false);
  };

  const handleEditarDetalle = (index) => {
    setItemEditandoIndex(index);
    setMostrarFormulario(true);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setItemEditandoIndex(null);
  };

  const handleEliminarDetalle = (index) => {
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
  };
  const handleSubmit = () => {
    if (detalles.length === 0) {
      Swal.fire("Sin ítems", "Debes agregar al menos un ítem a la cotización.", "warning");
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

      {!mostrarFormulario && (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="mb-4 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
        >
          <Plus size={16} />
          Agregar ítem
        </button>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <FormularioDetalle
          key={itemEditandoIndex ?? "nuevo"}
          onAgregar={handleGuardarDetalle}
          onCancelar={handleCancelarFormulario}
          itemEditar={
            itemEditandoIndex !== null ? detalles[itemEditandoIndex] : null
          }
        />
      )}

      {/* Tabla de detalles */}
      <TablaDetalles
        detalles={detalles}
        onEliminar={handleEliminarDetalle}
        onEditar={handleEditarDetalle}
      />

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
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={handleSubmit}
          className="bg-[#e5ba4a] hover:bg-[#d4a93a] text-white px-6 py-2 rounded-lg transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
};

export default PasoDetalles;
