import React, { useState, useEffect } from "react";
import clienteService from "../services/clienteService";

const PasoVehiculo = ({ clienteId, data, onNext, onPrevious, onUpdate }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clienteId) {
      cargarVehiculos();
    }
  }, [clienteId]);

  const cargarVehiculos = async () => {
    try {
      setLoading(true);
      const response =
        await clienteService.obtenerVehiculosPorCliente(clienteId);
      setVehiculos(response || []);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehiculoChange = (e) => {
    const vehiculoId = parseInt(e.target.value);
    const vehiculoSeleccionado = vehiculos.find(
      (v) => v.vehiculo_id === vehiculoId,
    );
    onUpdate({
      vehiculo_id: vehiculoId,
      placa: vehiculoSeleccionado?.placa || "",
      marca: vehiculoSeleccionado?.marca || "",
      modelo: vehiculoSeleccionado?.modelo || "",
      anio: vehiculoSeleccionado?.anio || "",
      color: vehiculoSeleccionado?.color || "",
      observaciones: vehiculoSeleccionado?.observaciones || "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.vehiculo_id) {
      alert("Por favor seleccione un vehículo");
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        Paso 2 de 4: Datos del Vehículo
      </h2>

      <div className="space-y-4">
        {/* Selección de vehículo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Vehículo *
          </label>
          <select
            value={data.vehiculo_id || ""}
            onChange={handleVehiculoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Seleccione un vehículo --</option>
            {vehiculos.map((vehiculo) => (
              <option key={vehiculo.vehiculo_id} value={vehiculo.vehiculo_id}>
                {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo} (
                {vehiculo.anio || "Sin año"})
              </option>
            ))}
          </select>
        </div>

        {/* Datos del vehículo (solo lectura) */}
        {data.vehiculo_id && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase mb-2">
              Información del Vehículo
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Placa:</span>
                <p className="font-medium">{data.placa || "-"}</p>
              </div>
              <div>
                <span className="text-gray-500">Marca:</span>
                <p className="font-medium">{data.marca || "-"}</p>
              </div>
              <div>
                <span className="text-gray-500">Modelo:</span>
                <p className="font-medium">{data.modelo || "-"}</p>
              </div>
              <div>
                <span className="text-gray-500">Año:</span>
                <p className="font-medium">{data.anio || "-"}</p>
              </div>
              <div>
                <span className="text-gray-500">Color:</span>
                <p className="font-medium">{data.color || "-"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onPrevious}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
        >
          ← Anterior
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </form>
  );
};

export default PasoVehiculo;
