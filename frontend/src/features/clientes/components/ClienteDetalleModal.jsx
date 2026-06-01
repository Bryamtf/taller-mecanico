import { useState, useEffect, useCallback } from 'react';
import { Car, Phone, Mail, MapPin, Hash, Edit, Plus, Pencil } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import VehiculoModal from './VehiculoModal';
import { getCliente } from '../services/clienteService';
import { swalSuccess } from '@/lib/swal';

export default function ClienteDetalleModal({ open, clienteId, onClose, onEditar, onDataChanged }) {
  const [cliente, setCliente]                   = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [vehiculoModalOpen, setVehiculoModalOpen] = useState(false);
  const [vehiculoSel, setVehiculoSel]           = useState(null);

  const fetchCliente = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      setCliente(await getCliente(clienteId));
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    if (open) fetchCliente();
  }, [open, fetchCliente]);

  const abrirNuevoVehiculo = () => { setVehiculoSel(null); setVehiculoModalOpen(true); };
  const abrirEditarVehiculo = (v) => { setVehiculoSel(v); setVehiculoModalOpen(true); };

  const handleVehiculoSaved = async () => {
    setVehiculoModalOpen(false);
    setVehiculoSel(null);
    await fetchCliente();
    onDataChanged?.();
    swalSuccess(
      vehiculoSel ? 'Vehículo actualizado' : 'Vehículo agregado',
      vehiculoSel ? 'Los datos del vehículo fueron actualizados.' : 'El vehículo fue registrado correctamente.'
    );
  };

  return (
    <>
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
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Car size={15} className="text-[#e5ba4a]" />
                    Vehículos ({cliente.vehiculos?.length ?? 0})
                  </h4>
                  <button
                    onClick={abrirNuevoVehiculo}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#e5ba4a] text-white hover:bg-[#d4a93a] transition-colors"
                  >
                    <Plus size={13} /> Agregar vehículo
                  </button>
                </div>

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
                        <div className="flex items-center gap-2">
                          {v.tipo_combustible && (
                            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full capitalize">
                              {v.tipo_combustible}
                            </span>
                          )}
                          <button
                            onClick={() => abrirEditarVehiculo(v)}
                            title="Editar vehículo"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <VehiculoModal
        open={vehiculoModalOpen}
        onClose={() => { setVehiculoModalOpen(false); setVehiculoSel(null); }}
        onSaved={handleVehiculoSaved}
        clienteId={clienteId}
        vehiculo={vehiculoSel}
      />
    </>
  );
}
