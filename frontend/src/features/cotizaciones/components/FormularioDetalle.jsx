import React, { useState, useEffect, useRef } from "react";
import { Package, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";
import articuloService from "../services/articuloService";
import { onKeyDown, sanitizar } from "@/utils/inputSanitizer";

const FormularioDetalle = ({ onAgregar, onCancelar, itemEditar = null }) => {
  const [busqueda, setBusqueda] = useState(itemEditar?.descripcion_custom || "");
  const [articulos, setArticulos] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(
    itemEditar?.articulo_id
      ? { articulo_id: itemEditar.articulo_id, marca_id: itemEditar.marca_id ?? null, stock_actual: itemEditar.stock_actual ?? null }
      : null
  );
  const [formData, setFormData] = useState({
    descripcion_custom: itemEditar?.descripcion_custom || "",
    articulo_id: itemEditar?.articulo_id || "",
    marca_id: itemEditar?.marca_id || "",
    cantidad: itemEditar?.cantidad ?? 1,
    precio_unitario: itemEditar?.precio_unitario ?? 0,
    descuento: itemEditar?.descuento ?? 0,
    es_servicio: itemEditar?.es_servicio ?? 0,
  });

  const listaRef = useRef(null);

  useEffect(() => {
    if (busqueda.length > 2 && !articuloSeleccionado) {
      buscarArticulos();
    } else if (busqueda.length <= 2) {
      setArticulos([]);
      setMostrarLista(false);
    }
  }, [busqueda]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (listaRef.current && !listaRef.current.contains(e.target)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    } catch {
      setArticulos([]);
    }
  };

  const seleccionarArticulo = (articulo) => {
    setArticuloSeleccionado(articulo);
    setFormData((prev) => ({
      ...prev,
      articulo_id: articulo.articulo_id,
      marca_id: articulo.marca_id || "",
      descripcion_custom: articulo.nombre,
      precio_unitario: articulo.precio_venta,
    }));
    setBusqueda(articulo.nombre);
    setMostrarLista(false);
  };

  const limpiarArticulo = () => {
    setArticuloSeleccionado(null);
    setFormData((prev) => ({
      ...prev,
      articulo_id: "",
      marca_id: "",
      descripcion_custom: "",
      precio_unitario: 0,
    }));
    setBusqueda("");
    setArticulos([]);
  };

  const stockInsuficiente =
    !formData.es_servicio &&
    articuloSeleccionado?.stock_actual != null &&
    Number(formData.cantidad) > articuloSeleccionado.stock_actual;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.descripcion_custom.trim()) {
      Swal.fire("Campo requerido", "Ingresa una descripción o selecciona un artículo.", "warning");
      return;
    }

    const cantidad = parseFloat(formData.cantidad) || 0;
    const precioUnitario = parseFloat(formData.precio_unitario) || 0;
    const descuento = parseFloat(formData.descuento) || 0;

    if (cantidad <= 0) {
      Swal.fire("Cantidad inválida", "La cantidad debe ser mayor a 0.", "warning");
      return;
    }

    if (precioUnitario <= 0) {
      Swal.fire("Precio inválido", "El precio unitario debe ser mayor a 0.", "warning");
      return;
    }

    if (stockInsuficiente) {
      const result = await Swal.fire({
        title: "Stock insuficiente",
        html: `El stock disponible es <strong>${articuloSeleccionado.stock_actual}</strong> unidad(es), pero estás agregando <strong>${cantidad}</strong>.<br/><br/>La cotización se guardará, pero podría no aprobarse si el stock no es repuesto a tiempo.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Agregar de todas formas",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#e5ba4a",
      });
      if (!result.isConfirmed) return;
    }

    onAgregar({
      ...formData,
      cantidad,
      precio_unitario: precioUnitario,
      descuento,
      subtotal: cantidad * precioUnitario - descuento,
    });

    setFormData({
      descripcion_custom: "",
      articulo_id: "",
      marca_id: "",
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      es_servicio: 0,
    });
    setBusqueda("");
    setArticuloSeleccionado(null);
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a] focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm">
        {itemEditar ? "Editar ítem" : "Agregar ítem"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2" ref={listaRef}>
          <label className="block text-xs text-gray-500 mb-1">Descripción *</label>
          <div className="relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                const val = sanitizar.texto(e.target.value);
                setBusqueda(val);
                setFormData((prev) => ({
                  ...prev,
                  descripcion_custom: val,
                  articulo_id: "",
                  marca_id: "",
                }));
                setArticuloSeleccionado(null);
              }}
              onFocus={() => articulos.length > 0 && setMostrarLista(true)}
              className={inputClass}
              placeholder="Busca un artículo o escribe un servicio..."
              required
            />

            {mostrarLista && articulos.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto mt-1">
                {articulos.map((art) => (
                  <div
                    key={`${art.articulo_id}-${art.marca_id}`}
                    onMouseDown={() => seleccionarArticulo(art)}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{art.nombre}</p>
                          {art.marca_nombre && (
                            <p className="text-xs text-gray-400">{art.marca_nombre}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">S/ {art.precio_venta.toFixed(2)}</p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            art.stock_actual > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Stock: {art.stock_actual}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {articuloSeleccionado && (
            <div className="flex items-center justify-between mt-1.5 px-2 py-1 bg-[#fdf7e7] border border-[#e5ba4a]/40 rounded text-xs text-[#b8962a]">
              <span>Artículo vinculado · Stock actual: <strong>{articuloSeleccionado.stock_actual}</strong></span>
              <button type="button" onClick={limpiarArticulo} className="ml-2 hover:text-red-500 transition-colors text-gray-400">
                ✕
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Cantidad *</label>
          <input
            type="text"
            inputMode="numeric"
            name="cantidad"
            value={formData.cantidad}
            onChange={(e) => setFormData((prev) => ({ ...prev, cantidad: sanitizar.entero(e.target.value) || "" }))}
            onKeyDown={onKeyDown.soloNumeros}
            className={`${inputClass} ${stockInsuficiente ? "border-orange-400 focus:ring-orange-400" : ""}`}
            required
          />
          {stockInsuficiente && (
            <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
              <AlertTriangle size={12} />
              <span>Stock disponible: {articuloSeleccionado.stock_actual}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Precio unitario (S/) *</label>
          <input
            type="text"
            inputMode="decimal"
            name="precio_unitario"
            value={formData.precio_unitario}
            onChange={(e) => setFormData((prev) => ({ ...prev, precio_unitario: sanitizar.precio(e.target.value) }))}
            onKeyDown={onKeyDown.soloDecimal}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Descuento (S/)</label>
          <input
            type="text"
            inputMode="decimal"
            name="descuento"
            value={formData.descuento}
            onChange={(e) => setFormData((prev) => ({ ...prev, descuento: sanitizar.precio(e.target.value) }))}
            onKeyDown={onKeyDown.soloDecimal}
            className={inputClass}
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.es_servicio === 1}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, es_servicio: e.target.checked ? 1 : 0 }))
              }
              className="w-4 h-4 accent-[#e5ba4a]"
            />
            <span className="text-sm text-gray-600">Es mano de obra / servicio</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-[#e5ba4a] hover:bg-[#d4a93a] text-white rounded-lg transition-colors"
        >
          {itemEditar ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </form>
  );
};

export default FormularioDetalle;
