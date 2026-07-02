import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import cotizacionService from "../services/cotizacionService";

const getEstadoColor = (estado) => {
  const colores = {
    borrador: "bg-gray-200 text-gray-800",
    pendiente: "bg-yellow-200 text-yellow-800",
    aprobada: "bg-green-200 text-green-800",
    rechazada: "bg-red-200 text-red-800",
    vencida: "bg-gray-200 text-gray-500",
  };
  return colores[estado] || "bg-gray-100 text-gray-800";
};

const getEstadoTexto = (estado) => {
  const textos = {
    borrador: "Borrador",
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
    vencida: "Vencida",
  };
  return textos[estado] || estado;
};

const formatMoney = (value) =>
  `S/ ${(parseFloat(value) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const VerCotizacionPublica = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [cotizacion, setCotizacion] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    cargarCotizacion();
  }, [token]);

  const cargarCotizacion = async () => {
    try {
      setLoading(true);
      const [cotizacionResponse, imagenesResponse] = await Promise.all([
        cotizacionService.obtenerPorToken(token),
        cotizacionService.obtenerImagenesPublicas(token),
      ]);
      setCotizacion(cotizacionResponse.data);
      setImagenes(imagenesResponse.data || []);
    } catch (err) {
      console.error("Error al cargar cotización pública:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error || !cotizacion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Enlace no válido
          </h2>
          <p className="text-gray-500">
            Este enlace expiró o la cotización ya no está disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-gray-400">COTIZACIÓN</p>
            <h1 className="text-2xl font-bold text-gray-800">
              {cotizacion.numero || `#${cotizacion.cotizacion_id}`}
            </h1>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full ${getEstadoColor(cotizacion.estado)}`}
          >
            {getEstadoTexto(cotizacion.estado)}
          </span>
        </div>

        {/* Cliente y Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-1">Cliente</p>
            <p className="font-medium text-gray-800">
              {cotizacion.cliente_nombre || "-"}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-1">Vehículo</p>
            <p className="font-medium text-gray-800">{cotizacion.vehiculo}</p>
          </div>
        </div>

        {/* Detalles */}
        <table className="w-full text-sm mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-center">Cant.</th>
              <th className="px-3 py-2 text-right">P. Unit.</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(cotizacion.detalles || []).map((d, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-3 py-2">{d.descripcion}</td>
                <td className="px-3 py-2 text-center">{d.cantidad}</td>
                <td className="px-3 py-2 text-right">
                  {formatMoney(d.precio_unitario)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatMoney(d.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 max-w-xs ml-auto text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatMoney(cotizacion.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">IGV (18%):</span>
            <span>{formatMoney(cotizacion.igv)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span>Total:</span>
            <span className="text-blue-600">
              {formatMoney(cotizacion.total)}
            </span>
          </div>
        </div>

        {/* Imágenes del vehículo */}
        {imagenes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">
              Imágenes del vehículo ({imagenes.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagenes.map((imagen) => (
                <div key={imagen.imagen_id}>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={imagen.ruta_archivo}
                      alt={imagen.descripcion || "Imagen del vehículo"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {imagen.descripcion && (
                    <p className="text-xs text-gray-600 mt-1 whitespace-normal break-words">
                      {imagen.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {cotizacion.observaciones && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Observaciones</h3>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
              {cotizacion.observaciones}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerCotizacionPublica;
