USE worktrack;

-- ROLES
INSERT IGNORE INTO roles (id, nombre) VALUES
(1, 'admin'),
(2, 'supervisor'),
(3, 'empleado'),
(4, 'rrhh');

-- ADMIN
INSERT IGNORE INTO usuarios (nombre, apellido, email, password, estado, rol_id)
VALUES ('Admin', 'Principal', 'admin@test.com', '123456', 1, 1);