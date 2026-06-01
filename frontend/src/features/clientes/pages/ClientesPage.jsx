import { useState } from 'react';
import { Search, Plus, Eye, Pencil, PowerOff, Power } from 'lucide-react';
import { useClientes } from '../hooks/useClientes';
import ClienteModal from '../components/ClienteModal';
import ClienteDetalleModal from '../components/ClienteDetalleModal';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';

const BADGE = {
  activo:   'bg-green-100 text-green-700',
  inactivo: 'bg-gray-100 text-gray-500',
};

export default function ClientesPage() {
  const {
    clientes, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroActivo, handleFiltro,
    loading, crear, actualizar, toggleEstado,
  } = useClientes();

  const [modalOpen, setModalOpen]       = useState(false);
  const [detalleOpen, setDetalleOpen]   = useState(false);
  const [clienteSel, setClienteSel]     = useState(null);
  const [clienteDetId, setClienteDetId] = useState(null);

  const handleNuevo = () => { setClienteSel(null); setModalOpen(true); };
  const handleEditar = (c) => { setClienteSel(c); setModalOpen(true); };
  const handleVer    = (id) => { setClienteDetId(id); setDetalleOpen(true); };

  const handleSave = async (data) => {
    try {
      if (clienteSel) {
        await actualizar(clienteSel.cliente_id, data);
        swalSuccess('Actualizado', 'Los datos del cliente fueron actualizados.');
      } else {
        await crear(data);
        swalSuccess('Registrado', 'El cliente fue registrado exitosamente.');
      }
    } catch {
      swalError('Error', 'No se pudo guardar el cliente. Intenta nuevamente.');
    }
  };

  const handleToggle = async (cliente) => {
    const accion = cliente.activo ? 'desactivar' : 'activar';
    const result = await swalConfirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} cliente?`,
      `El cliente ${cliente.nombres} ${cliente.apellidos} será ${accion === 'activar' ? 'activado' : 'desactivado'}.`
    );
    if (!result.isConfirmed) return;
    try {
      await toggleEstado(cliente.cliente_id, cliente.activo);
      swalSuccess('Listo', `Cliente ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
    } catch {
      swalError('Error', 'No se pudo cambiar el estado del cliente.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Clientes</h1>
          <p className="text-sm text-[#bababa]">{total} cliente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleNuevo}
          className="flex items-center gap-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bababa]" />
          <input
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            placeholder="Buscar por nombre, apellido o DNI/RUC..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-[#e5ba4a] transition-colors"
          />
        </div>
        <select
          value={filtroActivo}
          onChange={(e) => handleFiltro(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors"
        >
          <option value="">Todos</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">DNI / RUC</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Vehículos</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Cargando...</td>
                </tr>
              )}
              {!loading && !clientes.length && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No se encontraron clientes</td>
                </tr>
              )}
              {!loading && clientes.map((c) => (
                <tr key={c.cliente_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {c.nombres} {c.apellidos}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.dni_ruc ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {c.total_vehiculos}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.activo ? BADGE.activo : BADGE.inactivo}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleVer(c.cliente_id)}
                        title="Ver detalle"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#e5ba4a] hover:bg-amber-50 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditar(c)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggle(c)}
                        title={c.activo ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded-lg transition-colors ${c.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                      >
                        {c.activo ? <PowerOff size={15} /> : <Power size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-gray-400">Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        cliente={clienteSel}
      />

      <ClienteDetalleModal
        open={detalleOpen}
        clienteId={clienteDetId}
        onClose={() => setDetalleOpen(false)}
        onEditar={handleEditar}
      />
    </div>
  );
}
