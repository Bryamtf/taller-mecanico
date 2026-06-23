import React from "react";
import { Trash2, Pencil } from "lucide-react";

const TablaDetalles = ({
  detalles,
  onEliminar,
  onEditar,
  soloLectura = false,
}) => {
  const formatMoney = (value) => {
    return `S/ ${(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
  };

  if (detalles.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay items agregados</p>
        <p className="text-xs text-gray-400 mt-1">
          Use el formulario para agregar repuestos o servicios
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Descripción</th>
            <th className="px-3 py-2 text-center w-20">Cant.</th>
            <th className="px-3 py-2 text-right w-28">P. Unit.</th>
            <th className="px-3 py-2 text-right w-28">Descuento</th>
            <th className="px-3 py-2 text-right w-28">Subtotal</th>
            {!soloLectura && (
              <th className="px-3 py-2 text-center w-20">Acción</th>
            )}
          </tr>
        </thead>
        <tbody>
          {detalles.map((item, index) => (
            <tr
              key={index}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="px-3 py-2">
                <div>
                  <span className="font-medium">{item.descripcion_custom}</span>
                  {item.es_servicio === 1 && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                      Servicio
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 text-center">{item.cantidad}</td>
              <td className="px-3 py-2 text-right">
                {formatMoney(item.precio_unitario)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatMoney(item.descuento)}
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {formatMoney(item.subtotal)}
              </td>
              {!soloLectura && (
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEditar(index)}
                      title="Editar item"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onEliminar(index)}
                      title="Eliminar item"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaDetalles;
