import { useState } from 'react';
import { Search, Plus, Pencil, PowerOff, Power, Truck } from 'lucide-react';
import { useProveedores } from '../hooks/useProveedores';
import ProveedorModal from '../components/ProveedorModal';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';

const BADGE = {
  activo:   'bg-green-100 text-green-700',
  inactivo: 'bg-gray-100 text-gray-500',
};

export default function ProveedoresPage() {
  const {
    proveedores, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroActivo, handleFiltro,
    loading, crear, actualizar, toggleEstado,
  } = useProveedores();

  const [modalOpen, setModalOpen]       = useState(false);
  const [proveedorSel, setProveedorSel] = useState(null);

  const handleNuevo  = () => { setProveedorSel(null); setModalOpen(true); };
  const handleEditar = (p) => { setProveedorSel(p); setModalOpen(true); };

  const handleSave = async (data) => {
    try {
      if (proveedorSel) {
        await actualizar(proveedorSel.proveedor_id, data);
        swalSuccess('Actualizado', 'Los datos del proveedor fueron actualizados.');
      } else {
        await crear(data);
        swalSuccess('Registrado', 'El proveedor fue registrado exitosamente.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo guardar el proveedor.';
      swalError('Error', msg);
      throw err;
    }
  };

  const handleToggle = async (p) => {
    const accion = p.activo ? 'desactivar' : 'activar';
    const result = await swalConfirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} proveedor?`,
      `"${p.razon_social}" será ${accion === 'activar' ? 'activado' : 'desactivado'}.`
    );
    if (!result.isConfirmed) return;
    try {
      await toggleEstado(p.proveedor_id, p.activo);
      swalSuccess('Listo', `Proveedor ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
    } catch {
      swalError('Error', 'No se pudo cambiar el estado del proveedor.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Proveedores</h1>
          <p className="text-sm text-[#bababa]">{total} proveedor{total !== 1 ? 'es' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleNuevo}
          className="flex items-center justify-center gap-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bababa]" />
          <input
            value={busqueda}
            onChange={e => handleBusqueda(e.target.value)}
            placeholder="Buscar por razón social o RUC..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-[#e5ba4a] transition-colors"
          />
        </div>
        <select
          value={filtroActivo}
          onChange={e => handleFiltro(e.target.value)}
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
                <th className="px-4 py-3 font-semibold text-gray-600">Razón social</th>
                <th className="px-4 py-3 font-semibold text-gray-600">RUC</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Cargando...</td>
                </tr>
              )}
              {!loading && !proveedores.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
                      <Truck size={32} className="text-gray-200" />
                      <p>No se encontraron proveedores</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && proveedores.map(p => (
                <tr key={p.proveedor_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.razon_social}</td>
                  <td className="px-4 py-3 text-gray-500">{p.ruc ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.activo ? BADGE.activo : BADGE.inactivo}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditar(p)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggle(p)}
                        title={p.activo ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded-lg transition-colors ${p.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}
                      >
                        {p.activo ? <PowerOff size={15} /> : <Power size={15} />}
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
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ProveedorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        proveedor={proveedorSel}
      />
    </div>
  );
}
