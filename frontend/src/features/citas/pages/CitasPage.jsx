import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Calendar, Clock, Wrench } from 'lucide-react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';
import { useCitas } from '../hooks/useCitas';
import CitaModal from '../components/CitaModal';
import { ESTADOS, ESTADO_BADGE, ESTADO_LABEL, TIPO_SERVICIO_LABEL } from '../utils/citaValidaciones';

const fmtFechaHora = (f) =>
  f ? new Date(f).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function CitasPage() {
  const { can } = useAuth();
  const puedeCrear   = can('crear_citas', 'puede_crear');
  const puedeEditar  = can('editar_citas', 'puede_editar');
  const puedeEliminar = can('eliminar_citas', 'puede_eliminar');

  const {
    citas, resumen, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroEstado, handleEstado,
    filtroFechaDesde, handleFechaDesde,
    filtroFechaHasta, handleFechaHasta,
    loading, crear, actualizar, cambiarEstado, eliminar,
  } = useCitas();

  const [modalOpen, setModalOpen] = useState(false);
  const [citaSel, setCitaSel]     = useState(null);

  const handleNueva  = () => { setCitaSel(null); setModalOpen(true); };
  const handleEditar = (cita) => { setCitaSel(cita); setModalOpen(true); };

  const handleSave = async (payload, isEdit) => {
    try {
      if (isEdit) {
        await actualizar(citaSel.cita_id, payload);
        swalSuccess('Actualizada', 'La cita fue actualizada.');
      } else {
        await crear(payload);
        swalSuccess('Agendada', 'La cita fue registrada.');
      }
    } catch {
      swalError('Error', 'No se pudo guardar la cita. Intenta nuevamente.');
      throw new Error('save failed');
    }
  };

  const handleCambiarEstado = async (cita, nuevoEstado) => {
    if (nuevoEstado === cita.estado) return;
    if (nuevoEstado === 'cancelada') {
      const result = await swalConfirm('¿Cancelar cita?', `La cita de ${cita.nombres} ${cita.apellidos} será marcada como cancelada.`);
      if (!result.isConfirmed) return;
    }
    try {
      await cambiarEstado(cita.cita_id, nuevoEstado);
    } catch {
      swalError('Error', 'No se pudo cambiar el estado de la cita.');
    }
  };

  const handleEliminar = async (cita) => {
    const result = await swalConfirm(
      '¿Eliminar cita?',
      `La cita de ${cita.nombres} ${cita.apellidos} (${cita.placa}) será eliminada del sistema.`
    );
    if (!result.isConfirmed) return;
    try {
      await eliminar(cita.cita_id);
      swalSuccess('Eliminada', 'Cita eliminada correctamente.');
    } catch {
      swalError('Error', 'No se pudo eliminar la cita.');
    }
  };

  const EstadoSelect = ({ cita }) => (
    puedeEditar ? (
      <select
        value={cita.estado}
        onChange={(e) => handleCambiarEstado(cita, e.target.value)}
        className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer ${ESTADO_BADGE[cita.estado]}`}
      >
        {ESTADOS.map((e) => (
          <option key={e.value} value={e.value}>{e.label}</option>
        ))}
      </select>
    ) : (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[cita.estado]}`}>
        {ESTADO_LABEL[cita.estado]}
      </span>
    )
  );

  return (
    <div className="space-y-5">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Citas</h1>
          <p className="text-sm text-[#bababa]">
            {total} cita{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
          </p>
        </div>
        {puedeCrear && (
          <button
            onClick={handleNueva}
            className="flex items-center gap-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
          >
            <Plus size={16} /> Nueva cita
          </button>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg shrink-0">
            <Calendar size={16} className="text-blue-500" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{resumen.totalCitas}</p>
            <p className="text-[11px] sm:text-xs text-[#bababa] mt-0.5">Total citas</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-orange-50 rounded-lg shrink-0">
            <Clock size={16} className="text-orange-500" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{resumen.citasPendientes}</p>
            <p className="text-[11px] sm:text-xs text-[#bababa] mt-0.5">Pendientes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg shrink-0">
            <Wrench size={16} className="text-purple-500" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{resumen.enProceso}</p>
            <p className="text-[11px] sm:text-xs text-[#bababa] mt-0.5">En proceso</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bababa]" />
          <input
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            placeholder="Buscar por cliente o placa..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-[#e5ba4a] transition-colors"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => handleEstado(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filtroFechaDesde}
          onChange={(e) => handleFechaDesde(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors"
        />
        <input
          type="date"
          value={filtroFechaHasta}
          onChange={(e) => handleFechaHasta(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors"
        />
      </div>

      {/* Tabla (md+) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Vehículo</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Fecha y hora</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Servicio</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Técnico</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Cargando...</td>
                </tr>
              )}
              {!loading && !citas.length && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No se encontraron citas
                  </td>
                </tr>
              )}
              {!loading && citas.map((cita) => (
                <tr key={cita.cita_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{cita.nombres} {cita.apellidos}</p>
                    {cita.telefono && <p className="text-xs text-gray-400">{cita.telefono}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {cita.placa} — {cita.marca} {cita.modelo}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtFechaHora(cita.fecha_hora)}</td>
                  <td className="px-4 py-3 text-gray-500">{TIPO_SERVICIO_LABEL[cita.tipo_servicio] ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <EstadoSelect cita={cita} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{cita.tecnico_nombre ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {puedeEditar && (
                        <button
                          onClick={() => handleEditar(cita)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          onClick={() => handleEliminar(cita)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación tabla */}
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

      {/* Cards (en cel) */}
      <div className="md:hidden space-y-3">
        {loading && (
          <p className="text-center text-gray-400 py-8 text-sm">Cargando...</p>
        )}
        {!loading && !citas.length && (
          <p className="text-center text-gray-400 py-8 text-sm">No se encontraron citas</p>
        )}
        {!loading && citas.map((cita) => (
          <div key={cita.cita_id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm leading-tight">{cita.nombres} {cita.apellidos}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cita.placa} — {cita.marca} {cita.modelo}</p>
              </div>
              <EstadoSelect cita={cita} />
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{fmtFechaHora(cita.fecha_hora)}</span>
              <span>{TIPO_SERVICIO_LABEL[cita.tipo_servicio] ?? '—'}</span>
            </div>

            {cita.tecnico_nombre && (
              <p className="text-xs text-gray-400">Técnico: {cita.tecnico_nombre}</p>
            )}

            {(puedeEditar || puedeEliminar) && (
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                {puedeEditar && (
                  <button
                    onClick={() => handleEditar(cita)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                )}
                {puedeEliminar && (
                  <button
                    onClick={() => handleEliminar(cita)}
                    className="py-2 px-3 rounded-lg border border-gray-200 text-gray-400 text-xs hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Paginación cards */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-gray-400">Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-xs"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors text-xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <CitaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        cita={citaSel}
      />
    </div>
  );
}
