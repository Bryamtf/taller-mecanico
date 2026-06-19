import React, { useState, useRef, useEffect } from "react";
import ListaImagenes from "./ListaImagenes";

const PasoArchivos = ({ data, onNext, onPrevious, onUpdate }) => {
  const [imagenes, setImagenes] = useState(data.imagenes || []);
  const [descripcionActual, setDescripcionActual] = useState("");
  const fileInputRef = useRef(null);

  // Debug
  useEffect(() => {}, []);

  const validarTamaño = (file) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`La imagen ${file.name} excede 5 MB`);
      return false;
    }
    return true;
  };

  const validarFormato = (file) => {
    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!formatosPermitidos.includes(file.type)) {
      alert(`Formato no permitido: ${file.name}. Use JPG, PNG o WEBP`);
      return false;
    }
    return true;
  };

  const handleAgregarImagenes = (e) => {
    const files = Array.from(e.target.files);

    const nuevasImagenes = [];

    for (const file of files) {
      if (!validarFormato(file)) continue;
      if (!validarTamaño(file)) continue;

      const preview = URL.createObjectURL(file);

      nuevasImagenes.push({
        file: file,
        preview: preview,
        descripcion: descripcionActual,
        orden: imagenes.length + nuevasImagenes.length + 1,
      });
    }

    setImagenes([...imagenes, ...nuevasImagenes]);
    setDescripcionActual("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEliminarImagen = (index) => {
    const nuevasImagenes = [...imagenes];
    URL.revokeObjectURL(nuevasImagenes[index].preview);
    nuevasImagenes.splice(index, 1);

    nuevasImagenes.forEach((img, i) => {
      img.orden = i + 1;
    });

    setImagenes(nuevasImagenes);
  };

  const handleSubmit = () => {
    const imagenesParaEnviar = imagenes.map((img) => ({
      file: img.file,
      preview: img.preview,
      descripcion: img.descripcion || "",
      orden: img.orden,
    }));

    onUpdate({ imagenes: imagenesParaEnviar });

    onNext(imagenesParaEnviar);
  };
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Paso 4 de 4: Archivos
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción general de las imágenes (opcional)
        </label>
        <textarea
          value={descripcionActual}
          onChange={(e) => setDescripcionActual(e.target.value)}
          placeholder="Ej: Daños en la parte delantera, diagnóstico de motor, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          📷 Agregar Imágenes
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleAgregarImagenes}
          className="hidden"
        />
        <p className="text-xs text-gray-400 mt-2">
          Máximo 10 imágenes. Formatos: JPG, PNG, WEBP. Tamaño máx: 5 MB por
          imagen.
        </p>
      </div>

      {imagenes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">
            Imágenes seleccionadas ({imagenes.length}/10)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {imagenes.map((imagen, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={imagen.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={imagen.descripcion || ""}
                      onChange={(e) => {
                        const nuevasImagenes = [...imagenes];
                        nuevasImagenes[index].descripcion = e.target.value;
                        setImagenes(nuevasImagenes);
                      }}
                      placeholder="Descripción (opcional)"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                    <button
                      onClick={() => handleEliminarImagen(index)}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

export default PasoArchivos;
