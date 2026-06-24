import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import cotizacionService from "../services/cotizacionService";
import imagenService from "../services/imagenService";
import TablaDetalles from "../components/TablaDetalles";
import { ESTADOS_BLOQUEADOS } from "../utils/estados";
import { getImagenUrl } from "../utils/imagenUrl";
import { formatFecha } from "../utils/fechaEntrega";

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


const VerCotizacion = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [cotizacion, setCotizacion] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [descargando, setDescargando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [response, imagenesResponse] = await Promise.all([
        cotizacionService.obtenerPorId(id),
        imagenService.listar(id),
      ]);
      setCotizacion(response.data);
      setImagenes(imagenesResponse.data || []);
    } catch (error) {
      console.error("Error al cargar cotización:", error);
      Swal.fire("Error", "No se pudo cargar la cotización", "error");
      navigate("/cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async () => {
    const result = await Swal.fire({
      title: "¿Aprobar cotización?",
      text: "Se descontará el stock de los artículos incluidos. Esta acción no se puede deshacer directamente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
    });
    if (!result.isConfirmed) return;

    setCambiandoEstado(true);
    try {
      await cotizacionService.cambiarEstado(id, "aprobada");
      await cargarDatos();
      Swal.fire({ title: "Aprobada", text: "La cotización fue aprobada y el stock fue descontado.", icon: "success", timer: 2000, showConfirmButton: false });
    } catch (error) {
      const msg = error?.response?.data?.message || "No se pudo aprobar la cotización.";
      const articulo = error?.response?.data?.articulo;
      Swal.fire({
        title: "Error al aprobar",
        html: articulo
          ? `<p>${msg}</p><p class="mt-2 text-sm text-gray-600">Artículo: <strong>${articulo}</strong></p>`
          : msg,
        icon: "error",
      });
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleCambiarEstadoDesdeAprobada = async (nuevoEstado) => {
    const labels = { rechazada: "Rechazar", vencida: "Marcar como vencida" };
    const result = await Swal.fire({
      title: `¿${labels[nuevoEstado]} cotización?`,
      text: "El stock descontado será restaurado automáticamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${labels[nuevoEstado].toLowerCase()}`,
      cancelButtonText: "Cancelar",
      confirmButtonColor: nuevoEstado === "rechazada" ? "#dc2626" : "#6b7280",
    });
    if (!result.isConfirmed) return;

    setCambiandoEstado(true);
    try {
      await cotizacionService.cambiarEstado(id, nuevoEstado);
      await cargarDatos();
      Swal.fire({ title: "Listo", text: "El estado fue actualizado y el stock fue restaurado.", icon: "success", timer: 2000, showConfirmButton: false });
    } catch (error) {
      const msg = error?.response?.data?.message || "No se pudo cambiar el estado.";
      Swal.fire("Error", msg, "error");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleDescargarPDF = async () => {
    setDescargando(true);
    try {
      const response = await cotizacionService.descargarPDF(id);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `cotizacion_${cotizacion.numero_cotizacion || id}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      Swal.fire("Error", "No se pudo descargar el PDF", "error");
    } finally {
      setDescargando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!cotizacion) return null;

  const soloLectura = ESTADOS_BLOQUEADOS.includes(cotizacion.estado);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate("/cotizaciones")}
        className="flex items-center gap-2 text-brand hover:text-brand-hover mb-4 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Regresar a cotizaciones</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <p className="text-xs text-gray-400">COTIZACIÓN</p>
            <h2 className="text-2xl font-bold text-gray-800">
              {cotizacion.numero_cotizacion || `#${cotizacion.cotizacion_id}`}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full ${getEstadoColor(cotizacion.estado)}`}
            >
              {getEstadoTexto(cotizacion.estado)}
            </span>

            {(cotizacion.estado === "borrador" || cotizacion.estado === "pendiente") && (
              <button
                onClick={handleAprobar}
                disabled={cambiandoEstado}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cambiandoEstado ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                Aprobar
              </button>
            )}

            {cotizacion.estado === "aprobada" && (
              <>
                <button
                  onClick={() => handleCambiarEstadoDesdeAprobada("rechazada")}
                  disabled={cambiandoEstado}
                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cambiandoEstado ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircleIcon className="w-4 h-4" />
                  )}
                  Rechazar
                </button>
                <button
                  onClick={() => handleCambiarEstadoDesdeAprobada("vencida")}
                  disabled={cambiandoEstado}
                  className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cambiandoEstado ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircleIcon className="w-4 h-4" />
                  )}
                  Marcar vencida
                </button>
              </>
            )}

            {!soloLectura && (
              <button
                onClick={() => navigate(`/cotizaciones/${id}/editar`)}
                className="text-sm bg-brand hover:bg-brand-hover text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Editar
              </button>
            )}
            <button
              onClick={handleDescargarPDF}
              disabled={descargando}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {descargando ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <DocumentArrowDownIcon className="w-4 h-4" />
              )}
              {descargando ? "Generando..." : "Descargar PDF"}
            </button>
          </div>
        </div>

        {/* Cliente y Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-2">Cliente</p>
            <p className="font-medium text-gray-800">
              {cotizacion.cliente_nombre || "-"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {cotizacion.dni_ruc || "-"}
            </p>
            <p className="text-sm text-gray-500">
              {cotizacion.telefono || "-"}
            </p>
            <p className="text-sm text-gray-500">{cotizacion.email || "-"}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-2">Vehículo</p>
            <p className="font-medium text-gray-800">
              {cotizacion.placa || "-"} — {cotizacion.marca} {cotizacion.modelo}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Año: {cotizacion.anio || "-"} · Color: {cotizacion.color || "-"}
            </p>
            <p className="text-sm text-gray-500">
              VIN: {cotizacion.vin || "-"}
            </p>
            {cotizacion.kilometraje_momento && (
              <p className="text-sm text-gray-500">
                Kilometraje:{" "}
                {parseFloat(cotizacion.kilometraje_momento).toLocaleString()} km
              </p>
            )}
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase">Emisión</p>
            <p className="font-medium">
              {formatFecha(cotizacion.fecha_emision)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Vencimiento</p>
            <p className="font-medium">
              {formatFecha(cotizacion.fecha_vencimiento)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Entrega estimada</p>
            <p className="font-medium">
              {formatFecha(cotizacion.fecha_entrega)}
            </p>
          </div>
        </div>

        {/* Detalles */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Detalles</h3>
          <TablaDetalles detalles={cotizacion.detalles || []} soloLectura />
        </div>

        {/* Totales */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 max-w-sm ml-auto">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatMoney(cotizacion.subtotal)}</span>
          </div>
          {parseFloat(cotizacion.descuento) > 0 && (
            <div className="flex justify-between text-sm mb-1 text-green-600">
              <span>Descuento:</span>
              <span>- {formatMoney(cotizacion.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">IGV (18%):</span>
            <span>{formatMoney(cotizacion.igv)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span>Total:</span>
            <span className="text-brand">{formatMoney(cotizacion.total)}</span>
          </div>
        </div>

        {/* Imágenes */}
        {imagenes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">
              Imágenes ({imagenes.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagenes.map((imagen) => (
                <div key={imagen.imagen_id}>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={getImagenUrl(imagen.ruta_archivo)}
                      alt={imagen.descripcion || "Imagen de cotización"}
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
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Observaciones</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
            {cotizacion.observaciones || "Sin observaciones"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerCotizacion;
