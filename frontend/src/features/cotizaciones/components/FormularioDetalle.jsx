import React, { useState, useEffect } from "react";
import articuloService from "../services/articuloService";

const FormularioDetalle = ({ onAgregar, onCancelar }) => {
  const [formData, setFormData] = useState({
    descripcion_custom: "",
    articulo_id: "",
    cantidad: 1,
    precio_unitario: 0,
    descuento: 0,
    es_servicio: 0,
  });

  const [articulos, setArticulos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);

  useEffect(() => {
    if (busqueda.length > 2) {
      buscarArticulos();
    }
  }, [busqueda]);

  const buscarArticulos = async () => {
    try {
      const response = await articuloService.buscar(busqueda);
      const data = (response.data || []).map((art) => ({
        ...art,
        precio_venta: Number(art.precio_venta) || 0,
        stock_actual: Number(art.stock_actual) || 0,
      }));
      setArticulos(data);
      setMostrarLista(true);
    } catch (error) {
      console.error("Error al buscar artículos:", error);
    }
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "number") {
      // Si el campo está vacío, poner 0
      const numValue = value === "" ? 0 : parseFloat(value);
      setFormData({
        ...formData,
        [name]: isNaN(numValue) ? 0 : numValue,
      });
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: checked ? 1 : 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const seleccionarArticulo = (articulo) => {
    setFormData({
      ...formData,
      articulo_id: articulo.articulo_id,
      descripcion_custom: articulo.nombre,
      precio_unitario: Number(articulo.precio_venta) || 0,
    });
    setMostrarLista(false);
    setBusqueda(articulo.nombre);
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.descripcion_custom) {
      alert("Ingrese una descripción");
      return;
    }

    const cantidad = formData.cantidad || 0;
    const precioUnitario = formData.precio_unitario || 0;
    const descuento = formData.descuento || 0;

    if (cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    if (precioUnitario <= 0) {
      alert("El precio unitario debe ser mayor a 0");
      return;
    }

    const subtotal = cantidad * precioUnitario - descuento;

    onAgregar({
      ...formData,
      cantidad: cantidad,
      precio_unitario: precioUnitario,
      descuento: descuento,
      subtotal: subtotal,
    });

    // Resetear formulario
    setFormData({
      descripcion_custom: "",
      articulo_id: "",
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      es_servicio: 0,
    });
    setBusqueda("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
      <h3 className="font-semibold text-gray-700 mb-3">Agregar Item</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">
            Descripción *
          </label>
          <div className="relative">
            <input
              type="text"
              name="descripcion_custom"
              value={busqueda || formData.descripcion_custom}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setFormData({
                  ...formData,
                  descripcion_custom: e.target.value,
                  articulo_id: "",
                });
              }}
              onFocus={() => setMostrarLista(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cambio de aceite, Filtro, etc."
              required
            />
            {mostrarLista && articulos.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                {articulos.map((art) => (
                  <div
                    key={art.articulo_id}
                    onClick={() => seleccionarArticulo(art)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    <p className="font-medium text-sm">{art.nombre}</p>
                    <p className="text-xs text-gray-500">
                      Precio: S/ {art.precio_venta?.toFixed(2)} | Stock:{" "}
                      {art.stock_actual}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Cantidad *</label>
          <input
            type="number"
            name="cantidad"
            value={formData.cantidad ?? 1}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Precio Unitario */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Precio Unitario *
          </label>
          <input
            type="number"
            name="precio_unitario"
            value={formData.precio_unitario ?? 0}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Descuento */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Descuento (S/)
          </label>
          <input
            type="number"
            name="descuento"
            value={formData.descuento ?? 0}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Es servicio */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="es_servicio"
              checked={formData.es_servicio === 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  es_servicio: e.target.checked ? 1 : 0,
                })
              }
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-600">
              Es Mano de Obra / Servicio
            </span>
          </label>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Agregar
        </button>
      </div>
    </form>
  );
};

export default FormularioDetalle;
