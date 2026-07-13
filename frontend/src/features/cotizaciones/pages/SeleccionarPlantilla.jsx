import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import cotizacionService from "../services/cotizacionService";
import { formatFecha } from "../utils/fechaEntrega";

const SeleccionarPlantilla = () => {
  const navigate = useNavigate();
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [cargandoId, setCargandoId] = useState(null);

  // Debounce búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(busquedaInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [busquedaInput]);

  useEffect(() => {
    cargarPlantillas();
  }, [busqueda]);

  const cargarPlantillas = async () => {
    try {
      setLoading(true);
      const response = await cotizacionService.listarPlantillas(busqueda);
      setPlantillas(response.data || []);
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
      Swal.fire("Error", "No se pudieron cargar las plantillas", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionar = async (plantillaId) => {
    try {
      setCargandoId(plantillaId);
      const response = await cotizacionService.obtenerPlantilla(plantillaId);
      const { detalles, nombre_modelo } = response.data;

      // Navegar al wizard pasando los detalles via state de React Router
      navigate("/cotizaciones/nueva/desde-cero", {
        state: {
          detallesPlantilla: detalles,
          nombrePlantilla: nombre_modelo,
        },
      });
    } catch (error) {
      console.error("Error al cargar plantilla:", error);
      Swal.fire("Error", "No se pudo cargar la plantilla", "error");
    } finally {
      setCargandoId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate("/cotizaciones/nueva")}
        className="flex items-center gap-2 text-brand hover:text-brand-hover mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Seleccionar Plantilla
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Elige una plantilla para pre-cargar los ítems en tu nueva cotización.
        </p>

        {/* Buscador */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busquedaInput}
            onChange={(e) => setBusquedaInput(e.target.value)}
            placeholder="Buscar plantilla por nombre..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : plantillas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <DocumentDuplicateIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {busqueda
                ? "No se encontraron plantillas"
                : "No hay plantillas guardadas"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {!busqueda &&
                "Crea una cotización y guárdala como plantilla desde el paso de Resumen."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {plantillas.map((plantilla) => (
              <button
                key={plantilla.cotizacion_id}
                onClick={() => handleSeleccionar(plantilla.cotizacion_id)}
                disabled={cargandoId === plantilla.cotizacion_id}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-brand hover:bg-brand/5 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <DocumentDuplicateIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {plantilla.nombre_modelo || "Sin nombre"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">
                        Creada: {formatFecha(plantilla.fecha_emision)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {plantilla.total_items} ítem
                        {plantilla.total_items !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-brand transition-colors text-xl flex-shrink-0">
                  {cargandoId === plantilla.cotizacion_id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand" />
                  ) : (
                    "›"
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeleccionarPlantilla;
