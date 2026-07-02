import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import cotizacionService from "../services/cotizacionService";
import imagenService from "../services/imagenService";
import TablaDetalles from "../components/TablaDetalles";
import FormularioDetalle from "../components/FormularioDetalle";
import {
  calcularFechaDesdeDias,
  calcularDiasDesdeFecha,
  inicializarFechaYDias,
} from "../utils/fechaEntrega";
import { ESTADOS_BLOQUEADOS } from "../utils/estados";
import { getImagenUrl } from "../utils/imagenUrl";

const EditarCotizacion = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [itemEditandoIndex, setItemEditandoIndex] = useState(null);
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
  const [estadoOriginal, setEstadoOriginal] = useState("");
  const [diasEstimados, setDiasEstimados] = useState("");
  const [mostrarFormularioDetalle, setMostrarFormularioDetalle] =
    useState(false);

  const [imagenes, setImagenes] = useState([]);
  const [imagenesPendientes, setImagenesPendientes] = useState([]); // [{file, preview, descripcion}]
  const [subiendoImagenes, setSubiendoImagenes] = useState(false);
  const [eliminandoImagenId, setEliminandoImagenId] = useState(null);
  const [diasVencimiento, setDiasVencimiento] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const fileInputRef = useRef(null);
  const imagenesPendientesRef = useRef([]);

  const soloLectura = ESTADOS_BLOQUEADOS.includes(estadoOriginal);

  useEffect(() => {
    cargarCotizacion();
  }, [id]);

  useEffect(() => {
    imagenesPendientesRef.current = imagenesPendientes;
  }, [imagenesPendientes]);

  useEffect(() => {
    return () => {
      imagenesPendientesRef.current.forEach((img) =>
        URL.revokeObjectURL(img.preview),
      );
    };
  }, []);
  const cargarCotizacion = async () => {
    try {
      setLoading(true);
      const [response, imagenesResponse] = await Promise.all([
        cotizacionService.obtenerPorId(id),
        imagenService.listar(id),
      ]);
      const data = response.data;
      const entrega = inicializarFechaYDias(data.fecha_entrega);
      const vencimiento = inicializarFechaYDias(data.fecha_vencimiento);

      setDiasEstimados(entrega.dias);
      setFechaVencimiento(vencimiento.fecha);
      setDiasVencimiento(vencimiento.dias);

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
        fecha_entrega: entrega.fecha,
        fecha_vencimiento: vencimiento.fecha,
      });
      setEstadoOriginal(data.estado);
      setImagenes(imagenesResponse.data || []);
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
  const handleDiasVencimientoChange = (e) => {
    let dias = e.target.value;
    if (dias && parseInt(dias) > 99) dias = "99";
    setDiasVencimiento(dias);
    if (dias && parseInt(dias) > 0) {
      handleUpdate({ fecha_vencimiento: calcularFechaDesdeDias(dias) });
      setFechaVencimiento(calcularFechaDesdeDias(dias));
    } else {
      handleUpdate({ fecha_vencimiento: "" });
      setFechaVencimiento("");
    }
  };

  const handleFechaVencimientoChange = (e) => {
    const fecha = e.target.value;
    setFechaVencimiento(fecha);
    handleUpdate({ fecha_vencimiento: fecha });
    setDiasVencimiento(calcularDiasDesdeFecha(fecha));
  };

  const handleDiasChange = (e) => {
    let dias = e.target.value;

    if (dias && parseInt(dias) > 90) {
      dias = "90";
    }

    setDiasEstimados(dias);

    if (dias && parseInt(dias) > 0) {
      handleUpdate({ fecha_entrega: calcularFechaDesdeDias(dias) });
    } else {
      handleUpdate({ fecha_entrega: "" });
    }
  };

  const handleFechaChange = (e) => {
    const fecha = e.target.value;
    handleUpdate({ fecha_entrega: fecha });
    setDiasEstimados(calcularDiasDesdeFecha(fecha));
  };

  const handleGuardarDetalle = (item) => {
    setFormData((prev) => {
      const nuevosDetalles = [...prev.detalles];
      if (itemEditandoIndex !== null) {
        nuevosDetalles[itemEditandoIndex] = item;
      } else {
        nuevosDetalles.push(item);
      }
      return { ...prev, detalles: nuevosDetalles };
    });
    setItemEditandoIndex(null);
    setMostrarFormularioDetalle(false);
  };

  const handleEditarDetalle = (index) => {
    setItemEditandoIndex(index);
    setMostrarFormularioDetalle(true);
  };

  const handleCancelarFormularioDetalle = () => {
    setMostrarFormularioDetalle(false);
    setItemEditandoIndex(null);
  };

  const handleEliminarDetalle = (index) => {
    const nuevosDetalles = formData.detalles.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, detalles: nuevosDetalles }));
  };

  const handleSeleccionarImagenes = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (imagenes.length + imagenesPendientes.length + files.length > 10) {
      Swal.fire(
        "Error",
        `Máximo 10 imágenes por cotización (ya tiene ${imagenes.length + imagenesPendientes.length})`,
        "error",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const nuevasPendientes = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      descripcion: "",
    }));

    setImagenesPendientes((prev) => [...prev, ...nuevasPendientes]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubirImagenesPendientes = async () => {
    if (imagenesPendientes.length === 0) return;

    const formDataImagenes = new FormData();
    imagenesPendientes.forEach((img) =>
      formDataImagenes.append("imagenes", img.file),
    );
    const descripcionesImagenes = imagenesPendientes.map(
      (img) => img.descripcion || "",
    );
    formDataImagenes.append(
      "descripciones_imagenes",
      JSON.stringify(descripcionesImagenes),
    );

    try {
      setSubiendoImagenes(true);
      const response = await imagenService.agregar(id, formDataImagenes);
      setImagenes(response.data);
      imagenesPendientes.forEach((img) => URL.revokeObjectURL(img.preview));
      setImagenesPendientes([]);
    } catch (error) {
      console.error("Error al subir imágenes:", error);
      const mensaje =
        error.response?.data?.message || "No se pudieron subir las imágenes";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setSubiendoImagenes(false);
    }
  };

  const handleEliminarImagen = async (imagenId) => {
    const result = await Swal.fire({
      title: "¿Eliminar imagen?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      setEliminandoImagenId(imagenId);
      await imagenService.eliminar(imagenId);
      setImagenes((prev) => prev.filter((img) => img.imagen_id !== imagenId));
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      const mensaje =
        error.response?.data?.message || "No se pudo eliminar la imagen";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setEliminandoImagenId(null);
    }
  };

  const handleGuardar = async () => {
    const vaABloquear =
      ESTADOS_BLOQUEADOS.includes(formData.estado) &&
      !ESTADOS_BLOQUEADOS.includes(estadoOriginal);

    if (vaABloquear) {
      const confirm = await Swal.fire({
        title: `¿Marcar como ${formData.estado}?`,
        text: "Después de guardar, esta cotización ya no podrá editarse.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, guardar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return;
    }

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
        fecha_vencimiento: formData.fecha_vencimiento,
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
      const mensaje =
        error.response?.data?.message || "No se pudo guardar la cotización";
      Swal.fire("Error", mensaje, "error");
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

        {soloLectura && (
          <div className="mb-6 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm">
            Esta cotización está <strong>{formData.estado}</strong> y ya no
            puede editarse. Solo modo de visualización.
          </div>
        )}

        {/* Estado */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={formData.estado}
            onChange={(e) => handleUpdate({ estado: e.target.value })}
            disabled={soloLectura}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="borrador">Borrador</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
            <option value="vencida">Vencida</option>
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
            {!soloLectura && !mostrarFormularioDetalle && (
              <button
                onClick={() => setMostrarFormularioDetalle(true)}
                className="text-sm bg-brand hover:bg-brand-hover text-white px-3 py-1 rounded-lg transition-colors"
              >
                + Agregar Item
              </button>
            )}
          </div>

          {!soloLectura && mostrarFormularioDetalle && (
            <FormularioDetalle
              key={itemEditandoIndex ?? "nuevo"}
              onAgregar={handleGuardarDetalle}
              onCancelar={handleCancelarFormularioDetalle}
              itemEditar={
                itemEditandoIndex !== null
                  ? formData.detalles[itemEditandoIndex]
                  : null
              }
            />
          )}

          <TablaDetalles
            detalles={formData.detalles}
            onEliminar={handleEliminarDetalle}
            onEditar={handleEditarDetalle}
            soloLectura={soloLectura}
          />
        </div>

        {/* Imágenes */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">
              Imágenes ({imagenes.length}/10)
            </h3>
            {!soloLectura && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm bg-brand hover:bg-brand-hover text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <PhotoIcon className="w-4 h-4" />
                Seleccionar Imágenes
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleSeleccionarImagenes}
              className="hidden"
            />
          </div>

          {/* Imágenes pendientes de subir, cada una con su propia descripción */}
          {imagenesPendientes.length > 0 && (
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">
                {imagenesPendientes.length} imagen(es) lista(s) para subir
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {imagenesPendientes.map((img, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-2 bg-white"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                      <img
                        src={img.preview}
                        alt={`Pendiente ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <textarea
                      value={img.descripcion}
                      onChange={(e) => {
                        const nuevas = [...imagenesPendientes];
                        nuevas[index].descripcion = e.target.value;
                        setImagenesPendientes(nuevas);
                      }}
                      placeholder="Descripción (opcional)"
                      rows="2"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(img.preview);
                        setImagenesPendientes(
                          imagenesPendientes.filter((_, i) => i !== index),
                        );
                      }}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubirImagenesPendientes}
                disabled={subiendoImagenes}
                className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {subiendoImagenes && (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                )}
                {subiendoImagenes
                  ? "Subiendo..."
                  : `Subir ${imagenesPendientes.length} imagen(es)`}
              </button>
            </div>
          )}

          {imagenes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No hay imágenes</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagenes.map((imagen) => (
                <div key={imagen.imagen_id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={getImagenUrl(imagen.ruta_archivo)}
                      alt={imagen.descripcion || "Imagen de cotización"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {imagen.descripcion && (
                    <div className="relative group/desc">
                      <p className="text-xs text-gray-500 mt-1 truncate cursor-default">
                        {imagen.descripcion}
                      </p>
                      <div className="absolute left-0 bottom-full mb-1 hidden group-hover/desc:block z-20 w-max max-w-[200px]">
                        <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 shadow-lg whitespace-normal break-words">
                          {imagen.descripcion}
                        </div>
                      </div>
                    </div>
                  )}
                  {!soloLectura && (
                    <button
                      onClick={() => handleEliminarImagen(imagen.imagen_id)}
                      disabled={eliminandoImagenId === imagen.imagen_id}
                      title="Eliminar imagen"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                    >
                      {eliminandoImagenId === imagen.imagen_id ? (
                        <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <TrashIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
            disabled={soloLectura}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        {/* Fecha de entrega (días o fecha específica, reactivos entre sí) */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Fecha Estimada de Entrega
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Días estimados
              </label>
              <input
                type="number"
                value={diasEstimados}
                onChange={handleDiasChange}
                placeholder="Ej: 3"
                min="1"
                max="90"
                disabled={soloLectura}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fecha específica
              </label>
              <input
                type="date"
                value={formData.fecha_entrega || ""}
                onChange={handleFechaChange}
                disabled={soloLectura}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>
        {/* Vigencia */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Vigencia de la Cotización
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Días de vigencia
              </label>
              <input
                type="number"
                value={diasVencimiento}
                onChange={handleDiasVencimientoChange}
                placeholder="Ej: 15"
                min="1"
                max="99"
                disabled={soloLectura}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={fechaVencimiento || ""}
                onChange={handleFechaVencimientoChange}
                disabled={soloLectura}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/cotizaciones")}
            disabled={guardando}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {soloLectura ? "Volver" : "Cancelar"}
          </button>
          {!soloLectura && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default EditarCotizacion;
