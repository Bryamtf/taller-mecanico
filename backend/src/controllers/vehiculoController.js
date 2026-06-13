const Vehiculo = require("../models/Vehiculo");

// Helper para consultar la API externa
const consultarPlacaAPI = async (placa) => {
  try {
    const response = await fetch(process.env.API_PLACA_VEHICULO, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_JSON_PE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ placa: placa }),
    });
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error al consultar API externa de placa:", error);
    return null;
  }
};

const crearVehiculo = async (req, res) => {
  try {
    const datosBody = req.body;

    // 1. Consultar la API externa usando la placa
    const datosAPI = await consultarPlacaAPI(datosBody.placa);

    // 2. Fusionar datos (Prioridad: API > Body > Default)
    const vehiculoListoParaGuardar = {
      cliente_id: datosBody.cliente_id,
      placa: datosBody.placa,
      // Si la API encontró la marca/modelo la usamos, sino usamos la que mandó el frontend, sino "Desconocido"
      marca: datosAPI?.marca || datosBody.marca || "Desconocida",
      modelo: datosAPI?.modelo || datosBody.modelo || "Desconocido",
      color: datosAPI?.color || datosBody.color,
      vin: datosAPI?.vin || datosAPI?.serie || datosBody.vin,
      anio: datosBody.anio,
      tipo_combustible: datosBody.tipo_combustible,
      kilometraje_actual: datosBody.kilometraje_actual,
      observaciones: datosBody.observaciones,
    };

    // 3. Guardar en Base de Datos
    const nuevoId = await Vehiculo.crear(vehiculoListoParaGuardar);

    res.status(201).json({
      message: "Vehículo registrado exitosamente.",
      vehiculo_id: nuevoId,
      fuente_datos: datosAPI ? "API json.pe" : "Manual",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "La placa ingresada ya está registrada en el sistema.",
      });
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ message: "El ID del cliente no existe." });
    }
    console.error("Error en crearVehiculo:", error);
    res.status(500).json({ message: "Error interno al crear el vehículo." });
  }
};

const obtenerVehiculos = async (req, res) => {
  try {
    res.json(await Vehiculo.obtenerTodos());
  } catch (error) {
    res.status(500).json({ message: "Error al obtener vehículos." });
  }
};

const obtenerVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.obtenerPorId(req.params.id);
    if (!vehiculo)
      return res.status(404).json({ message: "Vehículo no encontrado." });
    res.json(vehiculo);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el vehículo." });
  }
};

const buscarVehiculoPorCliente = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.buscarPorCliente(req.params.cliente_id);
    if (!vehiculos)
      return res
        .status(404)
        .json({ message: "No se encontraron vehículos para este cliente." });
    res.json(vehiculos);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar vehículos por cliente." });
  }
};

const actualizarVehiculo = async (req, res) => {
  try {
    const actualizado = await Vehiculo.actualizar(req.params.id, req.body);
    if (!actualizado)
      return res.status(404).json({ message: "Vehículo no encontrado." });
    res.json({ message: "Vehículo actualizado." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar." });
  }
};

const eliminarVehiculo = async (req, res) => {
  try {
    const eliminado = await Vehiculo.eliminar(req.params.id);
    if (!eliminado)
      return res.status(404).json({ message: "Vehículo no encontrado." });
    res.json({ message: "Vehículo eliminado." });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        message:
          "No puedes eliminar este vehículo porque tiene citas o cotizaciones asociadas.",
      });
    }
    res.status(500).json({ message: "Error al eliminar." });
  }
};

const consultarPlacaExterna = async (req, res) => {
  const { placa } = req.body;
  if (!placa) return res.status(400).json({ message: "La placa es requerida" });

  const datos = await consultarPlacaAPI(placa.trim().toUpperCase());
  if (!datos)
    return res
      .status(404)
      .json({ message: "No se encontró información para esa placa" });

  res.json(datos);
};

const buscarPorPlaca = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.buscarPorPlaca(req.params.placa.toUpperCase());
    if (!vehiculo) return res.status(404).json({ message: 'Vehículo no encontrado.' });
    res.json(vehiculo);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar por placa.' });
  }
};

module.exports = {
  buscarVehiculoPorCliente,
  crearVehiculo,
  obtenerVehiculos,
  obtenerVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
  consultarPlacaExterna,
  buscarPorPlaca,
};
