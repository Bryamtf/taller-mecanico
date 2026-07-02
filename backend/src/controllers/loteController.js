const pool = require('../config/database');
const Lote = require('../models/Lote');

const listar = async (req, res) => {
    try {
        const lotes = await Lote.listarPorArticulo(req.params.id);
        res.json({ success: true, data: lotes });
    } catch (error) {
        console.error('Error en listar lotes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener lotes' });
    }
};

const crear = async (req, res) => {
    const { id } = req.params;
    const { marca_id, numero_lote, cantidad, fecha_vencimiento, fecha_ingreso, observaciones } = req.body;

    if (!marca_id || !cantidad || parseInt(cantidad) <= 0) {
        return res.status(400).json({ success: false, message: 'Marca y cantidad son requeridos' });
    }

    const cantidadNum = parseInt(cantidad);
    const connection  = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [ampRows] = await connection.query(
            `SELECT stock_actual FROM Articulo_Marca_Precio WHERE articulo_id = ? AND marca_id = ?`,
            [id, marca_id]
        );
        if (!ampRows.length) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Combinación artículo-marca no encontrada' });
        }

        const stockAnterior = ampRows[0].stock_actual;
        const nuevoStock    = stockAnterior + cantidadNum;

        const loteId = await Lote.crear(id, {
            marca_id, numero_lote, cantidad: cantidadNum,
            fecha_vencimiento, fecha_ingreso, observaciones,
            registrado_por: req.user?.username || null,
        });

        await connection.query(
            `UPDATE Articulo_Marca_Precio SET stock_actual = ? WHERE articulo_id = ? AND marca_id = ?`,
            [nuevoStock, id, marca_id]
        );

        await connection.query(
            `INSERT INTO Movimiento_inventario
               (articulo_id, marca_id, tipo_movimiento, cantidad, stock_anterior, stock_resultante, motivo, registrado_por)
             VALUES (?, ?, 'entrada', ?, ?, ?, 'ingreso_lote', ?)`,
            [id, marca_id, cantidadNum, stockAnterior, nuevoStock, req.user?.username || null]
        );

        await connection.query(
            `UPDATE Articulos SET alerta_stock = (
               SELECT CASE WHEN MIN(amp.stock_actual) <= a.stock_minimo THEN 1 ELSE 0 END
               FROM Articulo_Marca_Precio amp
               JOIN Articulos a ON a.articulo_id = amp.articulo_id
               WHERE amp.articulo_id = ?
             ) WHERE articulo_id = ?`,
            [id, id]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Lote registrado correctamente', lote_id: loteId, stock_nuevo: nuevoStock });

    } catch (error) {
        await connection.rollback();
        console.error('Error en crear lote:', error);
        res.status(500).json({ success: false, message: 'Error al registrar el lote' });
    } finally {
        connection.release();
    }
};

const actualizar = async (req, res) => {
    try {
        const { id, loteId } = req.params;
        const { cantidad_actual, observaciones } = req.body;

        if (cantidad_actual === undefined || parseInt(cantidad_actual) < 0) {
            return res.status(400).json({ success: false, message: 'cantidad_actual es requerida y debe ser >= 0' });
        }

        const ok = await Lote.actualizar(id, loteId, { cantidad_actual: parseInt(cantidad_actual), observaciones });
        if (!ok) return res.status(404).json({ success: false, message: 'Lote no encontrado' });

        res.json({ success: true, message: 'Lote actualizado correctamente' });
    } catch (error) {
        console.error('Error en actualizar lote:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el lote' });
    }
};

const desactivar = async (req, res) => {
    try {
        const { id, loteId } = req.params;
        const ok = await Lote.desactivar(id, loteId);
        if (!ok) return res.status(404).json({ success: false, message: 'Lote no encontrado' });
        res.json({ success: true, message: 'Lote dado de baja correctamente' });
    } catch (error) {
        console.error('Error en desactivar lote:', error);
        res.status(500).json({ success: false, message: 'Error al dar de baja el lote' });
    }
};

module.exports = { listar, crear, actualizar, desactivar };
