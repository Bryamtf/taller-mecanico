const pool = require('../config/database');
const Venta = require('../models/Venta');
const ReservaStock = require('../models/ReservaStock');
const Cotizacion = require('../models/Cotizacion');

const ventaController = {
  async listarPendientes(req, res) {
    try {
      const { pagina = 1, limite = 20, busqueda = '' } = req.query;
      const result = await Venta.listarPendientes({
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        busqueda,
      });
      res.json(result);
    } catch (error) {
      console.error('listarPendientes:', error);
      res.status(500).json({ message: 'Error al obtener cotizaciones pendientes de cobro.' });
    }
  },

  async listarHistorial(req, res) {
    try {
      const { pagina = 1, limite = 20, busqueda = '' } = req.query;
      const result = await Venta.listarHistorial({
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        busqueda,
      });
      res.json(result);
    } catch (error) {
      console.error('listarHistorial:', error);
      res.status(500).json({ message: 'Error al obtener historial de ventas.' });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const venta = await Venta.encontrarPorId(req.params.id);
      if (!venta) return res.status(404).json({ message: 'Venta no encontrada.' });
      res.json(venta);
    } catch (error) {
      console.error('obtenerPorId:', error);
      res.status(500).json({ message: 'Error al obtener la venta.' });
    }
  },

  async obtenerResumen(req, res) {
    try {
      const resumen = await Venta.obtenerResumen();
      res.json(resumen);
    } catch (error) {
      console.error('obtenerResumen:', error);
      res.status(500).json({ message: 'Error al obtener el resumen de ventas.' });
    }
  },

  async generarVenta(req, res) {
    const conn = await pool.getConnection();
    try {
      const { cotizacion_id, tipo_comprobante_id, pagos, observaciones } = req.body;
      const username = req.user?.username || 'sistema';

      if (!cotizacion_id) {
        return res.status(400).json({ message: 'Se requiere cotizacion_id.' });
      }
      if (!pagos || !Array.isArray(pagos) || pagos.length === 0) {
        return res.status(400).json({ message: 'Se requiere al menos un pago.' });
      }

      const [[cotizacionRow]] = await pool.query(
        `SELECT c.*,
                CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
                cl.cliente_id, cl.dni_ruc,
                v.vehiculo_id
         FROM Cotizacion c
         JOIN Cliente cl ON cl.cliente_id = c.cliente_id
         JOIN Vehiculo v ON v.vehiculo_id = c.vehiculo_id
         WHERE c.cotizacion_id = ?`,
        [cotizacion_id]
      );
      if (!cotizacionRow) {
        return res.status(404).json({ message: 'Cotización no encontrada.' });
      }
      if (cotizacionRow.estado !== 'aprobada') {
        return res.status(400).json({ message: 'Solo se pueden generar ventas desde cotizaciones aprobadas.' });
      }

      const [detalles] = await pool.query(
        `SELECT dc.*,
                a.nombre AS articulo_nombre,
                m.nombre AS marca_nombre,
                COALESCE(dc.descripcion_custom, a.nombre) AS descripcion_custom
         FROM Detalle_cotizacion dc
         LEFT JOIN Articulos a ON a.articulo_id = dc.articulo_id
         LEFT JOIN Marca_Repuesto m ON m.marca_id = dc.marca_id
         WHERE dc.cotizacion_id = ?`,
        [cotizacion_id]
      );
      cotizacionRow.detalles = detalles;

      const totalPagos = pagos.reduce((s, p) => s + parseFloat(p.monto || 0), 0);
      const totalCotizacion = parseFloat(cotizacionRow.total);
      if (Math.abs(totalPagos - totalCotizacion) > 0.01) {
        return res.status(400).json({
          message: `El total de pagos (S/ ${totalPagos.toFixed(2)}) no coincide con el total de la cotización (S/ ${totalCotizacion.toFixed(2)}).`,
        });
      }

      await conn.beginTransaction();

      await ReservaStock.consumirPorCotizacion(cotizacion_id, conn);

      const resultado = await Venta.crear(
        { cotizacion_id, tipo_comprobante_id: tipo_comprobante_id || null, pagos, observaciones, username },
        cotizacionRow,
        conn
      );

      await conn.commit();
      res.status(201).json({
        message: 'Venta generada exitosamente.',
        ...resultado,
      });
    } catch (error) {
      await conn.rollback();
      console.error('generarVenta:', error);
      res.status(500).json({ message: error.message || 'Error al generar la venta.' });
    } finally {
      conn.release();
    }
  },

  async anularVenta(req, res) {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;
      const username = req.user?.username || 'sistema';

      const venta = await Venta.encontrarPorId(id);
      if (!venta) return res.status(404).json({ message: 'Venta no encontrada.' });
      if (venta.estado === 'anulada') return res.status(400).json({ message: 'La venta ya está anulada.' });

      await conn.beginTransaction();
      await Venta.anular(id, username, conn);
      await conn.commit();

      res.json({ message: 'Venta anulada correctamente.' });
    } catch (error) {
      await conn.rollback();
      console.error('anularVenta:', error);
      res.status(500).json({ message: 'Error al anular la venta.' });
    } finally {
      conn.release();
    }
  },
};

module.exports = ventaController;
