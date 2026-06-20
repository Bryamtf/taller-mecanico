import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import cotizacionService from "../services/cotizacionService";

const ModalCompartir = ({ cotizacionId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [cotizacion, setCotizacion] = useState(null);
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  useEffect(() => {
    cargarCotizacion();
  }, [cotizacionId]);

  const cargarCotizacion = async () => {
    try {
      setLoading(true);
      const response = await cotizacionService.obtenerPorId(cotizacionId);
      setCotizacion(response.data);
      setTelefono((response.data.telefono || "").replace(/\D/g, "").slice(-9));
      setEmail(response.data.email || "");
    } catch (error) {
      console.error("Error al cargar cotización:", error);
      Swal.fire("Error", "No se pudo cargar la cotización", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarWhatsapp = async () => {
    const digitos = telefono.replace(/\D/g, "");
    if (digitos.length !== 9) {
      Swal.fire("Error", "Ingrese un número de 9 dígitos", "error");
      return;
    }

    try {
      setEnviandoWhatsapp(true);
      const response = await cotizacionService.compartirWhatsApp(
        cotizacionId,
        `51${digitos}`,
      );
      const link = response.data?.link;
      if (link) {
        window.open(link, "_blank");
      } else {
        Swal.fire("Listo", "Se generó el enlace de WhatsApp", "success");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo generar el enlace",
        "error",
      );
    } finally {
      setEnviandoWhatsapp(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      Swal.fire("Error", "Ingrese un correo electrónico válido", "error");
      return;
    }

    try {
      setEnviandoEmail(true);
      await cotizacionService.compartirEmail(cotizacionId, email);
      Swal.fire("Enviado", "El correo se envió correctamente", "success");
      onClose();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo enviar el correo",
        "error",
      );
    } finally {
      setEnviandoEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            Compartir Cotización
            {cotizacion?.numero_cotizacion
              ? ` ${cotizacion.numero_cotizacion}`
              : ""}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  +51
                </span>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="987654321"
                  maxLength={9}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  onClick={handleEnviarWhatsapp}
                  disabled={enviandoWhatsapp}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {enviandoWhatsapp ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  )}
                  Enviar
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Se abrirá WhatsApp con el mensaje listo para enviar
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  onClick={handleEnviarEmail}
                  disabled={enviandoEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {enviandoEmail ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <EnvelopeIcon className="w-4 h-4" />
                  )}
                  Enviar
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Se enviará automáticamente con el PDF adjunto
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalCompartir;
