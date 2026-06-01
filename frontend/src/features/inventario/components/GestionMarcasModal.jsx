import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { getMarcas, createMarcaCatalog, updateMarcaCatalog, deleteMarcaCatalog } from '../services/inventarioService';
import { swalConfirm, swalError, swalSuccess } from '@/lib/swal';

export default function GestionMarcasModal({ open, onClose }) {
  const [marcas, setMarcas]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [editando, setEditando]   = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [agregando, setAgregando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try { setMarcas(await getMarcas()); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (open) cargar(); }, [open]);

  const handleCrear = async () => {
    if (!nuevoNombre.trim()) return;
    try {
      await createMarcaCatalog({ nombre: nuevoNombre.trim() });
      setNuevoNombre('');
      setAgregando(false);
      await cargar();
    } catch (err) {
      swalError('Error', err.response?.data?.message || 'No se pudo crear la marca.');
    }
  };

  const handleEditar = async (marca) => {
    if (!editNombre.trim()) return;
    try {
      await updateMarcaCatalog(marca.marca_id, { nombre: editNombre.trim() });
      setEditando(null);
      await cargar();
    } catch (err) {
      swalError('Error', err.response?.data?.message || 'No se pudo actualizar la marca.');
    }
  };

  const handleEliminar = async (marca) => {
    const res = await swalConfirm('¿Eliminar marca?', `"${marca.nombre}" será eliminada del catálogo. No se puede eliminar si está en uso.`);
    if (!res.isConfirmed) return;
    try {
      await deleteMarcaCatalog(marca.marca_id);
      swalSuccess('Eliminado', 'Marca eliminada del catálogo.');
      await cargar();
    } catch (err) {
      swalError('No se puede eliminar', err.response?.data?.message || 'Esta marca está en uso por algún artículo.');
    }
  };

  const startEdit = (marca) => { setEditando(marca.marca_id); setEditNombre(marca.nombre); };
  const cancelEdit = () => { setEditando(null); setEditNombre(''); };

  return (
    <Modal open={open} onClose={onClose} title="Gestionar marcas" size="sm">
      <div className="p-6 space-y-3">
        {loading && <p className="text-center text-sm text-gray-400 py-4">Cargando...</p>}

        {!loading && marcas.map(m => (
          <div key={m.marca_id} className="flex items-center gap-2">
            {editando === m.marca_id ? (
              <>
                <input
                  value={editNombre}
                  onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditar(m); if (e.key === 'Escape') cancelEdit(); }}
                  className="flex-1 rounded-lg border border-[#e5ba4a] px-3 py-1.5 text-sm outline-none"
                  autoFocus
                />
                <button onClick={() => handleEditar(m)} className="p-1.5 rounded text-green-500 hover:bg-green-50"><Check size={14} /></button>
                <button onClick={cancelEdit} className="p-1.5 rounded text-gray-400 hover:bg-gray-50"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-700">{m.nombre}</span>
                <button onClick={() => startEdit(m)} className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Pencil size={13} /></button>
                <button onClick={() => handleEliminar(m)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </>
            )}
          </div>
        ))}

        {!loading && !marcas.length && (
          <p className="text-center text-sm text-gray-400 py-2">Sin marcas registradas</p>
        )}

        {/* Agregar nueva */}
        {agregando ? (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <input
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCrear(); if (e.key === 'Escape') setAgregando(false); }}
              placeholder="Nombre de la marca"
              className="flex-1 rounded-lg border border-[#e5ba4a] px-3 py-1.5 text-sm outline-none"
              autoFocus
            />
            <button onClick={handleCrear} className="p-1.5 rounded text-green-500 hover:bg-green-50"><Check size={14} /></button>
            <button onClick={() => { setAgregando(false); setNuevoNombre(''); }} className="p-1.5 rounded text-gray-400 hover:bg-gray-50"><X size={14} /></button>
          </div>
        ) : (
          <button
            onClick={() => setAgregando(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#e5ba4a] border border-dashed border-[#e5ba4a] rounded-lg hover:bg-amber-50 transition-colors mt-2"
          >
            <Plus size={14} /> Nueva marca
          </button>
        )}
      </div>
    </Modal>
  );
}
