import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import cotizacionService from "../services/cotizacionService";
import articuloService from "../services/articuloService";
import TablaDetalles from "../components/TablaDetalles";
import FormularioDetalle from "../components/FormularioDetalle";
import imagenService from "../services/imagenService";

const EditarCotizacion = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    cotizacion_id: "",
    numero_cotizacion: "",
    cliente_id: "",
    cliente_nombre: "",
    vehiculo_id: "",
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    detalles: [],
    observaciones: "",
    estado: "",
    fecha_entrega: "",
  });
  const [mostrarFormularioDetalle, setMostrarFormularioDetalle] =
    useState(false);

  useEffect(() => {
    cargarCotizacion();
  }, [id]);

  const cargarCotizacion = async () => {
    try {
      setLoading(true);
      const response = await cotizacionService.obtenerPorId(id);
      const data = response.data;

      setFormData({
        cotizacion_id: data.cotizacion_id,
        numero_cotizacion: data.numero_cotizacion,
        cliente_id: data.cliente_id,
        cliente_nombre: data.cliente_nombre,
        vehiculo_id: data.vehiculo_id,
        placa: data.placa,
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        color: data.color,
        detalles: data.detalles || [],
        observaciones: data.observaciones || "",
        estado: data.estado,
        fecha_entrega: data.fecha_entrega
          ? data.fecha_entrega.split("T")[0]
          : "",
      });
    } catch (error) {
      console.error("Error al cargar cotización:", error);
      Swal.fire("Error", "No se pudo cargar la cotización", "error");
      navigate("/cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleAgregarDetalle = (nuevoDetalle) => {
    setFormData((prev) => ({
      ...prev,
      detalles: [...prev.detalles, nuevoDetalle],
    }));
    setMostrarFormularioDetalle(false);
  };

  const handleEliminarDetalle = (index) => {
    const nuevosDetalles = formData.detalles.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, detalles: nuevosDetalles }));
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);

      Swal.fire({
        title: "Guardando...",
        text: "Actualizando la cotización",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const submitData = {
        cliente_id: formData.cliente_id,
        vehiculo_id: formData.vehiculo_id,
        observaciones: formData.observaciones,
        estado: formData.estado,
        fecha_entrega: formData.fecha_entrega,
        detalles: formData.detalles.map((d) => ({
          descripcion_custom: d.descripcion_custom,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento: d.descuento || 0,
          es_servicio: d.es_servicio || 0,
        })),
      };

      await cotizacionService.actualizar(id, submitData);

      await Swal.fire({
        icon: "success",
        title: "Actualizada",
        text: "Cotización actualizada correctamente",
        confirmButtonText: "OK",
        timer: 2000,
        timerProgressBar: true,
      });

      navigate("/cotizaciones");
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire("Error", "No se pudo guardar la cotización", "error");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate("/cotizaciones")}
        className="flex items-center gap-2 text-brand hover:text-brand-hover mb-4 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Regresar a cotizaciones</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Editar Cotización: {formData.numero_cotizacion}
        </h2>

        {/* Estado */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={formData.estado}
            onChange={(e) => handleUpdate({ estado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="borrador">Borrador</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>

        {/* Cliente y Vehículo (solo lectura) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Cliente</p>
            <p className="font-medium">{formData.cliente_nombre}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Vehículo</p>
            <p className="font-medium">
              {formData.placa} - {formData.marca} {formData.modelo}
            </p>
          </div>
        </div>

        {/* Detalles */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Detalles</h3>
            <button
              onClick={() => setMostrarFormularioDetalle(true)}
              className="text-sm bg-brand hover:bg-brand-hover text-white px-3 py-1 rounded-lg transition-colors"
            >
              + Agregar Item
            </button>
          </div>

          {mostrarFormularioDetalle && (
            <FormularioDetalle
              onAgregar={handleAgregarDetalle}
              onCancelar={() => setMostrarFormularioDetalle(false)}
            />
          )}

          <TablaDetalles
            detalles={formData.detalles}
            onEliminar={handleEliminarDetalle}
          />
        </div>

        {/* Observaciones */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => handleUpdate({ observaciones: e.target.value })}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Fecha entrega */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha estimada de entrega
          </label>
          <input
            type="date"
            value={formData.fecha_entrega || ""}
            onChange={(e) => handleUpdate({ fecha_entrega: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/cotizaciones")}
            disabled={guardando}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-6 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {guardando && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarCotizacion;
