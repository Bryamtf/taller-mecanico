import React from "react";

const ListaImagenes = ({ imagenes, onEliminar }) => {
  if (imagenes.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No hay imágenes seleccionadas</p>
        <p className="text-xs text-gray-400 mt-1">
          Use el botón "Agregar" para subir fotos
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {imagenes.map((imagen, index) => (
        <div key={index} className="relative group">
          {/* Imagen */}
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={imagen.preview}
              alt={`Imagen ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Descripción (opcional) */}
          {imagen.descripcion && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {imagen.descripcion}
            </p>
          )}

          {/* Botón eliminar */}
          <button
            onClick={() => onEliminar(index)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Eliminar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ListaImagenes;
