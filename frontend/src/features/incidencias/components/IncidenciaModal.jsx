import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDown, ChevronUp, ImagePlus, X, Search, Loader, CheckCircle } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { swalError } from '@/lib/swal';
import { buscarClientePorDni, buscarVehiculoPorPlaca } from '../services/incidenciaService';
import { onKeyDown as kd, sanitizar } from '@/utils/inputSanitizer';
import {
  REGLAS, calcularPrioridad,
  CATEGORIAS, URGENCIAS, IMPACTOS, CATEGORIAS_CIERRE,
  SUGERENCIAS_CATEGORIA, PRIORIDAD_BADGE, PRIORIDAD_LABEL,
} from '../utils/incidenciaValidaciones';

const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors bg-white';
const lbl = 'block text-xs font-medium text-gray-600 mb-1';
const err = 'text-xs text-red-500 mt-0.5';
const MAX_IMAGENES = 5;

const SearchRow = ({ value, onChange, onSearch, loading: isLoading, placeholder, maxLen, onKeyDown }) => (
  <div className="flex gap-2">
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${inp} flex-1`}
      maxLength={maxLen}
      onKeyDown={onKeyDown}
    />
    <button
      type="button"
      onClick={onSearch}
      disabled={isLoading || !value.trim()}
      className="flex items-center gap-1 px-3 py-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors shrink-0"
    >
      {isLoading ? <Loader size={13} className="animate-spin" /> : <Search size={13} />}
      {isLoading ? '' : 'Buscar'}
    </button>
  </div>
);

const InfoTag = ({ label, onClear }) => (
  <div className="mt-1.5 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
    <CheckCircle size={14} className="text-green-500 shrink-0" />
    <span className="text-xs text-green-700 font-medium flex-1">{label}</span>
    <button type="button" onClick={onClear} className="text-gray-400 hover:text-red-500 transition-colors">
      <X size={12} />
    </button>
  </div>
);

export default function IncidenciaModal({ open, onClose, onSave, incidencia }) {
  const isEdit = !!incidencia;

  const [saving, setSaving]                     = useState(false);
  const [showVinculos, setShowVinculos]         = useState(false);
  const [imagenes, setImagenes]                 = useState([]);
  const [prioridadPreview, setPrioridadPreview] = useState(null);

  const [dniInput, setDniInput]       = useState('');
  const [clienteInfo, setClienteInfo] = useState(null);
  const [buscandoCli, setBuscandoCli] = useState(false);

  const [placaInput, setPlacaInput]     = useState('');
  const [vehiculoInfo, setVehiculoInfo] = useState(null);
  const [buscandoVeh, setBuscandoVeh]   = useState(false);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm({ defaultValues: { canal_entrada: 'interno' } });

  const urgenciaVal = watch('urgencia');
  const impactoVal  = watch('impacto');
  const estadoVal   = watch('estado');

  useEffect(() => {
    setPrioridadPreview(calcularPrioridad(urgenciaVal, impactoVal));
  }, [urgenciaVal, impactoVal]);

  useEffect(() => {
    if (!open) return;

    reset(
      isEdit
        ? {
            titulo:           incidencia.titulo,
            descripcion:      incidencia.descripcion,
            categoria:        incidencia.categoria,
            canal_entrada:    incidencia.canal_entrada,
            urgencia:         incidencia.urgencia,
            impacto:          incidencia.impacto,
            asignado_a:       incidencia.asignado_a       ?? '',
            solucion:         incidencia.solucion         ?? '',
            categoria_cierre: incidencia.categoria_cierre ?? '',
            cliente_id:       incidencia.cliente_id       ?? '',
            vehiculo_id:      incidencia.vehiculo_id      ?? '',
          }
        : { canal_entrada: 'interno' }
    );

    setImagenes([]);

    if (isEdit && incidencia.cliente_id) {
      setClienteInfo({
        cliente_id: incidencia.cliente_id,
        nombres:    incidencia.cliente_nombres  ?? '',
        apellidos:  incidencia.cliente_apellidos ?? '',
      });
      setDniInput('');
      setShowVinculos(true);
    } else {
      setClienteInfo(null);
      setDniInput('');
    }

    if (isEdit && incidencia.vehiculo_id) {
      setVehiculoInfo({
        vehiculo_id: incidencia.vehiculo_id,
        placa:       incidencia.placa           ?? '',
        marca:       incidencia.vehiculo_marca  ?? '',
        modelo:      incidencia.vehiculo_modelo ?? '',
      });
      setPlacaInput(incidencia.placa ?? '');
      setShowVinculos(true);
    } else {
      setVehiculoInfo(null);
      setPlacaInput('');
    }
  }, [open, incidencia, isEdit, reset]);

  const handleBuscarCliente = async () => {
    const dni = dniInput.trim();
    if (!dni) return;
    setBuscandoCli(true);
    try {
      const cliente = await buscarClientePorDni(dni);
      if (cliente) {
        setClienteInfo(cliente);
        setValue('cliente_id', cliente.cliente_id);
      } else {
        setClienteInfo(null);
        setValue('cliente_id', '');
        swalError('No encontrado', 'No se encontró un cliente con ese DNI/RUC.');
      }
    } catch {
      swalError('Error', 'No se pudo buscar el cliente.');
    } finally {
      setBuscandoCli(false);
    }
  };

  const limpiarCliente = () => {
    setClienteInfo(null);
    setDniInput('');
    setValue('cliente_id', '');
  };

  const handleBuscarVehiculo = async () => {
    const placa = placaInput.trim().toUpperCase();
    if (!placa) return;
    setBuscandoVeh(true);
    try {
      const vehiculo = await buscarVehiculoPorPlaca(placa);
      if (vehiculo) {
        setVehiculoInfo(vehiculo);
        setValue('vehiculo_id', vehiculo.vehiculo_id);
      } else {
        setVehiculoInfo(null);
        setValue('vehiculo_id', '');
        swalError('No encontrado', 'No se encontró un vehículo con esa placa.');
      }
    } catch (e) {
      if (e.response?.status === 404) {
        swalError('No encontrado', 'No se encontró un vehículo con esa placa.');
      } else {
        swalError('Error', 'No se pudo buscar el vehículo.');
      }
      setVehiculoInfo(null);
      setValue('vehiculo_id', '');
    } finally {
      setBuscandoVeh(false);
    }
  };

  const limpiarVehiculo = () => {
    setVehiculoInfo(null);
    setPlacaInput('');
    setValue('vehiculo_id', '');
  };

  const handleAddImagenes = (e) => {
    const files = Array.from(e.target.files || []);
    const disponibles = MAX_IMAGENES - imagenes.length;
    const nuevas = files.slice(0, disponibles).map((f) => ({
      file:    f,
      preview: URL.createObjectURL(f),
    }));
    setImagenes((prev) => [...prev, ...nuevas]);
    e.target.value = '';
  };

  const handleRemoveImagen = (idx) => {
    setImagenes((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleCategoriaChange = (e) => {
    const cat = e.target.value;
    setValue('categoria', cat);
    if (!isEdit && cat && SUGERENCIAS_CATEGORIA[cat]) {
      setValue('urgencia', SUGERENCIAS_CATEGORIA[cat].urgencia);
      setValue('impacto',  SUGERENCIAS_CATEGORIA[cat].impacto);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('titulo',        data.titulo.trim());
      fd.append('descripcion',   data.descripcion.trim());
      fd.append('categoria',     data.categoria);
      fd.append('canal_entrada', data.canal_entrada || 'interno');
      fd.append('urgencia',      data.urgencia);
      fd.append('impacto',       data.impacto);
      fd.append('cliente_id',    data.cliente_id  || '');
      fd.append('vehiculo_id',   data.vehiculo_id || '');

      if (isEdit) {
        fd.append('asignado_a',       data.asignado_a       || '');
        fd.append('solucion',         data.solucion?.trim() || '');
        fd.append('categoria_cierre', data.categoria_cierre  || '');
      }

      imagenes.forEach(({ file }) => fd.append('imagenes', file));

      await onSave(fd, isEdit);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const mostrarCierre = isEdit && (
    estadoVal === 'resuelta' || estadoVal === 'cerrada' ||
    incidencia?.estado === 'resuelta' || incidencia?.estado === 'cerrada'
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Incidencia' : 'Nueva Incidencia'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

        {/* Título */}
        <div>
          <label className={lbl}>Título <span className="text-red-400">*</span></label>
          <input
            {...register('titulo', REGLAS.titulo)}
            onChange={(e) => setValue('titulo', sanitizar.texto(e.target.value))}
            placeholder="Describe brevemente la incidencia"
            className={inp}
            maxLength={150}
          />
          {errors.titulo && <p className={err}>{errors.titulo.message}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label className={lbl}>Descripción <span className="text-red-400">*</span></label>
          <textarea
            {...register('descripcion', REGLAS.descripcion)}
            onChange={(e) => setValue('descripcion', sanitizar.texto(e.target.value))}
            placeholder="Detalla los síntomas, el contexto y cualquier información relevante..."
            rows={4}
            className={`${inp} resize-none`}
            maxLength={1000}
          />
          {errors.descripcion && <p className={err}>{errors.descripcion.message}</p>}
        </div>

        {/* Categoría y Canal */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Categoría <span className="text-red-400">*</span></label>
            <select
              {...register('categoria', REGLAS.categoria)}
              onChange={handleCategoriaChange}
              className={inp}
            >
              <option value="">Seleccionar...</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.categoria && <p className={err}>{errors.categoria.message}</p>}
          </div>

          <div>
            <label className={lbl}>Canal de entrada</label>
            <select {...register('canal_entrada')} className={inp}>
              <option value="interno">Interno</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
        </div>

        {/* Urgencia, Impacto, Prioridad preview */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Urgencia <span className="text-red-400">*</span></label>
            <select {...register('urgencia', REGLAS.urgencia)} className={inp}>
              <option value="">Seleccionar...</option>
              {URGENCIAS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            {errors.urgencia && <p className={err}>{errors.urgencia.message}</p>}
          </div>

          <div>
            <label className={lbl}>Impacto <span className="text-red-400">*</span></label>
            <select {...register('impacto', REGLAS.impacto)} className={inp}>
              <option value="">Seleccionar...</option>
              {IMPACTOS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
            {errors.impacto && <p className={err}>{errors.impacto.message}</p>}
          </div>

          <div>
            <label className={lbl}>Prioridad resultante</label>
            <div className="flex items-center h-[38px] px-3 rounded-lg border border-gray-200 bg-gray-50">
              {prioridadPreview ? (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORIDAD_BADGE[prioridadPreview]}`}>
                  {PRIORIDAD_LABEL[prioridadPreview]}
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">Selecciona urgencia e impacto</span>
              )}
            </div>
          </div>
        </div>

        {/* Resolución (edición cuando estado es resuelta/cerrada) */}
        {mostrarCierre && (
          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-700">Información de resolución</p>
            <div>
              <label className={lbl}>Solución aplicada</label>
              <textarea
                {...register('solucion', REGLAS.solucion)}
                onChange={(e) => setValue('solucion', sanitizar.texto(e.target.value))}
                placeholder="Describe cómo se resolvió la incidencia..."
                rows={3}
                className={`${inp} resize-none`}
                maxLength={1000}
              />
              {errors.solucion && <p className={err}>{errors.solucion.message}</p>}
            </div>
            <div>
              <label className={lbl}>Categoría de cierre</label>
              <select {...register('categoria_cierre')} className={inp}>
                <option value="">Seleccionar...</option>
                {CATEGORIAS_CIERRE.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Vinculaciones (colapsable) */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVinculos((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>
              Vinculaciones opcionales
              {(clienteInfo || vehiculoInfo) && (
                <span className="ml-2 text-[11px] bg-[#e5ba4a] text-white px-1.5 py-0.5 rounded-full">
                  {[clienteInfo && 'Cliente', vehiculoInfo && 'Vehículo'].filter(Boolean).join(', ')}
                </span>
              )}
            </span>
            {showVinculos ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showVinculos && (
            <div className="p-4 space-y-4">
              {/* Cliente por DNI */}
              <div>
                <label className={lbl}>Buscar cliente por DNI/RUC</label>
                <SearchRow
                  value={dniInput}
                  onChange={(e) => setDniInput(sanitizar.ruc(e.target.value))}
                  onSearch={handleBuscarCliente}
                  loading={buscandoCli}
                  placeholder="Ej: 12345678"
                  maxLen={11}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleBuscarCliente(); return; }
                    kd.soloNumeros(e);
                  }}
                />
                {clienteInfo && (
                  <InfoTag
                    label={`${clienteInfo.nombres} ${clienteInfo.apellidos}`}
                    onClear={limpiarCliente}
                  />
                )}
                <input {...register('cliente_id')} type="hidden" />
              </div>

              {/* Vehículo por placa */}
              <div>
                <label className={lbl}>Buscar vehículo por placa</label>
                <SearchRow
                  value={placaInput}
                  onChange={(e) => setPlacaInput(sanitizar.placa(e.target.value))}
                  onSearch={handleBuscarVehiculo}
                  loading={buscandoVeh}
                  placeholder="Ej: ABC-123"
                  maxLen={8}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleBuscarVehiculo(); return; }
                    kd.soloPlaca(e);
                  }}
                />
                {vehiculoInfo && (
                  <InfoTag
                    label={`${vehiculoInfo.placa} — ${vehiculoInfo.marca} ${vehiculoInfo.modelo}`}
                    onClear={limpiarVehiculo}
                  />
                )}
                <input {...register('vehiculo_id')} type="hidden" />
              </div>
            </div>
          )}
        </div>

        {/* Imágenes */}
        <div>
          <label className={lbl}>
            {isEdit ? 'Agregar imágenes' : 'Imágenes adjuntas'}
            <span className="text-gray-400 font-normal ml-1">(máx. {MAX_IMAGENES})</span>
          </label>
          {isEdit && (
            <p className="text-[11px] text-gray-400 mb-2">
              Las imágenes que agregues aquí se guardan como fotos del proceso de resolución.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {imagenes.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImagen(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {imagenes.length < MAX_IMAGENES && (
              <label className="w-20 h-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#e5ba4a] transition-colors shrink-0">
                <ImagePlus size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-400 mt-1">Agregar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleAddImagenes}
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar incidencia'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
