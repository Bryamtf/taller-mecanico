-- Datos iniciales
INSERT INTO Usuario (username, email, password_hash, nombre_completo, rol_id, activo) VALUES
('admin', 'admin@autonort.com', '$2b$10$DxEyarz8DOdwSKOdkPJqn.eojH4Vyqb/LHVgW/I68nDkczIVzjK8q', 'Administrador Principal', 1, 1),-- Taller123
('gerente', 'gerente@autonort.com', '$2b$10$YDuDgiVQgQGkMUAC1zWNledLdspFkFUD8G./aI4qhDe0X2XiqJ7oa', 'Gerente General', 1, 1),--gerente123
('asesor1', 'asesor1@autonort.com', '$2b$10$Xg5ToGqRRDpYwA2HryyhCekg6LfbIVxku05C..zSP8LtMCoWjlzW.', 'Asesor de Servicios', 3, 1);-- asesor123
