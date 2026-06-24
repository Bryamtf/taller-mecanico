import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Pencil, PowerOff, Power, Package, Tag, ScanLine, History, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, Activity, Download, FileSpreadsheet, FileText, TrendingUp } from 'lucide-react';
import Swal from 'sweetalert2';
import { useInventario } from '../hooks/useInventario';
import ProductoModal from '../components/ProductoModal';
import GestionMarcasModal from '../components/GestionMarcasModal';
import HistorialMovimientosModal from '../components/HistorialMovimientosModal';
import HistorialPreciosModal from '../components/HistorialPreciosModal';
import AlertasStockModal from '../components/AlertasStockModal';
import BarcodeScannerModal from '@/components/BarcodeScanner/BarcodeScannerModal';
import { getImageUrl, exportarInventario as exportarDatos } from '../services/inventarioService';
import { exportarExcel, exportarPDF } from '../utils/exportInventario';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';

const TIPOS = ['repuesto', 'consumible', 'servicio'];

const STOCK_FILTROS = [
  { value: '',         label: 'Todos' },
  { value: 'alerta',   label: 'En alerta' },
  { value: 'sinstock', label: 'Sin stock' },
];

const SortTh = ({ col, label, orden, onSort, className = '' }) => {
  const [prevCol, prevDir] = orden.split('_');
  const activo = prevCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-4 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:text-[#e5ba4a] transition-colors ${className}`}
    >
      <span className="flex items-center gap-1">
        {label}
        {activo
          ? prevDir === 'asc'
            ? <ArrowUp size={13} className="text-[#e5ba4a]" />
            : <ArrowDown size={13} className="text-[#e5ba4a]" />
          : <ArrowUpDown size={13} className="text-gray-300" />}
      </span>
    </th>
  );
};

const TIPO_BADGE = {
  repuesto:   'bg-blue-100 text-blue-700',
  consumible: 'bg-purple-100 text-purple-700',
  servicio:   'bg-green-100 text-green-700',
};

export default function InventarioPage() {
  const {
    productos, resumen, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroTipo, handleFiltro,
    filtroStock, handleFiltroStock,
    orden, handleOrden,
    loading, fetchInventario, eliminar, reactivar,
  } = useInventario();

  const [modalOpen, setModalOpen]         = useState(false);
  const [articuloId, setArticuloId]       = useState(null);
  const [marcasOpen, setMarcasOpen]       = useState(false);
  const [scannerOpen, setScannerOpen]     = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [articuloHistorial, setArticuloHistorial] = useState(null);
  const [preciosOpen, setPreciosOpen]     = useState(false);
  const [articuloPrecios, setArticuloPrecios] = useState(null);
  const [alertasOpen, setAlertasOpen]     = useState(false);
  const [exportOpen, setExportOpen]       = useState(false);
  const [exportando, setExportando]       = useState(false);
  const exportRef                         = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExportar = async (formato) => {
    setExportOpen(false);
    setExportando(true);
    try {
      const params = { busqueda, orden };
      if (filtroTipo)   params.tipo        = filtroTipo;
      if (filtroStock)  params.filtroStock = filtroStock;
      const { data } = await exportarDatos(params);
      if (!data?.length) {
        Swal.fire('Sin datos', 'No hay productos que exportar con los filtros actuales.', 'info');
        return;
      }
      if (formato === 'excel') exportarExcel(data);
      else                     exportarPDF(data);
    } catch {
      Swal.fire('Error', 'No se pudo generar el archivo.', 'error');
    } finally {
      setExportando(false);
    }
  };

  const handleNuevo  = () => { setArticuloId(null); setModalOpen(true); };
  const handleEditar = (id) => { setArticuloId(id); setModalOpen(true); };

  const handleVerHistorial = (p) => {
    setArticuloHistorial({ articulo_id: p.articulo_id, nombre: p.nombre });
    setHistorialOpen(true);
  };

  const handleVerPrecios = (p) => {
    setArticuloPrecios({ articulo_id: p.articulo_id, nombre: p.nombre });
    setPreciosOpen(true);
  };

  const handleToggle = async (p) => {
    const accion = p.activo ? 'desactivar' : 'activar';
    const res = await swalConfirm(
      `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} producto?`,
      `"${p.nombre}" será ${accion === 'activar' ? 'reactivado' : 'dado de baja'}.`
    );
    if (!res.isConfirmed) return;
    try {
      if (p.activo) await eliminar(p.articulo_id);
      else          await reactivar(p.articulo_id);
      swalSuccess('Listo', `Producto ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente.`);
    } catch {
      swalError('Error', 'No se pudo cambiar el estado del producto.');
    }
  };

  const formatPrecio = (p) => {
    if (!p.precio_min && p.precio_min !== 0) return '—';
    const min = Number(p.precio_min).toFixed(2);
    const max = Number(p.precio_max).toFixed(2);
    return min === max ? `S/ ${min}` : `S/ ${min} – S/ ${max}`;
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Inventario</h1>
          <p className="text-sm text-[#bababa]">{total} producto{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAlertasOpen(true)}
            className="flex items-center justify-center gap-2 border border-orange-300 text-orange-500 hover:bg-orange-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <AlertTriangle size={16} /> Alertas de stock
          </button>
          <button onClick={() => setMarcasOpen(true)}
            className="flex items-center justify-center gap-2 border border-[#e5ba4a] text-[#e5ba4a] hover:bg-amber-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Tag size={16} /> Gestionar marcas
          </button>

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(p => !p)}
              disabled={exportando}
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <Download size={16} />
              {exportando ? 'Exportando...' : 'Exportar'}
              <span className="text-xs">▾</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden">
                <button
                  onClick={() => handleExportar('excel')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-green-600" />
                  Exportar Excel
                </button>
                <button
                  onClick={() => handleExportar('pdf')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                >
                  <FileText size={15} className="text-red-500" />
                  Exportar PDF
                </button>
              </div>
            )}
          </div>

          <button onClick={handleNuevo}
            className="flex items-center justify-center gap-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Package size={18} className="text-[#e5ba4a]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#bababa] uppercase tracking-wide">Total ítems</p>
            <p className="text-2xl font-bold text-gray-800">{resumen.totalItems}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <Package size={18} className="text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#bababa] uppercase tracking-wide">Unidades en stock</p>
            <p className="text-2xl font-bold text-gray-800">{resumen.stockTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <DollarSign size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#bababa] uppercase tracking-wide">Valor del stock</p>
            <p className="text-xl font-bold text-gray-800 truncate">
              S/ {Number(resumen.valorTotal).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${resumen.articulosEnAlerta > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <AlertTriangle size={18} className={resumen.articulosEnAlerta > 0 ? 'text-orange-500' : 'text-gray-400'} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#bababa] uppercase tracking-wide">En alerta</p>
            <div className="flex items-end gap-2">
              <p className={`text-2xl font-bold ${resumen.articulosEnAlerta > 0 ? 'text-orange-500' : 'text-gray-800'}`}>
                {resumen.articulosEnAlerta}
              </p>
              <p className="text-xs text-[#bababa] mb-1">
                <Activity size={11} className="inline mr-0.5" />
                {resumen.movimientosDelMes} mov/mes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bababa]" />
            <input value={busqueda} onChange={e => handleBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código..."
              className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-[#e5ba4a] transition-colors" />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              title="Escanear código de barras"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#bababa] hover:text-[#e5ba4a] transition-colors"
            >
              <ScanLine size={16} />
            </button>
          </div>
          <select value={filtroTipo} onChange={e => handleFiltro(e.target.value)}
            className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors">
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#bababa]">Stock:</span>
          {STOCK_FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFiltroStock(f.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filtroStock === f.value
                  ? 'bg-[#e5ba4a] border-[#e5ba4a] text-white'
                  : 'border-gray-200 text-gray-500 hover:border-[#e5ba4a] hover:text-[#e5ba4a]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 w-14"></th>
                <SortTh col="nombre" label="Producto"    orden={orden} onSort={handleOrden} />
                <th className="px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Marcas</th>
                <SortTh col="stock"  label="Stock"       orden={orden} onSort={handleOrden} className="text-center" />
                <SortTh col="precio" label="Precio venta" orden={orden} onSort={handleOrden} />
                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Cargando...</td></tr>
              )}
              {!loading && !productos.length && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No se encontraron productos</td></tr>
              )}
              {!loading && productos.map(p => (
                <tr key={`${p.articulo_id}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {p.imagen_principal
                      ? <img src={getImageUrl(p.imagen_principal)} alt={p.nombre} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-300" /></div>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.nombre}</p>
                    {p.codigo_interno && <p className="text-xs text-[#bababa]">{p.codigo_interno}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TIPO_BADGE[p.tipo] || 'bg-gray-100 text-gray-500'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                    {p.marcas || <span className="text-[#bababa]">Sin marca</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${
                      Number(p.stock_total) <= Number(p.stock_minimo) && Number(p.stock_total) > 0
                        ? 'text-orange-500'
                        : Number(p.stock_total) === 0
                          ? 'text-red-500'
                          : 'text-green-600'
                    }`}>
                      {p.stock_total}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatPrecio(p)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleVerHistorial(p)} title="Historial de movimientos"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#e5ba4a] hover:bg-amber-50 transition-colors">
                        <History size={15} />
                      </button>
                      <button onClick={() => handleVerPrecios(p)} title="Historial de precios"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                        <TrendingUp size={15} />
                      </button>
                      <button onClick={() => handleEditar(p.articulo_id)} title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleToggle(p)} title={p.activo ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded-lg transition-colors ${p.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-500 hover:bg-green-50'}`}>
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
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Anterior
              </button>
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <GestionMarcasModal open={marcasOpen} onClose={() => setMarcasOpen(false)} />

      <AlertasStockModal open={alertasOpen} onClose={() => setAlertasOpen(false)} />

      <HistorialMovimientosModal
        open={historialOpen}
        onClose={() => { setHistorialOpen(false); setArticuloHistorial(null); }}
        articulo={articuloHistorial}
      />

      <HistorialPreciosModal
        open={preciosOpen}
        onClose={() => { setPreciosOpen(false); setArticuloPrecios(null); }}
        articulo={articuloPrecios}
      />

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => { handleBusqueda(code); setScannerOpen(false); }}
      />

      <ProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); fetchInventario(); swalSuccess('Listo', articuloId ? 'Producto actualizado.' : 'Producto registrado.'); }}
        articuloId={articuloId}
      />
    </div>
  );
}
