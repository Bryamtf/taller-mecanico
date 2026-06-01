import { useState, useEffect } from 'react';
import { Car, Phone, Mail, MapPin, Hash, Edit } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { getCliente } from '../services/clienteService';

export default function ClienteDetalleModal({ open, clienteId, onClose, onEditar }) {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !clienteId) return;
    setLoading(true);
    getCliente(clienteId)
      .then(setCliente)
      .finally(() => setLoading(false));
  }, [open, clienteId]);

  return (
    <Modal open={open} onClose={onClose} title="Detalle del cliente" size="lg">
      <div className="p-6">
        {loading && <p className="text-center text-sm text-gray-500 py-8">Cargando...</p>}

        {!loading && cliente && (
          <div className="space-y-6">
            {/* Info principal */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {cliente.nombres} {cliente.apellidos}
                </h3>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${cliente.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <button
                onClick={() => { onClose(); onEditar(cliente); }}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[#e5ba4a] text-[#e5ba4a] hover:bg-[#e5ba4a] hover:text-white transition-colors"
              >
                <Edit size={14} /> Editar
              </button>
            </div>

            {/* Datos de contacto */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {cliente.dni_ruc && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash size={14} className="text-[#bababa]" />
                  <span>{cliente.dni_ruc}</span>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-[#bababa]" />
                  <span>{cliente.telefono}</span>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-[#bababa]" />
                  <span>{cliente.email}</span>
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} className="text-[#bababa]" />
                  <span>{cliente.direccion}</span>
                </div>
              )}
            </div>

            {/* Vehículos */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Car size={15} className="text-[#e5ba4a]" />
                Vehículos ({cliente.vehiculos?.length ?? 0})
              </h4>

              {!cliente.vehiculos?.length ? (
                <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                  Sin vehículos registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {cliente.vehiculos.map((v) => (
                    <div key={v.vehiculo_id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800 tracking-wide">{v.placa}</span>
                        <span className="text-gray-500">{[v.marca, v.modelo, v.anio].filter(Boolean).join(' · ')}</span>
                      </div>
                      {v.tipo_combustible && (
                        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full capitalize">
                          {v.tipo_combustible}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
