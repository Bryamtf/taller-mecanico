import React, { useState, useRef, useEffect } from "react";
import {
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const SelectorBuscable = ({
  opciones,
  valorSeleccionado,
  onSeleccionar,
  getLabel,
  getValue,
  placeholder = "Seleccione una opción",
  vacioTexto = "No se encontraron resultados",
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
        setBusqueda("");
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  useEffect(() => {
    if (abierto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [abierto]);

  const opcionSeleccionada = opciones.find(
    (op) => getValue(op) === valorSeleccionado,
  );

  const opcionesFiltradas = opciones.filter((op) =>
    getLabel(op).toLowerCase().includes(busqueda.toLowerCase()),
  );

  const handleSeleccionar = (opcion) => {
    onSeleccionar(opcion);
    setAbierto(false);
    setBusqueda("");
  };

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between bg-white text-left"
      >
        <span
          className={opcionSeleccionada ? "text-gray-800" : "text-gray-400"}
        >
          {opcionSeleccionada ? getLabel(opcionSeleccionada) : placeholder}
        </span>
        <ChevronUpDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="relative p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2" />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {opcionesFiltradas.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">
                {vacioTexto}
              </p>
            ) : (
              opcionesFiltradas.map((opcion) => (
                <div
                  key={getValue(opcion)}
                  onMouseDown={() => handleSeleccionar(opcion)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    getValue(opcion) === valorSeleccionado
                      ? "bg-blue-50 font-medium"
                      : ""
                  }`}
                >
                  {getLabel(opcion)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorBuscable;
