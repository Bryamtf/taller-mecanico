-- Datos iniciales
INSERT INTO Usuario (username, email, password_hash, nombre_completo, rol_id, activo) VALUES
('admin', 'admin@autonort.com', '$2b$10$DxEyarz8DOdwSKOdkPJqn.eojH4Vyqb/LHVgW/I68nDkczIVzjK8q', 'Administrador Principal', 1, 1),-- Taller123
('gerente', 'gerente@autonort.com', '$2b$10$YDuDgiVQgQGkMUAC1zWNledLdspFkFUD8G./aI4qhDe0X2XiqJ7oa', 'Gerente General', 1, 1),--gerente123
('asesor1', 'asesor1@autonort.com', '$2b$10$Xg5ToGqRRDpYwA2HryyhCekg6LfbIVxku05C..zSP8LtMCoWjlzW.', 'Asesor de Servicios', 3, 1);-- asesor123


--Sebastian: agregando usuarios:
-- Insertar Usuario 1: Admin
INSERT INTO Usuario (username, email, password_hash, nombre_completo, rol_id, activo) 
VALUES (
    'admin', 
    'admin@autonort.com', 
    '$2b$10$DxEyarz8DOdwSKOdkPJqn.eojH4Vyqb/LHVgW/I68nDkczIVzjK8q', 
    'Administrador', 
    1, 
    1
);-- Taller123

-- Insertar Usuario 2: Gerente
INSERT INTO Usuario (username, email, password_hash, nombre_completo, rol_id, activo) 
VALUES (
    'gerente', 
    'gerente@autonort.com', 
    '$2b$10$DxEyarz8DOdwSKOdkPJqn.eojH4Vyqb/LHVgW/I68nDkczIVzjK8q', 
    'Gerente General',
    1, 
    1
);-- Taller123

--  Datos de Correlativo
INSERT INTO Correlativo_Cotizacion (anio, ultimo_numero) 
VALUES (2026, 0)
ON DUPLICATE KEY UPDATE anio = anio;

-- añadido por Sebastián para features del Front
-- Rol supremo para administracion completa del modulo de Usuarios y Roles.
-- Ejecutar manualmente en phpMyAdmin despues del bloque de schema.sql que agrega Usuario.eliminado.
INSERT INTO Rol (nombre, descripcion, activo)
VALUES ('super_admin', 'Acceso supremo al sistema y usuarios desactivados', 1)
ON DUPLICATE KEY UPDATE
  descripcion = VALUES(descripcion),
  activo = 1;

INSERT INTO Rol_permiso
  (rol_id, permiso_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.rol_id, p.permiso_id, 1, 1, 1, 1
FROM Rol r
JOIN Permiso p
WHERE r.nombre = 'super_admin'
ON DUPLICATE KEY UPDATE
  puede_ver = VALUES(puede_ver),
  puede_crear = VALUES(puede_crear),
  puede_editar = VALUES(puede_editar),
  puede_eliminar = VALUES(puede_eliminar);

UPDATE Usuario u
JOIN Rol r ON r.nombre = 'super_admin'
SET
  u.rol_id = r.rol_id,
  u.activo = 1,
  u.eliminado = 0
WHERE u.username = 'admin';
