import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import WizardStepper from "../components/WizardStepper";
import PasoCliente from "../components/PasoCliente";
import PasoVehiculo from "../components/PasoVehiculo";
import PasoDetalles from "../components/PasoDetalles";
import PasoArchivos from "../components/PasoArchivos";
import cotizacionService from "../services/cotizacionService";
import PasoResumen from "../components/PasoResumen";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const NuevaCotizacion = () => {
  const navigate = useNavigate();
  const [pasoActual, setPasoActual] = useState(1);

  // Datos del formulario
  const [formData, setFormData] = useState({
    cliente_id: "",
    cliente_nombre: "",
    telefono: "",
    email: "",
    vehiculo_id: "",
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    detalles: [],
    imagenes: [],
  });

  const pasos = ["Cliente", "Vehículo", "Detalles", "Archivos", "Resumen"];
  const handleUpdate = (data) => {
    setFormData((prev) => {
      const nuevo = { ...prev, ...data };
      return nuevo;
    });
  };
  const handleSubmitFinalWizard = async (imagenesParam = null) => {
    const imagenesFinales = imagenesParam || formData.imagenes;
    await handleSubmitFinal(imagenesFinales);
  };
  const handleNext = () => {
    if (pasoActual < 5) {
      setPasoActual(pasoActual + 1);
    }
  };

  const handlePrevious = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };
  const handleSubmitFinal = async (imagenesDirectas = null) => {
    const imagenesParaEnviar = imagenesDirectas || formData.imagenes;
    if (!imagenesParaEnviar || imagenesParaEnviar.length === 0) {
      Swal.fire("Advertencia", "No se seleccionaron imágenes", "warning");
    }

    const loadingAlert = Swal.fire({
      title: "Guardando...",
      text: "Por favor espere",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const submitData = new FormData();

      submitData.append("cliente_id", formData.cliente_id);
      submitData.append("vehiculo_id", formData.vehiculo_id);
      submitData.append("observaciones", formData.observaciones || "");

      const detallesParaEnviar = formData.detalles.map((d) => ({
        descripcion_custom: d.descripcion_custom,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        descuento: d.descuento || 0,
        es_servicio: d.es_servicio || 0,
      }));
      submitData.append("detalles", JSON.stringify(detallesParaEnviar));

      // Imágenes - usar las que vienen por parámetro
      if (imagenesParaEnviar && imagenesParaEnviar.length > 0) {
        imagenesParaEnviar.forEach((imagen, index) => {
          submitData.append("imagenes", imagen.file);
        });
      } else {
        console.log("No hay imágenes para enviar");
      }

      const response = await cotizacionService.crear(submitData);

      Swal.fire({
        icon: "success",
        title: "¡Cotización creada!",
        text: `Se creó ${response.data.numero_cotizacion}`,
        confirmButtonText: "Ver cotizaciones",
      });

      navigate("/cotizaciones");
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message || "No se pudo guardar la cotización",
      });
    }
  };

  const renderPaso = () => {
    switch (pasoActual) {
      case 1:
        return (
          <PasoCliente
            data={formData}
            onNext={handleNext}
            onUpdate={handleUpdate}
          />
        );
      case 2:
        return (
          <PasoVehiculo
            clienteId={formData.cliente_id}
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpdate={handleUpdate}
          />
        );
      case 3:
        return (
          <PasoDetalles
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpdate={handleUpdate}
          />
        );
      case 4:
        return (
          <PasoArchivos
            data={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpdate={handleUpdate}
          />
        );
      case 5:
        return (
          <PasoResumen
            data={formData}
            onGuardar={handleSubmitFinal}
            onPrevious={handlePrevious}
            onUpdate={handleUpdate}
          />
        );
      default:
        return null;
    }
  };

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
        <WizardStepper pasoActual={pasoActual} pasos={pasos} />
        {renderPaso()}
      </div>
    </div>
  );
};

export default NuevaCotizacion;
