import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '@/components/Modal/Modal';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';
import ventaService from '../services/ventaService';
import api from '@/lib/axios';
import { Search, Plus, Trash2, User, AlertTriangle } from 'lucide-react';

const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'yape', 'plin'];
const IGV_RATE = 0.18;

const fmt = (v) => `S/ ${(parseFloat(v) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
const round2 = (v) => Math.round(v * 100) / 100;

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a] focus:border-transparent';

const ITEM_VACIO = { descripcion_custom: '', articulo_id: null, marca_id: null, es_servicio: 0, cantidad: 1, precio_unitario: '', descuento: 0 };

const VentaDirectaModal = ({ onClose, onSuccess }) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente]         = useState('');
  const [resultadosCliente, setResultadosCliente]     = useState([]);
  const [mostrarResultados, setMostrarResultados]     = useState(false);
  const [vehiculos, setVehiculos]                     = useState([]);
  const [vehiculoId, setVehiculoId]                   = useState('');
  const [tiposComprobante, setTiposComprobante]       = useState([]);
  const [tipoComprobanteId, setTipoComprobanteId]     = useState('');
  const [observaciones, setObservaciones]             = useState('');
  const [items, setItems]                             = useState([]);
  const [pagos, setPagos]                             = useState([{ metodo: 'efectivo', monto: '' }]);
  const [guardando, setGuardando]                     = useState(false);

  const [itemActual, setItemActual]                   = useState(ITEM_VACIO);
  const [busquedaArt, setBusquedaArt]                 = useState('');
  const [resultadosArt, setResultadosArt]             = useState([]);
  const [mostrarArt, setMostrarArt]                   = useState(false);
  const artRef  = useRef(null);
  const cliRef  = useRef(null);

  const subtotal = round2(items.reduce((s, i) => s + i.subtotal, 0));
  const igv      = round2(subtotal * IGV_RATE);
  const total    = round2(subtotal + igv);
  const totalPagos = round2(pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0));
  const pagosValidos = Math.abs(totalPagos - total) < 0.02;
  const diferencia  = round2(total - totalPagos);

  const esClienteVarios = clienteSeleccionado?.dni_ruc === '00000000';
  const tipoComp = tiposComprobante.find((t) => String(t.tipo_comprobante_id) === String(tipoComprobanteId));
  const esFactura = tipoComp?.nombre?.toLowerCase().includes('factura');
  const esBoleta  = tipoComp?.nombre?.toLowerCase().includes('boleta');
  const requiereId = (esFactura || (esBoleta && total >= 700)) && esClienteVarios;

  useEffect(() => {
    ventaService.obtenerClienteVarios().then((c) => {
      setClienteSeleccionado(c);
      setBusquedaCliente(`${c.nombres} ${c.apellidos}`);
    }).catch(() => {});
    api.get('/comprobantes/tipos').then((r) => setTiposComprobante(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (clienteSeleccionado?.cliente_id) {
      ventaService.obtenerVehiculos(clienteSeleccionado.cliente_id).then(setVehiculos).catch(() => setVehiculos([]));
      setVehiculoId('');
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    if (total > 0) {
      setPagos([{ metodo: 'efectivo', monto: total.toFixed(2) }]);
    }
  }, [total]);

  const buscarCliente = useCallback(async (q) => {
    if (q.length < 2) { setResultadosCliente([]); return; }
    const res = await ventaService.buscarClientes(q).catch(() => []);
    setResultadosCliente(res);
    setMostrarResultados(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarCliente(busquedaCliente), 350);
    return () => clearTimeout(t);
  }, [busquedaCliente, buscarCliente]);

  const buscarArticulo = useCallback(async (q) => {
    if (q.length < 2) { setResultadosArt([]); return; }
    const r = await api.get('/articulos/buscar', { params: { q } }).catch(() => ({ data: { data: [] } }));
    setResultadosArt(r.data?.data || []);
    setMostrarArt(true);
  }, []);

  useEffect(() => {
    if (!itemActual.articulo_id) {
      const t = setTimeout(() => buscarArticulo(busquedaArt), 300);
      return () => clearTimeout(t);
    }
  }, [busquedaArt, itemActual.articulo_id, buscarArticulo]);

  useEffect(() => {
    const handler = (e) => {
      if (artRef.current && !artRef.current.contains(e.target)) setMostrarArt(false);
      if (cliRef.current && !cliRef.current.contains(e.target)) setMostrarResultados(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const seleccionarCliente = (c) => {
    setClienteSeleccionado(c);
    setBusquedaCliente(`${c.nombres} ${c.apellidos}`);
    setMostrarResultados(false);
  };

  const seleccionarArticulo = (art) => {
    setItemActual((prev) => ({
      ...prev,
      articulo_id:      art.articulo_id,
      marca_id:         art.marca_id || null,
      descripcion_custom: art.nombre,
      precio_unitario:  Number(art.precio_venta) || '',
      es_servicio:      0,
      _stock_disponible: art.stock_disponible != null ? Number(art.stock_disponible) : Number(art.stock_actual) || 0,
    }));
    setBusquedaArt(art.nombre);
    setMostrarArt(false);
  };

  const limpiarArticulo = () => {
    setItemActual(ITEM_VACIO);
    setBusquedaArt('');
    setResultadosArt([]);
  };

  const agregarItem = () => {
    const desc  = itemActual.descripcion_custom.trim() || busquedaArt.trim();
    const cant  = parseFloat(itemActual.cantidad) || 0;
    const precio = parseFloat(itemActual.precio_unitario) || 0;
    const desc_ = parseFloat(itemActual.descuento) || 0;

    if (!desc) { swalError('Campo requerido', 'Ingresa una descripción o selecciona un artículo.'); return; }
    if (cant <= 0) { swalError('Cantidad inválida', 'La cantidad debe ser mayor a 0.'); return; }
    if (precio <= 0) { swalError('Precio inválido', 'El precio unitario debe ser mayor a 0.'); return; }

    if (itemActual.articulo_id && !itemActual.es_servicio) {
      const disp = itemActual._stock_disponible ?? Infinity;
      if (cant > disp) {
        swalError('Stock insuficiente', `Stock disponible: ${disp} unidades.`);
        return;
      }
    }

    setItems((prev) => [...prev, {
      articulo_id:      itemActual.articulo_id,
      marca_id:         itemActual.marca_id,
      descripcion_custom: desc,
      es_servicio:      itemActual.es_servicio,
      cantidad:         cant,
      precio_unitario:  precio,
      descuento:        desc_,
      subtotal:         round2(cant * precio - desc_),
    }]);
    setItemActual(ITEM_VACIO);
    setBusquedaArt('');
    setResultadosArt([]);
  };

  const quitarItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const actualizarPago = (i, field, value) =>
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const agregarPago = () => {
    if (pagos.length >= 4) return;
    setPagos((prev) => [...prev, { metodo: 'efectivo', monto: Math.max(0, diferencia).toFixed(2) }]);
  };

  const quitarPago = (i) => setPagos((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!clienteSeleccionado) { swalError('Cliente requerido', 'Selecciona un cliente.'); return; }
    if (items.length === 0)   { swalError('Sin ítems', 'Agrega al menos un ítem a la venta.'); return; }
    if (requiereId) {
      swalError(
        'Cliente no identificado',
        esFactura
          ? 'Para emitir una factura se requiere un cliente con RUC registrado.'
          : 'Las boletas de S/ 700 o más requieren identificar al cliente (DNI/RUC).'
      );
      return;
    }
    if (!pagosValidos) { swalError('Pagos incorrectos', 'El total de pagos no coincide con el total de la venta.'); return; }

    const result = await swalConfirm('¿Generar venta directa?', `Total: ${fmt(total)}`);
    if (!result.isConfirmed) return;

    setGuardando(true);
    try {
      const res = await ventaService.generarVentaDirecta({
        cliente_id:          clienteSeleccionado.cliente_id,
        vehiculo_id:         vehiculoId || null,
        detalles:            items,
        pagos:               pagos.map((p) => ({ metodo: p.metodo, monto: parseFloat(p.monto) })),
        tipo_comprobante_id: tipoComprobanteId || null,
        observaciones:       observaciones || null,
      });
      swalSuccess(`Venta generada: ${res.numero_venta}`);
      onSuccess();
    } catch (error) {
      swalError('Error', error?.response?.data?.message || 'Error al generar la venta.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nueva venta directa" size="xl">
      <div className="p-1 space-y-5 max-h-[75vh] overflow-y-auto pr-1">

        {/* Cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div ref={cliRef}>
            <label className="block text-xs text-gray-500 mb-1">Cliente *</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busquedaCliente}
                onChange={(e) => { setBusquedaCliente(e.target.value); setClienteSeleccionado(null); }}
                onFocus={() => resultadosCliente.length > 0 && setMostrarResultados(true)}
                placeholder="Buscar cliente..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a]"
              />
              {mostrarResultados && resultadosCliente.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                  {resultadosCliente.map((c) => (
                    <div key={c.cliente_id} onMouseDown={() => seleccionarCliente(c)}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <p className="text-sm font-medium">{c.nombres} {c.apellidos}</p>
                      <p className="text-xs text-gray-400">{c.dni_ruc || 'Sin DNI'} · {c.telefono || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {clienteSeleccionado && (
              <div className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-[#fdf7e7] border border-[#e5ba4a]/40 rounded text-xs text-[#b8962a]">
                <User size={11} />
                <span>{clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}</span>
                {esClienteVarios && <span className="ml-auto text-orange-400">Consumidor final</span>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Vehículo (opcional)</label>
            <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className={inputCls}>
              <option value="">Sin vehículo</option>
              {vehiculos.map((v) => (
                <option key={v.vehiculo_id} value={v.vehiculo_id}>
                  {v.placa} — {v.marca} {v.modelo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Agregar ítem */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
          <p className="text-xs font-medium text-gray-600">Agregar ítem</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_110px_90px_auto] gap-2 items-end">
            <div ref={artRef} className="relative">
              <input
                value={busquedaArt}
                onChange={(e) => {
                  setBusquedaArt(e.target.value);
                  if (!itemActual.articulo_id) setItemActual((p) => ({ ...p, descripcion_custom: e.target.value }));
                  else limpiarArticulo();
                }}
                onFocus={() => resultadosArt.length > 0 && setMostrarArt(true)}
                placeholder="Descripción o buscar artículo..."
                className={inputCls}
              />
              {mostrarArt && resultadosArt.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                  {resultadosArt.map((art) => (
                    <div key={`${art.articulo_id}-${art.marca_id}`} onMouseDown={() => seleccionarArticulo(art)}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <div className="flex justify-between items-center gap-2">
                        <div>
                          <p className="text-sm font-medium">{art.nombre}</p>
                          {art.marca_nombre && <p className="text-xs text-gray-400">{art.marca_nombre}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium">S/ {Number(art.precio_venta).toFixed(2)}</p>
                          <p className={`text-[10px] ${art.stock_disponible > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            Disp: {art.stock_disponible ?? art.stock_actual}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="number" min="1" value={itemActual.cantidad}
              onChange={(e) => setItemActual((p) => ({ ...p, cantidad: e.target.value }))}
              placeholder="Cant." className={inputCls} />
            <input type="number" min="0" step="0.01" value={itemActual.precio_unitario}
              onChange={(e) => setItemActual((p) => ({ ...p, precio_unitario: e.target.value }))}
              placeholder="Precio s/IGV" className={inputCls} />
            <input type="number" min="0" step="0.01" value={itemActual.descuento}
              onChange={(e) => setItemActual((p) => ({ ...p, descuento: e.target.value }))}
              placeholder="Desc." className={inputCls} />
            <button type="button" onClick={agregarItem}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-[#e5ba4a] hover:bg-[#d4a93a] text-white rounded-lg transition-colors">
              <Plus size={14} /> Agregar
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="esServicio" checked={itemActual.es_servicio === 1}
              onChange={(e) => setItemActual((p) => ({ ...p, es_servicio: e.target.checked ? 1 : 0, articulo_id: null, marca_id: null }))}
              className="accent-[#e5ba4a]" />
            <label htmlFor="esServicio" className="text-xs text-gray-600 cursor-pointer">Es mano de obra / servicio</label>
          </div>
        </div>

        {/* Lista de ítems */}
        {items.length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs text-gray-500">Descripción</th>
                  <th className="text-center px-3 py-2 text-xs text-gray-500">Cant.</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500">P. Unit.</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500">Subtotal</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <p>{item.descripcion_custom}</p>
                      {Boolean(item.es_servicio) && <span className="text-[10px] text-blue-500">Servicio</span>}
                    </td>
                    <td className="text-center px-3 py-2">{item.cantidad}</td>
                    <td className="text-right px-3 py-2">{fmt(item.precio_unitario)}</td>
                    <td className="text-right px-3 py-2 font-medium">{fmt(item.subtotal)}</td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => quitarItem(i)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-gray-50 px-3 py-2 text-sm space-y-1 border-t border-gray-100">
              <div className="flex justify-between text-gray-500"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>IGV (18%):</span><span>{fmt(igv)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total:</span><span className="text-[#e5ba4a]">{fmt(total)}</span></div>
            </div>
          </div>
        )}

        {/* Alerta cliente no identificado */}
        {requiereId && (
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-700">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>
              {esFactura
                ? 'Para factura se requiere un cliente con RUC registrado.'
                : `Las boletas de S/ 700 o más requieren identificar al comprador. Total actual: ${fmt(total)}.`}
            </span>
          </div>
        )}

        {/* Comprobante */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Comprobante (opcional)</label>
            <select value={tipoComprobanteId} onChange={(e) => setTipoComprobanteId(e.target.value)} className={inputCls}>
              <option value="">Sin comprobante</option>
              {tiposComprobante.map((t) => (
                <option key={t.tipo_comprobante_id} value={t.tipo_comprobante_id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
            <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional..." maxLength={200} className={inputCls} />
          </div>
        </div>

        {/* Pagos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Pago</span>
            {pagos.length < 4 && (
              <button type="button" onClick={agregarPago}
                className="text-xs flex items-center gap-1 text-[#e5ba4a] hover:text-[#d4a93a] transition-colors">
                <Plus size={13} /> Agregar método
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pagos.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={p.metodo} onChange={(e) => actualizarPago(i, 'metodo', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a]">
                  {METODOS.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
                <input type="number" min="0" step="0.01" value={p.monto}
                  onChange={(e) => actualizarPago(i, 'monto', e.target.value)}
                  placeholder="0.00"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e5ba4a] text-right" />
                {pagos.length > 1 && (
                  <button type="button" onClick={() => quitarPago(i)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className={`flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 font-medium ${!pagosValidos && total > 0 ? 'text-red-600' : 'text-green-600'}`}>
            <span>Total pagado:</span><span>{fmt(totalPagos)}</span>
          </div>
          {!pagosValidos && total > 0 && (
            <p className="text-xs text-red-500 mt-0.5">
              {diferencia > 0 ? `Faltan ${fmt(diferencia)}` : `Excede en ${fmt(-diferencia)}`}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={guardando || items.length === 0 || !pagosValidos || requiereId}
            className="px-5 py-2 text-sm bg-[#e5ba4a] hover:bg-[#d4a93a] text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {guardando ? 'Generando...' : 'Generar venta'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VentaDirectaModal;
