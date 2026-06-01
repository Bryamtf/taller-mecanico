// features/cotizaciones/pages
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import cotizacionService from "../services/cotizacionService";

const ListaCotizaciones = () => {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const response = await cotizacionService.listar();
      setCotizaciones(response.data || []);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
      Swal.fire("Error", "No se pudieron cargar las cotizaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, numero) => {
    const result = await Swal.fire({
      title: "¿Eliminar cotización?",
      text: `¿Estás seguro de eliminar ${numero}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await cotizacionService.eliminar(id);
        Swal.fire("Eliminada", "Cotización eliminada correctamente", "success");
        cargarCotizaciones();
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la cotización", "error");
      }
    }
  };

  const handleDescargarPDF = async (id, numero) => {
    try {
      const response = await cotizacionService.descargarPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `cotizacion_${numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire("Error", "No se pudo descargar el PDF", "error");
    }
  };

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

  const cotizacionesFiltradas =
    filtroEstado === "todos"
      ? cotizaciones
      : cotizaciones.filter((c) => c.estado === filtroEstado);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Mis Cotizaciones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona todas tus cotizaciones
          </p>
        </div>
        <button
          onClick={() => navigate("/cotizaciones/nueva")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Nueva Cotización
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFiltroEstado("todos")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            filtroEstado === "todos"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltroEstado("borrador")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            filtroEstado === "borrador"
              ? "bg-gray-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Borradores
        </button>
        <button
          onClick={() => setFiltroEstado("pendiente")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            filtroEstado === "pendiente"
              ? "bg-yellow-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFiltroEstado("aprobada")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            filtroEstado === "aprobada"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Aprobadas
        </button>
      </div>

      {/* Lista */}
      {cotizacionesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay cotizaciones</p>
          <button
            onClick={() => navigate("/cotizaciones/nueva")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Crear primera cotización
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cotizacionesFiltradas.map((cotizacion) => (
            <div
              key={cotizacion.cotizacion_id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-100"
            >
              {/* Número y estado */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-400">COTIZACIÓN</p>
                  <p className="font-bold text-lg text-gray-800">
                    {cotizacion.numero_cotizacion ||
                      `#${cotizacion.cotizacion_id}`}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(cotizacion.estado)}`}
                >
                  {getEstadoTexto(cotizacion.estado)}
                </span>
              </div>

              {/* Cliente */}
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-800">
                  {cotizacion.cliente_nombre || "Cliente no especificado"}
                </p>
                <p className="text-xs text-gray-400">{cotizacion.placa}</p>
              </div>

              {/* Fecha y total */}
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-500">
                  {cotizacion.fecha_emision
                    ? new Date(cotizacion.fecha_emision).toLocaleDateString(
                        "es-PE",
                      )
                    : "Sin fecha"}
                </span>
                <span className="font-bold text-blue-600">
                  S/{" "}
                  {parseFloat(cotizacion.total || 0).toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() =>
                    navigate(`/cotizaciones/${cotizacion.cotizacion_id}`)
                  }
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  title="Ver"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    navigate(`/cotizaciones/${cotizacion.cotizacion_id}/editar`)
                  }
                  className="text-gray-500 hover:text-brand transition-colors"
                  title="Editar"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    handleDescargarPDF(
                      cotizacion.cotizacion_id,
                      cotizacion.numero_cotizacion || cotizacion.cotizacion_id,
                    )
                  }
                  className="text-gray-500 hover:text-red-600 transition-colors"
                  title="Descargar PDF"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    navigate(
                      `/cotizaciones/${cotizacion.cotizacion_id}/compartir`,
                    )
                  }
                  className="text-gray-500 hover:text-green-600 transition-colors"
                  title="Compartir"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    handleEliminar(
                      cotizacion.cotizacion_id,
                      cotizacion.numero_cotizacion ||
                        `#${cotizacion.cotizacion_id}`,
                    )
                  }
                  className="text-gray-500 hover:text-red-600 transition-colors"
                  title="Eliminar"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaCotizaciones;
