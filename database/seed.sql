USE worktrack;

-- ROLES
INSERT IGNORE INTO roles (id, nombre) VALUES
(1, 'admin'),
(2, 'supervisor'),
(3, 'empleado'),
(4, 'rrhh');

-- ADMIN
INSERT IGNORE INTO usuarios (nombre, apellido, email, password, estado, rol_id)
VALUES ('Admin', 'Principal', 'admin@test.com', '$2b$10$sdOcuE54S8GBoD61B0yH8ekfRRnSz9oFSiZpJ9ty30KR41/v3RCkW', 1, 1);