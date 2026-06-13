import { useState } from 'react';
import {
  Search, Plus, Eye, Pencil, Trash2,
  AlertTriangle, Flame, Clock, RefreshCw,
  Wrench, Settings2, User, Package, ShieldAlert,
} from 'lucide-react';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';
import { useIncidencias } from '../hooks/useIncidencias';
import IncidenciaModal from '../components/IncidenciaModal';
import IncidenciaDetalleModal from '../components/IncidenciaDetalleModal';
import {
  PRIORIDAD_BADGE, PRIORIDAD_LABEL, ESTADO_BADGE, ESTADO_LABEL,
  CATEGORIA_LABEL, ESTADOS, CATEGORIAS,
} from '../utils/incidenciaValidaciones';
import { updateIncidencia } from '../services/incidenciaService';

// Utilidades

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ICONO_CATEGORIA = {
  tecnica:    <Wrench     size={16} className="text-blue-500" />,
  operativa:  <Settings2  size={16} className="text-gray-500" />,
  cliente:    <User       size={16} className="text-purple-500" />,
  inventario: <Package    size={16} className="text-amber-500" />,
  seguridad:  <ShieldAlert size={16} className="text-red-500" />,
};

// Componente

export default function IncidenciasPage() {
  const {
    incidencias, resumen, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroEstado, handleEstado,
    filtroCategoria, handleCategoria,
    filtroPrioridad, handlePrioridad,
    loading, fetchIncidencias, crear, eliminar,
  } = useIncidencias();

  const [modalOpen, setModalOpen]       = useState(false);
  const [detalleOpen, setDetalleOpen]   = useState(false);
  const [incSel, setIncSel]             = useState(null);
  const [incDetalleId, setIncDetalleId] = useState(null);

  const handleNueva  = () => { setIncSel(null); setModalOpen(true); };
  const handleEditar = (inc) => { setIncSel(inc); setModalOpen(true); };
  const handleVer    = (id)  => { setIncDetalleId(id); setDetalleOpen(true); };

  const handleSave = async (payload, isEdit) => {
    try {
      if (isEdit) {
        await updateIncidencia(incSel.incidencia_id, payload);
        await fetchIncidencias();
        swalSuccess('Actualizado', 'La incidencia fue actualizada.');
      } else {
        await crear(payload);
        swalSuccess('Registrado', 'La incidencia fue registrada.');
      }
    } catch {
      swalError('Error', 'No se pudo guardar la incidencia. Intenta nuevamente.');
      throw new Error('save failed');
    }
  };

  const handleEliminar = async (inc) => {
    const result = await swalConfirm(
      '¿Eliminar incidencia?',
      `La incidencia "${inc.titulo}" será eliminada del sistema.`
    );
    if (!result.isConfirmed) return;
    try {
      await eliminar(inc.incidencia_id);
      swalSuccess('Eliminado', 'Incidencia eliminada correctamente.');
    } catch {
      swalError('Error', 'No se pudo eliminar la incidencia.');
    }
  };

  return (
    <div className="space-y-5">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Incidencias</h1>
          <p className="text-sm text-[#bababa]">
            {total} incidencia{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleNueva}
          className="flex items-center gap-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus size={16} /> Nueva incidencia
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg shrink-0">
            <AlertTriangle size={16} className="text-blue-500" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{resumen.abiertas}</p>
            <p className="text-[11px] sm:text-xs text-[#bababa] mt-0.5">Abiertas</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-orange-50 rounded-lg shrink-0">
            <Clock size={16} className="text-orange-500" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{resumen.en_proceso}</p>
            <p className="text-[11px] sm:text-xs text-[#bababa] mt-0.5">En proceso</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg shrink-0">
            <Flame size={16} className="text-red-500" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">{resumen.criticas}</p>
            <p className="text-[11px] sm:text-xs text-[#bababa] mt-0.5">Críticas</p>
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
            placeholder="Buscar por código o título..."
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
        <select
          value={filtroPrioridad}
          onChange={(e) => handlePrioridad(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors"
        >
          <option value="">Todas las prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => handleCategoria(e.target.value)}
          className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla (md+) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Código</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Título</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Categoría</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Prioridad</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Asignado a</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">Cargando...</td>
                </tr>
              )}
              {!loading && !incidencias.length && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No se encontraron incidencias
                  </td>
                </tr>
              )}
              {!loading && incidencias.map((inc) => (
                <tr key={inc.incidencia_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{inc.codigo}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-medium text-gray-800 truncate">{inc.titulo}</p>
                    {inc.cliente_nombres && (
                      <p className="text-xs text-gray-400 truncate">
                        {inc.cliente_nombres} {inc.cliente_apellidos}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span>{ICONO_CATEGORIA[inc.categoria]}</span>
                      {CATEGORIA_LABEL[inc.categoria]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORIDAD_BADGE[inc.prioridad]}`}>
                      {PRIORIDAD_LABEL[inc.prioridad]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[inc.estado]}`}>
                      {ESTADO_LABEL[inc.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inc.asignado_a ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtFecha(inc.fecha_registro)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleVer(inc.incidencia_id)}
                        title="Ver detalle"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#e5ba4a] hover:bg-amber-50 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditar(inc)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleEliminar(inc)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
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
        {!loading && !incidencias.length && (
          <p className="text-center text-gray-400 py-8 text-sm">No se encontraron incidencias</p>
        )}
        {!loading && incidencias.map((inc) => (
          <div key={inc.incidencia_id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {/* Fila superior */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 p-1.5 bg-gray-100 rounded-lg">{ICONO_CATEGORIA[inc.categoria]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORIDAD_BADGE[inc.prioridad]}`}>
                    {PRIORIDAD_LABEL[inc.prioridad]}
                  </span>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${ESTADO_BADGE[inc.estado]}`}>
                    {ESTADO_LABEL[inc.estado]}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400 ml-auto">{inc.codigo}</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm leading-tight">{inc.titulo}</p>
                {inc.cliente_nombres && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inc.cliente_nombres} {inc.cliente_apellidos}
                  </p>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{CATEGORIA_LABEL[inc.categoria]}</span>
              {inc.asignado_a && <span>Asignado: {inc.asignado_a}</span>}
              <span className="ml-auto">{fmtFecha(inc.fecha_registro)}</span>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <button
                onClick={() => handleVer(inc.incidencia_id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:border-[#e5ba4a] hover:text-[#e5ba4a] transition-colors"
              >
                <Eye size={13} /> Ver detalles
              </button>
              <button
                onClick={() => handleEditar(inc)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Pencil size={13} /> Editar
              </button>
              <button
                onClick={() => handleEliminar(inc)}
                className="py-2 px-3 rounded-lg border border-gray-200 text-gray-400 text-xs hover:border-red-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
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

      {/* Modales */}
      <IncidenciaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        incidencia={incSel}
      />

      <IncidenciaDetalleModal
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        incidenciaId={incDetalleId}
        onDataChanged={fetchIncidencias}
      />
    </div>
  );
}
