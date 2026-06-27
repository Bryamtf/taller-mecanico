-- Datos iniciales

-- =============================================================
-- BASE DE DATOS: TallerMecanico
-- =============================================================

CREATE DATABASE IF NOT EXISTS TallerMecanico
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE TallerMecanico;

-- =============================================================
-- BLOQUE 1 — ROLES Y PERMISOS
-- =============================================================

CREATE TABLE IF NOT EXISTS Rol (
  rol_id      INT          NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(50)  NOT NULL COMMENT 'gerente, socio, ayudante',
  descripcion TEXT         NULL,
  activo      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (rol_id),
  UNIQUE KEY uq_rol_nombre (nombre)
) ENGINE=InnoDB COMMENT='Roles del sistema interno del taller';


CREATE TABLE IF NOT EXISTS Permiso (
  permiso_id  INT          NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(80)  NOT NULL,
  modulo      VARCHAR(50)  NOT NULL COMMENT 'ventas, citas, cotizaciones, inventario, finanzas, usuarios',
  descripcion TEXT         NULL,
  PRIMARY KEY (permiso_id),
  UNIQUE KEY uq_permiso_nombre (nombre)
) ENGINE=InnoDB COMMENT='Permisos atómicos por módulo';


CREATE TABLE IF NOT EXISTS Rol_permiso (
  rol_id         INT        NOT NULL,
  permiso_id     INT        NOT NULL,
  puede_ver      TINYINT(1) NOT NULL DEFAULT 0,
  puede_crear    TINYINT(1) NOT NULL DEFAULT 0,
  puede_editar   TINYINT(1) NOT NULL DEFAULT 0,
  puede_eliminar TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_rp_rol     FOREIGN KEY (rol_id)     REFERENCES Rol(rol_id)         ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rp_permiso FOREIGN KEY (permiso_id) REFERENCES Permiso(permiso_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Matriz de permisos por rol';


-- =============================================================
-- BLOQUE 2 — USUARIOS INTERNOS
-- =============================================================

CREATE TABLE IF NOT EXISTS Usuario (
  username        VARCHAR(30)  NOT NULL,
  email           VARCHAR(255) NULL,
  password_hash   VARCHAR(255) NOT NULL COMMENT 'bcrypt o argon2id, nunca texto plano',
  nombre_completo VARCHAR(100) NULL,
  rol_id          INT          NOT NULL,
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso   TIMESTAMP    NULL,
  create_time     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (username),
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES Rol(rol_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Personal interno: gerente, socio, ayudante';


-- =============================================================
-- BLOQUE 3 — CLIENTES Y VEHÍCULOS
-- =============================================================

CREATE TABLE IF NOT EXISTS Cliente (
  cliente_id     INT          NOT NULL AUTO_INCREMENT,
  nombres        VARCHAR(80)  NOT NULL,
  apellidos      VARCHAR(80)  NOT NULL,
  dni_ruc        VARCHAR(20)  NULL COMMENT 'DNI (8 dígitos) o RUC (11 dígitos)',
  telefono       VARCHAR(20)  NULL,
  email          VARCHAR(255) NULL,
  direccion      TEXT         NULL,
  fecha_registro TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (cliente_id),
  UNIQUE KEY uq_cliente_dni (dni_ruc)
) ENGINE=InnoDB COMMENT='Clientes del taller';


CREATE TABLE IF NOT EXISTS Vehiculo (
  vehiculo_id        INT          NOT NULL AUTO_INCREMENT,
  cliente_id         INT          NOT NULL,
  placa              VARCHAR(10)  NOT NULL,
  marca              VARCHAR(50)  NOT NULL,
  modelo             VARCHAR(80)  NOT NULL,
  anio               YEAR         NULL,
  color              VARCHAR(30)  NULL,
  vin                VARCHAR(17)  NULL  COMMENT 'Número de chasis / VIN',
  tipo_combustible   VARCHAR(20)  NULL  COMMENT 'gasolina, diesel, GLP, GNV, electrico, hibrido',
  kilometraje_actual INT UNSIGNED NULL  COMMENT 'Se actualiza en cada visita al taller',
  observaciones      TEXT         NULL,
  fecha_registro     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vehiculo_id),
  UNIQUE KEY uq_vehiculo_placa (placa),
  CONSTRAINT fk_vehiculo_cliente FOREIGN KEY (cliente_id) REFERENCES Cliente(cliente_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Vehículos asociados a cada cliente';


-- =============================================================
-- BLOQUE 4 — SEGUIMIENTO PARA EL CLIENTE 
-- =============================================================

CREATE TABLE IF NOT EXISTS Seguimiento_token (
  token_id         INT      NOT NULL AUTO_INCREMENT,
  vehiculo_id      INT      NOT NULL,
  cliente_id       INT      NOT NULL,
  token            CHAR(64) NOT NULL COMMENT 'SHA-256 aleatorio generado al crear la cita',
  activo           TINYINT(1)  NOT NULL DEFAULT 1,
  fecha_expiracion DATETIME    NULL     COMMENT 'NULL = sin expiración',
  fecha_creacion   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_id),
  UNIQUE KEY uq_token (token),
  CONSTRAINT fk_st_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES Vehiculo(vehiculo_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_st_cliente  FOREIGN KEY (cliente_id)  REFERENCES Cliente(cliente_id)   ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Token de acceso público para que el cliente consulte el estado de su vehículo sin login';


CREATE TABLE IF NOT EXISTS Estado_vehiculo (
  estado_id       INT         NOT NULL AUTO_INCREMENT,
  vehiculo_id     INT         NOT NULL,
  cita_id         INT         NULL     COMMENT 'Orden de trabajo asociada (FK se agrega al final)',
  estado          VARCHAR(30) NOT NULL COMMENT 'pendiente, en_proceso, en_espera_repuesto, finalizado',
  descripcion     TEXT        NULL     COMMENT 'Mensaje visible para el cliente',
  actualizado_por VARCHAR(30) NULL,
  fecha_estado    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (estado_id),
  CONSTRAINT fk_ev_vehiculo FOREIGN KEY (vehiculo_id)     REFERENCES Vehiculo(vehiculo_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_ev_usuario  FOREIGN KEY (actualizado_por) REFERENCES Usuario(username)     ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Historial de estados del vehículo visible para el cliente vía token';


-- =============================================================
-- BLOQUE 5 — CITAS / ÓRDENES DE TRABAJO
-- =============================================================

CREATE TABLE IF NOT EXISTS Cita (
  cita_id               INT         NOT NULL AUTO_INCREMENT,
  cliente_id            INT         NOT NULL,
  vehiculo_id           INT         NOT NULL COMMENT 'Reincorporado de v1 — la cita debe estar ligada al vehículo',
  fecha_hora            DATETIME    NOT NULL,
  estado                VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                                    COMMENT 'pendiente, confirmada, en_proceso, en_espera_repuesto, finalizada, cancelada',
  tipo_servicio         VARCHAR(80) NULL     COMMENT 'diagnostico, mantenimiento, reparacion, revision',
  descripcion_problema  TEXT        NULL,
  atendido_por          VARCHAR(30) NULL,
  observaciones_tecnico TEXT        NULL,
  fecha_estimada_entrega DATE       NULL,
  fecha_registro        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cita_id),
  CONSTRAINT fk_cita_cliente  FOREIGN KEY (cliente_id)   REFERENCES Cliente(cliente_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_cita_vehiculo FOREIGN KEY (vehiculo_id)  REFERENCES Vehiculo(vehiculo_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_cita_tecnico  FOREIGN KEY (atendido_por) REFERENCES Usuario(username)     ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Órdenes de trabajo / citas del taller';


-- FK diferida: Estado_vehiculo → Cita
ALTER TABLE Estado_vehiculo
  ADD CONSTRAINT fk_ev_cita FOREIGN KEY (cita_id) REFERENCES Cita(cita_id) ON DELETE SET NULL ON UPDATE CASCADE;


-- =============================================================
-- BLOQUE 6 — INVENTARIO CON MARCAS
-- =============================================================

CREATE TABLE IF NOT EXISTS Marca_Repuesto (
  marca_id INT         NOT NULL AUTO_INCREMENT,
  nombre   VARCHAR(50) NOT NULL COMMENT 'Ej: CAC, MOBIL, FILCAR',
  PRIMARY KEY (marca_id),
  UNIQUE KEY uq_marca_rep (nombre)
) ENGINE=InnoDB COMMENT='Marcas de repuestos y consumibles';


CREATE TABLE IF NOT EXISTS Articulos (
  articulo_id           INT           NOT NULL AUTO_INCREMENT,
  nombre                VARCHAR(150)  NOT NULL,
  descripcion           TEXT          NULL,
  codigo_barras         VARCHAR(60)   NULL,
  codigo_interno        VARCHAR(30)   NULL  COMMENT 'Código interno del taller',
  tipo                  VARCHAR(20)   NOT NULL DEFAULT 'repuesto'
                                      COMMENT 'repuesto, consumible, servicio',
  unidad_medida         VARCHAR(20)   NOT NULL DEFAULT 'unidad'
                                      COMMENT 'unidad, litro, kg, metro, hora',
  stock_minimo          INT           NOT NULL DEFAULT 0   COMMENT 'Umbral para alerta de stock bajo',
  alerta_stock          TINYINT(1)    NOT NULL DEFAULT 0   COMMENT 'Se activa cuando stock_actual <= stock_minimo',
  ingreso_codigo_barras TINYINT(1)    NOT NULL DEFAULT 0   COMMENT '1=ingresado por escáner, 0=manual',
  activo                TINYINT(1)    NOT NULL DEFAULT 1,
  fecha_registro        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (articulo_id),
  UNIQUE KEY uq_art_barras   (codigo_barras),
  UNIQUE KEY uq_art_interno  (codigo_interno)
) ENGINE=InnoDB COMMENT='Repuestos, consumibles y servicios del inventario';


CREATE TABLE IF NOT EXISTS Articulo_Marca_Precio (
  articulo_id        INT           NOT NULL,
  marca_id           INT           NOT NULL,
  precio_venta       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  precio_costo       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_actual       INT           NOT NULL DEFAULT 0,
  cantidad_reservada INT           NOT NULL DEFAULT 0 COMMENT 'Unidades comprometidas en cotizaciones aprobadas pendientes de pago',
  PRIMARY KEY (articulo_id, marca_id),
  CONSTRAINT fk_amp_articulo FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_amp_marca    FOREIGN KEY (marca_id)    REFERENCES Marca_Repuesto(marca_id)   ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Precio y stock por artículo+marca (mismo repuesto puede tener varias marcas)';


CREATE TABLE IF NOT EXISTS Movimiento_inventario (
  movimiento_id    INT          NOT NULL AUTO_INCREMENT,
  articulo_id      INT          NOT NULL,
  marca_id         INT          NULL  COMMENT 'Qué marca entró o salió',
  tipo_movimiento  VARCHAR(20)  NOT NULL COMMENT 'entrada, salida, ajuste',
  cantidad         INT          NOT NULL,
  stock_anterior   INT          NOT NULL,
  stock_resultante INT          NOT NULL,
  motivo           VARCHAR(100) NULL  COMMENT 'venta, cita, ajuste_manual, devolucion',
  referencia_id    INT          NULL  COMMENT 'ID de la venta o cita que originó el movimiento',
  registrado_por   VARCHAR(30)  NULL,
  fecha            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (movimiento_id),
  CONSTRAINT fk_mov_articulo FOREIGN KEY (articulo_id)    REFERENCES Articulos(articulo_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mov_marca    FOREIGN KEY (marca_id)       REFERENCES Marca_Repuesto(marca_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mov_usuario  FOREIGN KEY (registrado_por) REFERENCES Usuario(username)        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Historial de movimientos de inventario';


CREATE TABLE IF NOT EXISTS Historial_precio (
  historial_id          INT           NOT NULL AUTO_INCREMENT,
  articulo_id           INT           NOT NULL,
  marca_id              INT           NOT NULL,
  marca_nombre          VARCHAR(100)  NULL,
  precio_venta_anterior DECIMAL(10,2) NULL,
  precio_venta_nuevo    DECIMAL(10,2) NULL,
  precio_costo_anterior DECIMAL(10,2) NULL,
  precio_costo_nuevo    DECIMAL(10,2) NULL,
  registrado_por        VARCHAR(100)  NULL,
  fecha                 TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (historial_id),
  INDEX idx_hp_articulo (articulo_id),
  CONSTRAINT fk_hp_articulo FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_hp_marca    FOREIGN KEY (marca_id)    REFERENCES Marca_Repuesto(marca_id)   ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Historial de cambios de precio por artículo y marca';


CREATE TABLE IF NOT EXISTS Lote (
  lote_id           INT           NOT NULL AUTO_INCREMENT,
  articulo_id       INT           NOT NULL,
  marca_id          INT           NOT NULL,
  numero_lote       VARCHAR(50)   NULL     COMMENT 'Código de lote del fabricante (opcional)',
  cantidad_inicial  INT           NOT NULL DEFAULT 0,
  cantidad_actual   INT           NOT NULL DEFAULT 0,
  fecha_vencimiento DATE          NULL     COMMENT 'NULL = producto no vence',
  fecha_ingreso     DATE          NOT NULL,
  observaciones     VARCHAR(200)  NULL,
  registrado_por    VARCHAR(100)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  PRIMARY KEY (lote_id),
  INDEX idx_lote_articulo (articulo_id, marca_id),
  INDEX idx_lote_vencimiento (fecha_vencimiento),
  CONSTRAINT fk_lote_articulo FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_lote_marca    FOREIGN KEY (marca_id)    REFERENCES Marca_Repuesto(marca_id)   ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Lotes de inventario con seguimiento de vencimiento por artículo y marca';


CREATE TABLE IF NOT EXISTS Reserva_Stock (
  reserva_id    INT         NOT NULL AUTO_INCREMENT,
  cotizacion_id INT         NOT NULL,
  articulo_id   INT         NOT NULL,
  marca_id      INT         NOT NULL,
  cantidad      INT         NOT NULL,
  estado        VARCHAR(20) NOT NULL DEFAULT 'activa' COMMENT 'activa, liberada, consumida',
  fecha_reserva TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre  TIMESTAMP   NULL,
  PRIMARY KEY (reserva_id),
  INDEX idx_rs_cotizacion (cotizacion_id),
  INDEX idx_rs_articulo   (articulo_id, marca_id),
  CONSTRAINT fk_rs_articulo FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id)     ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_rs_marca    FOREIGN KEY (marca_id)    REFERENCES Marca_Repuesto(marca_id)   ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Reservas de stock vinculadas a cotizaciones aprobadas pendientes de pago';


-- =============================================================
-- BLOQUE 7 — IMÁGENES
-- =============================================================

CREATE TABLE IF NOT EXISTS Imagenes (
  imagen_id       INT          NOT NULL AUTO_INCREMENT,
  cita_id         INT          NULL,
  cotizacion_id   INT          NULL,
  ruta_archivo    VARCHAR(500) NOT NULL COMMENT 'Ruta relativa o URL en almacenamiento',
  tipo            VARCHAR(20)  NOT NULL DEFAULT 'antes'
                               COMMENT 'antes, durante, despues',
  descripcion     TEXT         NULL,
  visible_cliente TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1=el cliente puede verla vía token',
  subido_por      VARCHAR(30)  NULL,
  fecha_subida    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (imagen_id),
  CONSTRAINT fk_img_usuario FOREIGN KEY (subido_por) REFERENCES Usuario(username) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Fotos del vehículo antes/durante/después de la reparación';


-- =============================================================
-- BLOQUE 8 — COTIZACIONES
-- =============================================================

CREATE TABLE IF NOT EXISTS Cotizacion (
  cotizacion_id        INT           NOT NULL AUTO_INCREMENT,
  cliente_id           INT           NOT NULL,
  vehiculo_id          INT           NOT NULL,
  cita_id              INT           NULL  COMMENT 'Cotización generada desde una cita',
  creado_por           VARCHAR(30)   NULL,
  -- Repositorio de plantillas/modelos
  es_modelo            TINYINT(1)    NOT NULL DEFAULT 0    COMMENT '1=es plantilla reutilizable',
  nombre_modelo        VARCHAR(100)  NULL                  COMMENT 'Nombre de la plantilla si es_modelo=1',
  cotizacion_origen_id INT           NULL                  COMMENT 'ID de la plantilla de la que se clonó',
  estado               VARCHAR(30)   NOT NULL DEFAULT 'borrador'
                                     COMMENT 'borrador, pendiente, aprobada, rechazada, vencida',
  kilometraje_momento  INT UNSIGNED  NULL  COMMENT 'Km del vehículo al emitir la cotización',
  subtotal             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descuento            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  igv                  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total                DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha_emision        DATE          NOT NULL,
  fecha_vencimiento    DATE          NULL,
  fecha_entrega        DATE          NULL  COMMENT 'Fecha estimada de entrega del vehículo',
  observaciones        TEXT          NULL,
  fecha_registro       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cotizacion_id),
  CONSTRAINT fk_cot_cliente  FOREIGN KEY (cliente_id)  REFERENCES Cliente(cliente_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_cot_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES Vehiculo(vehiculo_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_cot_cita     FOREIGN KEY (cita_id)     REFERENCES Cita(cita_id)         ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cot_usuario  FOREIGN KEY (creado_por)  REFERENCES Usuario(username)     ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Cotizaciones/presupuestos enviados al cliente';


CREATE TABLE IF NOT EXISTS Detalle_cotizacion (
  detalle_id         INT           NOT NULL AUTO_INCREMENT,
  cotizacion_id      INT           NOT NULL,
  articulo_id        INT           NULL  COMMENT 'NULL si es ítem libre (descripcion_custom)',
  marca_id           INT           NULL  COMMENT 'Marca específica del repuesto cotizado',
  descripcion_custom VARCHAR(255)  NULL  COMMENT 'Descripción libre cuando no hay articulo_id',
  cantidad           DECIMAL(10,2) NOT NULL DEFAULT 1,
  precio_unitario    DECIMAL(10,2) NOT NULL,
  descuento          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal           DECIMAL(10,2) NOT NULL,
  es_servicio        TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1=mano de obra/servicio, 0=repuesto',
  PRIMARY KEY (detalle_id),
  CONSTRAINT fk_dc_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES Cotizacion(cotizacion_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_dc_articulo   FOREIGN KEY (articulo_id)   REFERENCES Articulos(articulo_id)    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_dc_marca      FOREIGN KEY (marca_id)      REFERENCES Marca_Repuesto(marca_id)  ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Líneas de detalle de cada cotización';


-- FK diferidas: Imagenes → Cotizacion y Cita
ALTER TABLE Imagenes
  ADD CONSTRAINT fk_img_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES Cotizacion(cotizacion_id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_img_cita       FOREIGN KEY (cita_id)       REFERENCES Cita(cita_id)             ON DELETE SET NULL ON UPDATE CASCADE;


-- =============================================================
-- BLOQUE 9 — VENTAS
-- =============================================================

CREATE TABLE IF NOT EXISTS Venta (
  venta_id      INT           NOT NULL AUTO_INCREMENT,
  cliente_id    INT           NOT NULL,
  vehiculo_id   INT           NULL,
  cotizacion_id INT           NULL  COMMENT 'NULL si la venta no viene de una cotización',
  cita_id       INT           NULL  COMMENT 'Orden de trabajo que originó la venta',
  atendido_por  VARCHAR(30)   NULL,
  estado        VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                              COMMENT 'pendiente, completada, anulada',
  tipo_pago     VARCHAR(30)   NOT NULL DEFAULT 'efectivo'
                              COMMENT 'efectivo, tarjeta, transferencia, yape, plin, mixto',
  subtotal      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descuento     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  igv           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  observaciones TEXT          NULL,
  fecha_venta   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (venta_id),
  CONSTRAINT fk_venta_cliente    FOREIGN KEY (cliente_id)    REFERENCES Cliente(cliente_id)       ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_venta_vehiculo   FOREIGN KEY (vehiculo_id)   REFERENCES Vehiculo(vehiculo_id)     ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_venta_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES Cotizacion(cotizacion_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_venta_cita       FOREIGN KEY (cita_id)       REFERENCES Cita(cita_id)             ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_venta_usuario    FOREIGN KEY (atendido_por)  REFERENCES Usuario(username)         ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Transacciones de venta';


CREATE TABLE IF NOT EXISTS Detalle_venta (
  detalle_venta_id INT           NOT NULL AUTO_INCREMENT,
  venta_id         INT           NOT NULL,
  articulo_id      INT           NOT NULL,
  marca_id         INT           NULL  COMMENT 'Marca del repuesto vendido',
  cantidad         INT           NOT NULL DEFAULT 1,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  descuento        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal         DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (detalle_venta_id),
  CONSTRAINT fk_dv_venta    FOREIGN KEY (venta_id)    REFERENCES Venta(venta_id)              ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_dv_articulo FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id)       ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_dv_marca    FOREIGN KEY (marca_id)    REFERENCES Marca_Repuesto(marca_id)     ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Líneas de detalle de cada venta';


-- =============================================================
-- BLOQUE 10 — COMPROBANTES (SUNAT: Boleta, Factura, Nota Crédito)
-- =============================================================

CREATE TABLE IF NOT EXISTS Tipo_comprobante (
  tipo_comprobante_id INT         NOT NULL AUTO_INCREMENT,
  nombre              VARCHAR(50) NOT NULL COMMENT 'Boleta de Venta, Factura, Nota de Crédito',
  codigo_sunat        VARCHAR(10) NOT NULL COMMENT '03=Boleta, 01=Factura, 07=Nota Crédito',
  activo              TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (tipo_comprobante_id)
) ENGINE=InnoDB COMMENT='Tipos de comprobante SUNAT';


CREATE TABLE IF NOT EXISTS Serie (
  serie_id            INT         NOT NULL AUTO_INCREMENT,
  tipo_comprobante_id INT         NOT NULL,
  numero              VARCHAR(10) NOT NULL COMMENT 'Ej: B001, F001, NC01',
  activo              TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (serie_id),
  UNIQUE KEY uq_serie_numero (numero),
  CONSTRAINT fk_serie_tipo FOREIGN KEY (tipo_comprobante_id) REFERENCES Tipo_comprobante(tipo_comprobante_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Series de comprobantes (B001, F001…)';


CREATE TABLE IF NOT EXISTS Serie_correlativo (
  correlativo_id      INT       NOT NULL AUTO_INCREMENT,
  serie_id            INT       NOT NULL,
  correlativo_actual  INT       NOT NULL DEFAULT 0,
  correlativo_max     INT       NOT NULL DEFAULT 99999999,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (correlativo_id),
  UNIQUE KEY uq_sc_serie (serie_id),
  CONSTRAINT fk_sc_serie FOREIGN KEY (serie_id) REFERENCES Serie(serie_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Contador de correlativos por serie';


CREATE TABLE IF NOT EXISTS Comprobante (
  comprobante_id      INT          NOT NULL AUTO_INCREMENT,
  venta_id            INT          NOT NULL,
  serie_id            INT          NOT NULL,
  tipo_comprobante_id INT          NOT NULL,
  correlativo         INT          NOT NULL,
  numero_completo     VARCHAR(20)  NOT NULL COMMENT 'Ej: B001-00000012',
  estado              VARCHAR(20)  NOT NULL DEFAULT 'emitido' COMMENT 'emitido, anulado',
  generado_por        VARCHAR(30)  NULL,
  fecha_emision       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comprobante_id),
  UNIQUE KEY uq_comp_numero (numero_completo),
  CONSTRAINT fk_comp_venta   FOREIGN KEY (venta_id)            REFERENCES Venta(venta_id)                        ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_comp_serie   FOREIGN KEY (serie_id)            REFERENCES Serie(serie_id)                        ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_comp_tipo    FOREIGN KEY (tipo_comprobante_id) REFERENCES Tipo_comprobante(tipo_comprobante_id)   ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_comp_usuario FOREIGN KEY (generado_por)        REFERENCES Usuario(username)                      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Comprobantes emitidos (Boleta, Factura, Nota Crédito)';


CREATE TABLE IF NOT EXISTS Detalle_comprobante (
  detalle_comprobante_id INT           NOT NULL AUTO_INCREMENT,
  comprobante_id         INT           NOT NULL,
  descripcion            VARCHAR(200)  NOT NULL,
  cantidad               INT           NOT NULL DEFAULT 1,
  precio_unitario        DECIMAL(10,2) NOT NULL,
  igv                    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal               DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (detalle_comprobante_id),
  CONSTRAINT fk_dcomp_comprobante FOREIGN KEY (comprobante_id) REFERENCES Comprobante(comprobante_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Líneas del comprobante — requerido por SUNAT';


-- =============================================================
-- BLOQUE 11 — FINANZAS: INGRESOS Y EGRESOS
-- =============================================================

CREATE TABLE IF NOT EXISTS Ingresos (
  ingreso_id     INT           NOT NULL AUTO_INCREMENT,
  venta_id       INT           NULL,
  comprobante_id INT           NULL,
  registrado_por VARCHAR(30)   NULL,
  concepto       VARCHAR(150)  NOT NULL,
  categoria      VARCHAR(50)   NOT NULL DEFAULT 'pago_servicio'
                               COMMENT 'pago_servicio, anticipo, devolucion, otro',
  tipo_pago      VARCHAR(30)   NOT NULL DEFAULT 'efectivo'
                               COMMENT 'efectivo, tarjeta, transferencia, yape, plin',
  monto          DECIMAL(10,2) NOT NULL,
  fecha          DATE          NOT NULL,
  observaciones  TEXT          NULL,
  fecha_registro TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ingreso_id),
  CONSTRAINT fk_ing_venta       FOREIGN KEY (venta_id)       REFERENCES Venta(venta_id)             ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ing_comprobante FOREIGN KEY (comprobante_id) REFERENCES Comprobante(comprobante_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ing_usuario     FOREIGN KEY (registrado_por) REFERENCES Usuario(username)           ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro de ingresos de dinero';


CREATE TABLE IF NOT EXISTS Egresos (
  egreso_id      INT           NOT NULL AUTO_INCREMENT,
  registrado_por VARCHAR(30)   NULL,
  aprobado_por   VARCHAR(30)   NULL  COMMENT 'Solo gerente o socio aprueban',
  concepto       VARCHAR(150)  NOT NULL,
  categoria      VARCHAR(50)   NOT NULL DEFAULT 'otro'
                               COMMENT 'compra_repuesto, servicio_externo, planilla, alquiler, otro',
  tipo_pago      VARCHAR(30)   NOT NULL DEFAULT 'efectivo',
  monto          DECIMAL(10,2) NOT NULL,
  fecha          DATE          NOT NULL,
  observaciones  TEXT          NULL,
  fecha_registro TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (egreso_id),
  CONSTRAINT fk_egr_registrado FOREIGN KEY (registrado_por) REFERENCES Usuario(username) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_egr_aprobado   FOREIGN KEY (aprobado_por)   REFERENCES Usuario(username) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro de egresos/gastos del taller';


-- =============================================================
-- BLOQUE 12 — RECORDATORIOS DE MANTENIMIENTO
-- =============================================================

CREATE TABLE IF NOT EXISTS Recordatorio_Mantenimiento (
  recordatorio_id INT          NOT NULL AUTO_INCREMENT,
  vehiculo_id     INT          NOT NULL,
  descripcion     VARCHAR(150) NOT NULL,
  fecha_sugerida  DATE         NOT NULL,
  km_sugerido     INT UNSIGNED NULL  COMMENT 'Km en el que se recomienda el siguiente servicio',
  estado          VARCHAR(20)  NOT NULL DEFAULT 'pendiente' COMMENT 'pendiente, enviado, completado',
  PRIMARY KEY (recordatorio_id),
  CONSTRAINT fk_rec_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES Vehiculo(vehiculo_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Recordatorios de mantenimiento preventivo por vehículo';


-- =============================================================
-- BLOQUE 13 — PROVEEDORES
-- =============================================================

CREATE TABLE IF NOT EXISTS Proveedor (
  proveedor_id   INT          NOT NULL AUTO_INCREMENT,
  razon_social   VARCHAR(150) NOT NULL,
  ruc            VARCHAR(11)  NULL,
  telefono       VARCHAR(20)  NULL,
  email          VARCHAR(255) NULL,
  direccion      TEXT         NULL,
  activo         TINYINT(1)   NOT NULL DEFAULT 1,
  fecha_registro TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (proveedor_id),
  UNIQUE KEY uq_prov_ruc (ruc)
) ENGINE=InnoDB COMMENT='Proveedores — reservado para gestión futura de compras';


-- =============================================================
-- DATOS INICIALES
-- =============================================================

INSERT INTO Rol (nombre, descripcion) VALUES
  ('gerente',  'Acceso total al sistema'),
  ('socio',    'Acceso total al sistema'),
  ('ayudante', 'Acceso de solo lectura a cotizaciones');

INSERT INTO Tipo_comprobante (nombre, codigo_sunat) VALUES
  ('Boleta de Venta', '03'),
  ('Factura',         '01'),
  ('Nota de Crédito', '07');

INSERT INTO Serie (tipo_comprobante_id, numero) VALUES
  (1, 'B001'),
  (2, 'F001'),
  (3, 'NC01');

INSERT INTO Serie_correlativo (serie_id, correlativo_actual) VALUES
  (1, 0),
  (2, 0),
  (3, 0);

INSERT INTO Permiso (nombre, modulo) VALUES
  ('ver_citas',             'citas'),
  ('crear_citas',           'citas'),
  ('editar_citas',          'citas'),
  ('eliminar_citas',        'citas'),
  ('ver_cotizaciones',      'cotizaciones'),
  ('crear_cotizaciones',    'cotizaciones'),
  ('editar_cotizaciones',   'cotizaciones'),
  ('eliminar_cotizaciones', 'cotizaciones'),
  ('ver_ventas',            'ventas'),
  ('crear_ventas',          'ventas'),
  ('ver_inventario',        'inventario'),
  ('editar_inventario',     'inventario'),
  ('ver_finanzas',          'finanzas'),
  ('editar_finanzas',       'finanzas'),
  ('ver_usuarios',          'usuarios'),
  ('editar_usuarios',       'usuarios');

-- Gerente y Socio: acceso total
INSERT INTO Rol_permiso (rol_id, permiso_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.rol_id, p.permiso_id, 1, 1, 1, 1
FROM Rol r, Permiso p
WHERE r.nombre IN ('gerente', 'socio');

-- Ayudante: solo puede VER cotizaciones
INSERT INTO Rol_permiso (rol_id, permiso_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.rol_id, p.permiso_id, 1, 0, 0, 0
FROM Rol r, Permiso p
WHERE r.nombre = 'ayudante'
  AND p.nombre = 'ver_cotizaciones';

-- Se agrego foreign key en la tabla imagenes para que los articulos tengan imagenes
ALTER TABLE Imagenes 
ADD COLUMN articulo_id INT NULL AFTER cotizacion_id,
ADD COLUMN orden INT NOT NULL DEFAULT 0 AFTER visible_cliente;

ALTER TABLE Imagenes 
ADD CONSTRAINT fk_img_articulo 
FOREIGN KEY (articulo_id) REFERENCES Articulos(articulo_id) 
ON DELETE CASCADE ON UPDATE CASCADE;
-- NUEVAS COLUMNAS
ALTER TABLE Cotizacion 
ADD COLUMN pdf_path VARCHAR(500) NULL AFTER observaciones,
ADD COLUMN token_publico CHAR(64) NULL UNIQUE AFTER pdf_path,
ADD COLUMN token_expira DATETIME NULL AFTER token_publico;

-- Agregar campo deleted_at para soft delete
ALTER TABLE Cotizacion 
ADD COLUMN deleted_at DATETIME NULL AFTER token_expira,
ADD INDEX idx_deleted_at (deleted_at);

-- También agregar a Detalle_cotizacion 
-- ALTER TABLE Detalle_cotizacion ADD COLUMN deleted_at DATETIME NULL;


/*
  SEBASTIAN: AGREGAR FILA A PERMISOS: Editar Ventas
*/
INSERT INTO Permiso (nombre, modulo) VALUES
  ('editar_ventas', 'ventas')

/*
* Bryam: Tabla correativo de numero de cotizacion
*/
CREATE TABLE IF NOT EXISTS Correlativo_Cotizacion (
    id INT NOT NULL AUTO_INCREMENT,
    anio INT NOT NULL,
    ultimo_numero INT NOT NULL DEFAULT 0,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_anio (anio)
) ENGINE=InnoDB COMMENT='Control de correlativo anual para cotizaciones';

-- Paso 1: Agregar la columna permitiendo NULL temporalmente
ALTER TABLE Cotizacion 
ADD COLUMN numero_cotizacion VARCHAR(20) NULL 
COMMENT 'Número formateado: COT-2026-000001';

-- Paso 2: Agregar índice único (no puede haber números duplicados)
ALTER TABLE Cotizacion 
ADD UNIQUE INDEX uq_numero_cotizacion (numero_cotizacion);
-- SEBASTIAN: Hacer que el correo de la tabla usuarios sean únicos.
ALTER TABLE `Usuario` ADD UNIQUE(`email`);


-- DESARROLLO DEL MÓDULO DE INCIDENCIAS
-- Correlativo para código único INC-YYYY-NNNNNN
CREATE TABLE IF NOT EXISTS Correlativo_Incidencia (
  id                  INT       NOT NULL AUTO_INCREMENT,
  anio                INT       NOT NULL,
  ultimo_numero       INT       NOT NULL DEFAULT 0,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inc_anio (anio)
) ENGINE=InnoDB COMMENT='Control de correlativo anual para incidencias';


CREATE TABLE IF NOT EXISTS Incidencia (
  incidencia_id    INT          NOT NULL AUTO_INCREMENT,
  codigo           VARCHAR(20)  NOT NULL COMMENT 'Ej: INC-2026-000001',

  -- Descripción
  titulo           VARCHAR(150) NOT NULL,
  descripcion      TEXT         NOT NULL,

  -- Clasificación
  categoria        VARCHAR(50)  NOT NULL COMMENT 'tecnica, operativa, cliente, inventario, seguridad',
  canal_entrada    VARCHAR(20)  NOT NULL DEFAULT 'interno' COMMENT 'interno, cliente',

  -- Priorización ITIL: urgencia + impacto → prioridad
  urgencia         VARCHAR(20)  NOT NULL DEFAULT 'media'  COMMENT 'baja, media, alta',
  impacto          VARCHAR(20)  NOT NULL DEFAULT 'medio'  COMMENT 'bajo, medio, alto',
  prioridad        VARCHAR(20)  NOT NULL DEFAULT 'media'  COMMENT 'baja, media, alta, critica',

  -- Ciclo de vida
  estado           VARCHAR(30)  NOT NULL DEFAULT 'abierta' COMMENT 'abierta, en_proceso, escalada, resuelta, cerrada',

  -- Relaciones opcionales con otras entidades del sistema
  cliente_id       INT          NULL,
  vehiculo_id      INT          NULL,
  cita_id          INT          NULL,
  articulo_id      INT          NULL,
  token_id         INT          NULL COMMENT 'Token del cliente si reportó la incidencia vía portal público',

  -- Responsables
  reportado_por    VARCHAR(30)  NULL COMMENT 'NULL si fue reportada por cliente vía token',
  asignado_a       VARCHAR(30)  NULL,

  -- Resolución
  solucion         TEXT         NULL,
  categoria_cierre VARCHAR(50)  NULL COMMENT 'resuelto, workaround, sin_solucion, duplicada',

  -- Soft delete
  activo           TINYINT(1)   NOT NULL DEFAULT 1,

  -- Fechas del ciclo de vida
  fecha_registro   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_asignacion TIMESTAMP    NULL,
  fecha_resolucion TIMESTAMP    NULL,
  fecha_cierre     TIMESTAMP    NULL,

  PRIMARY KEY (incidencia_id),
  UNIQUE KEY uq_inc_codigo (codigo),
  CONSTRAINT fk_inc_cliente    FOREIGN KEY (cliente_id)    REFERENCES Cliente(cliente_id)         ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inc_vehiculo   FOREIGN KEY (vehiculo_id)   REFERENCES Vehiculo(vehiculo_id)       ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inc_cita       FOREIGN KEY (cita_id)       REFERENCES Cita(cita_id)               ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inc_articulo   FOREIGN KEY (articulo_id)   REFERENCES Articulos(articulo_id)      ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inc_token      FOREIGN KEY (token_id)      REFERENCES Seguimiento_token(token_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inc_reporta    FOREIGN KEY (reportado_por) REFERENCES Usuario(username)           ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inc_asignado   FOREIGN KEY (asignado_a)    REFERENCES Usuario(username)           ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Registro de incidencias del taller (ITIL adaptado)';


CREATE TABLE IF NOT EXISTS Incidencia_Historial (
  historial_id    INT         NOT NULL AUTO_INCREMENT,
  incidencia_id   INT         NOT NULL,
  tipo_accion     VARCHAR(30) NOT NULL COMMENT 'nota, cambio_estado, escalado, asignacion, resolucion, cierre',
  descripcion     TEXT        NOT NULL,
  estado_anterior VARCHAR(30) NULL,
  estado_nuevo    VARCHAR(30) NULL,
  realizado_por   VARCHAR(30) NULL,
  fecha           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (historial_id),
  CONSTRAINT fk_ih_incidencia FOREIGN KEY (incidencia_id) REFERENCES Incidencia(incidencia_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_ih_usuario    FOREIGN KEY (realizado_por) REFERENCES Usuario(username)         ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Historial de acciones sobre cada incidencia';


-- Extender Imagenes para soportar adjuntos de incidencias
ALTER TABLE Imagenes
  ADD COLUMN incidencia_id INT NULL AFTER articulo_id,
  ADD CONSTRAINT fk_img_incidencia FOREIGN KEY (incidencia_id) REFERENCES Incidencia(incidencia_id) ON DELETE CASCADE ON UPDATE CASCADE;
