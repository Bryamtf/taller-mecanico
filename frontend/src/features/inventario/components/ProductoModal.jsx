import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Pencil, Trash2, ImagePlus, ArrowUpDown } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import AjusteStockModal from './AjusteStockModal';
import { swalConfirm, swalError, swalSuccess } from '@/lib/swal';
import {
  createArticulo, updateArticulo, getMarcas,
  agregarMarca, updateMarca, deleteMarca, getArticulo, getImageUrl,
} from '../services/inventarioService';

const TIPOS = ['repuesto', 'consumible', 'servicio'];
const UNIDADES = ['unidad', 'litro', 'kg', 'metro', 'hora'];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errorClass = 'text-xs text-red-500 mt-0.5';

// ─── Tab de Datos ────────────────────────────────────────────────────────────
function TabDatos({ register, errors }) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nombre del repuesto *</label>
        <input {...register('nombre', { required: 'Requerido', maxLength: { value: 150, message: 'Máx. 150 caracteres' } })}
          placeholder="Ej. Filtro de aceite Toyota" className={inputClass} />
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Código de barras *</label>
          <input {...register('codigo_barras', { required: 'Requerido' })}
            placeholder="7708481919566" className={inputClass} />
          {errors.codigo_barras && <p className={errorClass}>{errors.codigo_barras.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Código interno</label>
          <input {...register('codigo_interno')} placeholder="F-001" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Tipo *</label>
          <select {...register('tipo', { required: 'Requerido' })} className={inputClass}>
            <option value="">Seleccionar</option>
            {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
          {errors.tipo && <p className={errorClass}>{errors.tipo.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Unidad de medida *</label>
          <select {...register('unidad_medida', { required: 'Requerido' })} className={inputClass}>
            <option value="">Seleccionar</option>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          {errors.unidad_medida && <p className={errorClass}>{errors.unidad_medida.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Stock mínimo</label>
          <input {...register('stock_minimo', { min: { value: 0, message: 'Inválido' } })}
            type="number" placeholder="0" className={inputClass} />
          {errors.stock_minimo && <p className={errorClass}>{errors.stock_minimo.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Alerta stock</label>
          <input {...register('alerta_stock', { min: { value: 0, message: 'Inválido' } })}
            type="number" placeholder="5" className={inputClass} />
          {errors.alerta_stock && <p className={errorClass}>{errors.alerta_stock.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Descripción</label>
        <textarea {...register('descripcion')} rows={2} className={`${inputClass} resize-none`} />
      </div>
    </div>
  );
}

// ─── Tab de Marcas ────────────────────────────────────────────────────────────
function TabMarcas({ articuloId, marcas, onRefresh, isEdit, onMarcaInicialChange, onAjustarStock }) {
  const [listaMarcas, setListaMarcas]     = useState([]);
  const [editando, setEditando]           = useState(null); // marca_id en edición
  const [agregando, setAgregando]         = useState(false);
  const [form, setForm]                   = useState({ marca_id: '', precio_venta: '', precio_costo: '', stock_actual: '' });

  useEffect(() => {
    getMarcas().then(setListaMarcas).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAgregar = async () => {
    if (!form.marca_id) return swalError('Marca requerida', 'Selecciona una marca.');
    try {
      await agregarMarca(articuloId, form);
      setAgregando(false);
      setForm({ marca_id: '', precio_venta: '', precio_costo: '', stock_actual: '' });
      onRefresh();
      swalSuccess('Marca agregada', 'La marca fue asociada al artículo.');
    } catch (err) {
      swalError('Error', err.response?.data?.message || 'No se pudo agregar la marca.');
    }
  };

  const handleUpdate = async (marca_id) => {
    try {
      await updateMarca(articuloId, marca_id, form);
      setEditando(null);
      onRefresh();
      swalSuccess('Actualizado', 'Datos de la marca actualizados.');
    } catch {
      swalError('Error', 'No se pudo actualizar la marca.');
    }
  };

  const handleDelete = async (marca_id, marca_nombre) => {
    const res = await swalConfirm('¿Eliminar marca?', `Se quitará "${marca_nombre}" de este artículo.`);
    if (!res.isConfirmed) return;
    try {
      await deleteMarca(articuloId, marca_id);
      onRefresh();
      swalSuccess('Eliminado', 'Marca eliminada del artículo.');
    } catch {
      swalError('Error', 'No se pudo eliminar la marca.');
    }
  };

  const startEdit = (m) => {
    setEditando(m.marca_id);
    setForm({ marca_id: m.marca_id, precio_venta: m.precio_venta, precio_costo: m.precio_costo, stock_actual: m.stock_actual });
  };

  // Modo creación: formulario simple sin llamadas API
  if (!isEdit) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-400">Opcional. Puedes agregar más marcas después de guardar el producto.</p>
        <div>
          <label className={labelClass}>Marca</label>
          <select name="marca_id" value={form.marca_id} onChange={(e) => { handleChange(e); onMarcaInicialChange({ ...form, marca_id: e.target.value }); }} className={inputClass}>
            <option value="">Sin marca por ahora</option>
            {listaMarcas.map(m => <option key={m.marca_id} value={m.marca_id}>{m.nombre}</option>)}
          </select>
        </div>
        {form.marca_id && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Precio costo (S/)</label>
              <input name="precio_costo" type="number" step="0.01" value={form.precio_costo}
                onChange={(e) => { handleChange(e); onMarcaInicialChange({ ...form, precio_costo: e.target.value }); }}
                placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Precio venta (S/)</label>
              <input name="precio_venta" type="number" step="0.01" value={form.precio_venta}
                onChange={(e) => { handleChange(e); onMarcaInicialChange({ ...form, precio_venta: e.target.value }); }}
                placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock actual</label>
              <input name="stock_actual" type="number" value={form.stock_actual}
                onChange={(e) => { handleChange(e); onMarcaInicialChange({ ...form, stock_actual: e.target.value }); }}
                placeholder="0" className={inputClass} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Modo edición: lista live
  return (
    <div className="space-y-3">
      {!marcas.length && !agregando && (
        <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
          Sin marcas registradas
        </p>
      )}

      {marcas.map(m => (
        <div key={m.marca_id} className="border border-gray-200 rounded-lg overflow-hidden">
          {editando === m.marca_id ? (
            <div className="p-3 space-y-3 bg-amber-50">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Precio costo</label>
                  <input name="precio_costo" type="number" step="0.01" value={form.precio_costo} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Precio venta</label>
                  <input name="precio_venta" type="number" step="0.01" value={form.precio_venta} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Stock actual</label>
                  <input name="stock_actual" type="number" value={form.stock_actual} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditando(null)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="button" onClick={() => handleUpdate(m.marca_id)} className="text-xs px-3 py-1.5 rounded-lg bg-[#e5ba4a] text-white hover:bg-[#d4a93a]">Guardar</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{m.marca_nombre}</p>
                <p className="text-xs text-gray-400">
                  Costo: S/ {Number(m.precio_costo).toFixed(2)} · Venta: S/ {Number(m.precio_venta).toFixed(2)} · Stock: {m.stock_actual}
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => onAjustarStock(m)} title="Ajustar stock" className="p-1.5 rounded text-gray-400 hover:text-[#e5ba4a] hover:bg-amber-50 transition-colors"><ArrowUpDown size={13} /></button>
                <button type="button" onClick={() => startEdit(m)} className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Pencil size={13} /></button>
                <button type="button" onClick={() => handleDelete(m.marca_id, m.marca_nombre)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          )}
        </div>
      ))}

      {agregando ? (
        <div className="border border-[#e5ba4a] rounded-lg p-3 space-y-3 bg-amber-50">
          <div>
            <label className={labelClass}>Marca *</label>
            <select name="marca_id" value={form.marca_id} onChange={handleChange} className={inputClass}>
              <option value="">Seleccionar marca</option>
              {listaMarcas.filter(m => !marcas.find(em => em.marca_id === m.marca_id))
                .map(m => <option key={m.marca_id} value={m.marca_id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Precio costo</label>
              <input name="precio_costo" type="number" step="0.01" value={form.precio_costo} onChange={handleChange} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Precio venta</label>
              <input name="precio_venta" type="number" step="0.01" value={form.precio_venta} onChange={handleChange} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Stock actual</label>
              <input name="stock_actual" type="number" value={form.stock_actual} onChange={handleChange} placeholder="0" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setAgregando(false); setForm({ marca_id: '', precio_venta: '', precio_costo: '', stock_actual: '' }); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="button" onClick={handleAgregar} className="text-xs px-3 py-1.5 rounded-lg bg-[#e5ba4a] text-white hover:bg-[#d4a93a]">Agregar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => { setAgregando(true); setForm({ marca_id: '', precio_venta: '', precio_costo: '', stock_actual: '' }); }}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#e5ba4a] border border-dashed border-[#e5ba4a] rounded-lg hover:bg-amber-50 transition-colors">
          <Plus size={14} /> Agregar marca
        </button>
      )}
    </div>
  );
}

// ─── Tab de Imágenes ──────────────────────────────────────────────────────────
function TabImagenes({ imagenesExistentes, onEliminarExistente, imagenesNuevas, onAgregarNuevas, onQuitarNueva }) {
  const inputRef = useRef();
  const totalActual = imagenesExistentes.length + imagenesNuevas.length;

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const disponibles = 5 - totalActual;
    if (disponibles <= 0) return swalError('Límite alcanzado', 'Máximo 5 imágenes por artículo.');
    onAgregarNuevas(files.slice(0, disponibles));
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Máximo 5 imágenes. {totalActual}/5 usadas.</p>

      {/* Imágenes existentes */}
      {!!imagenesExistentes.length && (
        <div>
          <p className={labelClass}>Imágenes actuales</p>
          <div className="flex flex-wrap gap-3">
            {imagenesExistentes.map(img => (
              <div key={img.imagen_id} className="relative group">
                <img src={getImageUrl(img.ruta)} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                <button type="button" onClick={() => onEliminarExistente(img.imagen_id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nuevas imágenes */}
      {!!imagenesNuevas.length && (
        <div>
          <p className={labelClass}>Nuevas imágenes</p>
          <div className="flex flex-wrap gap-3">
            {imagenesNuevas.map((file, i) => (
              <div key={i} className="relative group">
                <img src={URL.createObjectURL(file)} alt="" className="w-20 h-20 object-cover rounded-lg border border-[#e5ba4a]" />
                <button type="button" onClick={() => onQuitarNueva(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalActual < 5 && (
        <>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          <button type="button" onClick={() => inputRef.current.click()}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#e5ba4a] hover:text-[#e5ba4a] transition-colors">
            <ImagePlus size={16} /> Seleccionar imágenes
          </button>
        </>
      )}
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function ProductoModal({ open, onClose, onSaved, articuloId }) {
  const isEdit = !!articuloId;
  const tabs   = ['Datos', 'Marcas', 'Imágenes'];
  const [tab, setTab]                     = useState('Datos');
  const [saving, setSaving]               = useState(false);
  const [articulo, setArticulo]           = useState(null);
  const [ajusteOpen, setAjusteOpen]       = useState(false);
  const [marcaAjuste, setMarcaAjuste]     = useState(null);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesAEliminar, setImagenesAEliminar]   = useState([]);
  const [imagenesNuevas, setImagenesNuevas]         = useState([]);
  const [marcaInicial, setMarcaInicial]             = useState({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Carga datos en edición
  useEffect(() => {
    if (!open) return;
    setTab('Datos');
    setImagenesAEliminar([]);
    setImagenesNuevas([]);
    setMarcaInicial({});

    if (isEdit) {
      getArticulo(articuloId).then(res => {
        const art = res.data;
        setArticulo(art);
        setImagenesExistentes(art.imagenes || []);
        reset({
          nombre:         art.nombre,
          codigo_barras:  art.codigo_barras,
          codigo_interno: art.codigo_interno,
          tipo:           art.tipo,
          unidad_medida:  art.unidad_medida,
          stock_minimo:   art.stock_minimo,
          alerta_stock:   art.alerta_stock,
          descripcion:    art.descripcion,
        });
      });
    } else {
      setArticulo(null);
      setImagenesExistentes([]);
      reset({});
    }
  }, [open, articuloId, isEdit, reset]);

  const handleEliminarExistente = (id) => {
    setImagenesAEliminar(prev => [...prev, id]);
    setImagenesExistentes(prev => prev.filter(i => i.imagen_id !== id));
  };

  const handleRefreshMarcas = async () => {
    const res = await getArticulo(articuloId);
    setArticulo(res.data);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });

      if (imagenesAEliminar.length) fd.append('imagenes_a_eliminar', JSON.stringify(imagenesAEliminar));
      imagenesNuevas.forEach(f => fd.append('imagenes', f));

      if (!isEdit) {
        // Incluir marca inicial si fue completada
        if (marcaInicial.marca_id) {
          fd.append('marca_id',     marcaInicial.marca_id);
          fd.append('precio_venta', marcaInicial.precio_venta || 0);
          fd.append('precio_costo', marcaInicial.precio_costo || 0);
          fd.append('stock_actual', marcaInicial.stock_actual || 0);
        }
        await createArticulo(fd);
      } else {
        await updateArticulo(articuloId, fd);
      }

      onSaved();
      onClose();
    } catch (err) {
      swalError('Error', err.response?.data?.message || 'No se pudo guardar el artículo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={isEdit ? 'Editar producto' : 'Nuevo producto'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex border-b border-gray-200 px-6">
            {tabs.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-[#e5ba4a] text-[#e5ba4a]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'Datos' && <TabDatos register={register} errors={errors} />}

            {tab === 'Marcas' && (
              <TabMarcas
                articuloId={articuloId}
                marcas={articulo?.marcas || []}
                onRefresh={handleRefreshMarcas}
                isEdit={isEdit}
                onMarcaInicialChange={setMarcaInicial}
                onAjustarStock={(m) => { setMarcaAjuste(m); setAjusteOpen(true); }}
              />
            )}

            {tab === 'Imágenes' && (
              <TabImagenes
                imagenesExistentes={imagenesExistentes}
                onEliminarExistente={handleEliminarExistente}
                imagenesNuevas={imagenesNuevas}
                onAgregarNuevas={(files) => setImagenesNuevas(prev => [...prev, ...files])}
                onQuitarNueva={(i) => setImagenesNuevas(prev => prev.filter((_, idx) => idx !== i))}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 pb-6">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white font-medium hover:bg-[#d4a93a] disabled:opacity-60 transition-colors">
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </Modal>

      <AjusteStockModal
        open={ajusteOpen}
        onClose={() => { setAjusteOpen(false); setMarcaAjuste(null); }}
        onSaved={async () => {
          setAjusteOpen(false);
          setMarcaAjuste(null);
          await handleRefreshMarcas();
          swalSuccess('Stock actualizado', 'El ajuste fue registrado correctamente.');
        }}
        articuloId={articuloId}
        marca={marcaAjuste}
      />
    </>
  );
}
