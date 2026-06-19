import React from "react";

const ResumenParcial = ({
  detalles,
  descuentoGlobal = 0,
  onDescuentoChange,
}) => {
  const subtotal = detalles.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0,
  );
  const subtotalConDescuento = subtotal - descuentoGlobal;
  const igv = subtotalConDescuento * 0.18;
  const total = subtotalConDescuento + igv;

  const formatMoney = (value) => {
    return `S/ ${(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatMoney(subtotal)}</span>
          </div>

          {descuentoGlobal > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento global:</span>
              <span>- {formatMoney(descuentoGlobal)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IGV (18%):</span>
            <span>{formatMoney(igv)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 mt-2">
            <span>TOTAL:</span>
            <span className="text-blue-600">{formatMoney(total)}</span>
          </div>
        </div>

        {/* Descuento global (opcional) */}
        <div className="ml-4 w-40">
          <label className="block text-xs text-gray-500 mb-1">
            Descuento global
          </label>
          <input
            type="number"
            value={descuentoGlobal}
            onChange={(e) => onDescuentoChange(parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ResumenParcial;
