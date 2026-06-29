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

-- Cliente genérico para ventas de mostrador sin identificación (SUNAT: "Clientes Varios")
INSERT IGNORE INTO Cliente (nombres, apellidos, dni_ruc, activo)
VALUES ('Clientes', 'Varios', '00000000', 1);