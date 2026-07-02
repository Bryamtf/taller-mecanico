import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import cotizacionService from "../services/cotizacionService";
import ModalCompartir from "../components/ModalCompartir";
import { ESTADOS_BLOQUEADOS } from "../utils/estados";
import { formatFecha } from "../utils/fechaEntrega";

const OPCIONES_PAGE_SIZE = [20, 30, 50];

const getEstadoColor = (estado) => {
  const colores = {
    borrador: "bg-gray-200 text-gray-800",
    pendiente: "bg-yellow-200 text-yellow-800",
    aprobada: "bg-green-200 text-green-800",
    pagada: "bg-emerald-500 text-white",
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
    pagada: "Pagada",
  };
  return textos[estado] || estado;
};

const ListaCotizaciones = () => {
  const navigate = useNavigate();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });
  const [descargandoId, setDescargandoId] = useState(null);
  const [cotizacionParaCompartir, setCotizacionParaCompartir] = useState(null);
  
  const [expandidos, setExpandidos] = useState({});

  const toggleExpandido = (id) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Debounce: actualiza `busqueda` 400ms después de que el usuario deja de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(busquedaInput);
      setPage(1); // reset a página 1 al cambiar búsqueda
    }, 400);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  // Reset a página 1 cuando cambia estado o tamaño de página
  useEffect(() => {
    setPage(1);
  }, [filtroEstado, pageSize]);

  // Cargar cada vez que cambian los filtros o la página
  useEffect(() => {
    cargarCotizaciones();
  }, [filtroEstado, busqueda, page, pageSize]);

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        ...(filtroEstado !== "todos" && { estado: filtroEstado }),
        ...(busqueda.trim() && { busqueda: busqueda.trim() }),
      };
      const response = await cotizacionService.listar(params);
      setCotizaciones(response.data || []);
      setPagination(response.pagination || { total: 0, totalPages: 1 });
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
    setDescargandoId(id);
    try {
      const response = await cotizacionService.descargarPDF(id);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `cotizacion_${numero}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      Swal.fire("Error", "No se pudo descargar el PDF", "error");
    } finally {
      setDescargandoId(null);
    }
  };

  const inicio = (page - 1) * pageSize + 1;
  const fin = Math.min(page * pageSize, pagination.total);

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

      {/* Buscador + tamaño de página */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar por cliente, placa, N° cotización, DNI/RUC..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {OPCIONES_PAGE_SIZE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>por página</span>
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { valor: "todos", label: "Todos", activo: "bg-blue-600" },
          { valor: "borrador", label: "Borradores", activo: "bg-gray-600" },
          { valor: "pendiente", label: "Pendientes", activo: "bg-yellow-600" },
          { valor: "aprobada", label: "Aprobadas", activo: "bg-green-600" },
          { valor: "pagada", label: "Pagada", activo: "bg-emerald-600" },
          { valor: "rechazada", label: "Rechazadas", activo: "bg-red-600" },
          { valor: "vencida", label: "Vencidas", activo: "bg-gray-600" },
        ].map(({ valor, label, activo }) => (
          <button
            key={valor}
            onClick={() => setFiltroEstado(valor)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              filtroEstado === valor
                ? `${activo} text-white`
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : cotizaciones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {busqueda || filtroEstado !== "todos"
              ? "No se encontraron cotizaciones con esos filtros"
              : "No hay cotizaciones"}
          </p>
          {!busqueda && filtroEstado === "todos" && (
            <button
              onClick={() => navigate("/cotizaciones/nueva")}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Crear primera cotización
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Indicador de resultados */}
          <p className="text-sm text-gray-500 mb-4">
            Mostrando {inicio}–{fin} de {pagination.total} cotizaciones
          </p>

          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {cotizaciones.map((cotizacion) => {
              const estaExpandido = expandidos[cotizacion.cotizacion_id];
              return (
                <div
                  key={cotizacion.cotizacion_id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-100"
                >
                  {/* Header siempre visible — en móvil es clickeable para expandir */}
                  <div
                    className="flex justify-between items-start md:cursor-default cursor-pointer"
                    onClick={() => {
                      if (window.innerWidth < 768)
                        toggleExpandido(cotizacion.cotizacion_id);
                    }}
                  >
                    <div>
                      <p className="text-xs text-gray-400">COTIZACIÓN</p>
                      <p className="font-bold text-lg text-gray-800">
                        {cotizacion.numero_cotizacion ||
                          `#${cotizacion.cotizacion_id}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(cotizacion.estado)}`}
                      >
                        {getEstadoTexto(cotizacion.estado)}
                      </span>
                      <ChevronDownIcon
                        className={`w-4 h-4 text-gray-400 transition-transform md:hidden ${
                          estaExpandido ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Contenido colapsable en móvil, siempre visible en md+ */}
                  <div
                    className={`${estaExpandido ? "block" : "hidden"} md:block`}
                  >
                    {/* Cliente */}
                    <div className="mb-2 mt-3">
                      <p className="text-sm font-medium text-gray-800">
                        {cotizacion.cliente_nombre || "Cliente no especificado"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {cotizacion.placa}
                      </p>
                    </div>

                    {/* Fecha y total */}
                    <div className="flex justify-between items-center mb-3 text-sm">
                      <span className="text-gray-500">
                        {cotizacion.fecha_emision
                          ? formatFecha(cotizacion.fecha_emision)
                          : "Sin fecha"}
                      </span>
                      <span className="font-bold text-blue-600">
                        S/{" "}
                        {parseFloat(cotizacion.total || 0).toLocaleString(
                          "es-PE",
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
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
                      {!ESTADOS_BLOQUEADOS.includes(cotizacion.estado) && (
                        <button
                          onClick={() =>
                            navigate(
                              `/cotizaciones/${cotizacion.cotizacion_id}/editar`,
                            )
                          }
                          className="text-gray-500 hover:text-brand transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDescargarPDF(
                            cotizacion.cotizacion_id,
                            cotizacion.numero_cotizacion ||
                              cotizacion.cotizacion_id,
                          )
                        }
                        disabled={descargandoId === cotizacion.cotizacion_id}
                        className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Descargar PDF"
                      >
                        {descargandoId === cotizacion.cotizacion_id ? (
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <DocumentArrowDownIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setCotizacionParaCompartir(cotizacion.cotizacion_id)
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
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>

              {/* Números de página */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (n) =>
                    n === 1 ||
                    n === pagination.totalPages ||
                    Math.abs(n - page) <= 1,
                )
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) {
                    acc.push("...");
                  }
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                        page === item
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {cotizacionParaCompartir && (
        <ModalCompartir
          cotizacionId={cotizacionParaCompartir}
          onClose={() => setCotizacionParaCompartir(null)}
        />
      )}
    </div>
  );
};

export default ListaCotizaciones;
