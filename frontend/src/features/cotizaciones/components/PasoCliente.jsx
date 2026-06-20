import React, { useState, useEffect } from "react";
import SelectorBuscable from "@/components/SelectorBuscable";
import clienteService from "../services/clienteService";

const PasoCliente = ({ data, onNext, onUpdate }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await clienteService.listar();
      setClientes(response.clientes || []);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = (e) => {
    const clienteId = parseInt(e.target.value);
    const clienteSeleccionado = clientes.find(
      (c) => c.cliente_id === clienteId,
    );
    onUpdate({
      cliente_id: clienteId,
      cliente_nombre: clienteSeleccionado
        ? `${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos}`
        : "",
      telefono: clienteSeleccionado?.telefono || "",
      email: clienteSeleccionado?.email || "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.cliente_id) {
      alert("Por favor seleccione un cliente");
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
        Paso 1 de 4: Datos del Cliente
      </h2>

      <div className="space-y-4">
        {/* Selección de cliente existente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Cliente *
          </label>
          <SelectorBuscable
            opciones={clientes}
            valorSeleccionado={data.cliente_id || null}
            onSeleccionar={(cliente) =>
              onUpdate({
                cliente_id: cliente.cliente_id,
                cliente_nombre: `${cliente.nombres} ${cliente.apellidos}`,
                telefono: cliente.telefono || "",
                email: cliente.email || "",
              })
            }
            getLabel={(c) =>
              `${c.nombres} ${c.apellidos} - ${c.dni_ruc || "Sin DNI"}`
            }
            getValue={(c) => c.cliente_id}
            placeholder="-- Seleccione un cliente --"
          />
        </div>

        {/* Datos del cliente (solo lectura) */}
        {data.cliente_id && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-2">
                Información del Cliente
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Nombres:</span>
                  <p className="font-medium">{data.cliente_nombre || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Teléfono:</span>
                  <p className="font-medium">{data.telefono || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{data.email || "-"}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end mt-8">
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

export default PasoCliente;
