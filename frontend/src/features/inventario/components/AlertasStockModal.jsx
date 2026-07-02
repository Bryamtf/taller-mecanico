import { useState, useEffect } from 'react';
import Modal from '@/components/Modal/Modal';
import { getArticulosEnAlerta, getImageUrl } from '../services/inventarioService';
import { Package } from 'lucide-react';

const TIPO_BADGE = {
  repuesto:   'bg-blue-100 text-blue-700',
  consumable: 'bg-purple-100 text-purple-700',
  consumible: 'bg-purple-100 text-purple-700',
  servicio:   'bg-green-100 text-green-700',
};

export default function AlertasStockModal({ open, onClose }) {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getArticulosEnAlerta()
      .then(data => setArticulos(data.data ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Alertas de stock bajo" size="lg">
      <div className="p-6 space-y-4">

        {!loading && !!articulos.length && (
          <p className="text-sm text-[#bababa]">
            {articulos.length} producto{articulos.length !== 1 ? 's' : ''} con stock igual o por debajo del mínimo
          </p>
        )}

        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 w-12"></th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Marcas</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Stock actual</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Stock mínimo</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td>
                  </tr>
                )}
                {!loading && !articulos.length && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No hay productos con alertas de stock
                    </td>
                  </tr>
                )}
                {!loading && articulos.map(a => (
                  <tr key={a.articulo_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {a.imagen_principal
                        ? <img src={getImageUrl(a.imagen_principal)} alt={a.nombre} className="w-9 h-9 object-cover rounded-lg border border-gray-200" />
                        : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={14} className="text-gray-300" /></div>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.nombre}</p>
                      {a.codigo_interno && <p className="text-xs text-[#bababa]">{a.codigo_interno}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TIPO_BADGE[a.tipo] || 'bg-gray-100 text-gray-500'}`}>
                        {a.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                      {a.marcas || <span className="text-[#bababa]">Sin marca</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-sm ${Number(a.stock_total) === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                        {a.stock_total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-sm">
                      {a.stock_minimo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Modal>
  );
}
