import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  DocumentPlusIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

const ElegirTipoCotizacion = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto p-6">
      <button
        onClick={() => navigate("/cotizaciones")}
        className="flex items-center gap-2 text-brand hover:text-brand-hover mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Regresar</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Nueva Cotización
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          ¿Cómo deseas crear tu cotización?
        </p>

        <div className="space-y-4">
          {/* Crear desde cero */}
          <button
            onClick={() => navigate("/cotizaciones/nueva/desde-cero")}
            className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-xl hover:border-brand hover:bg-brand/5 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <DocumentPlusIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Crear desde cero</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Ingresa los datos del cliente y agrega los productos o servicios
                manualmente.
              </p>
            </div>
            <span className="ml-auto text-gray-300 group-hover:text-brand transition-colors text-xl">
              ›
            </span>
          </button>

          {/* Usar plantilla */}
          <button
            onClick={() => navigate("/cotizaciones/nueva/plantilla")}
            className="w-full flex items-center gap-4 p-5 border-2 border-gray-200 rounded-xl hover:border-brand hover:bg-brand/5 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
              <DocumentDuplicateIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Usar plantilla</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Selecciona una plantilla guardada para usarla como base en tu
                nueva cotización.
              </p>
            </div>
            <span className="ml-auto text-gray-300 group-hover:text-brand transition-colors text-xl">
              ›
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElegirTipoCotizacion;
