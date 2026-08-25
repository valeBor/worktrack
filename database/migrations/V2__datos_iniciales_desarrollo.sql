-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V2: DATOS INICIALES DE DESARROLLO
-- =====================================================


-- =====================================================
-- ROLES
-- =====================================================

INSERT INTO roles (
    id,
    nombre
)
VALUES
    (1, 'admin'),
    (2, 'supervisor'),
    (3, 'empleado'),
    (4, 'rrhh');


-- =====================================================
-- USUARIOS DE PRUEBA
-- Contraseña para todos: WorkTrack2026!
-- =====================================================

INSERT INTO usuarios (
    id,
    nombre,
    apellido,
    email,
    password,
    estado,
    rol_id
)
VALUES
(
    1,
    'Administrador',
    'WorkTrack',
    'admin@worktrack.test',
    '$2b$10$4nvTERVjRtXCQ9tsm77xpuGkwUx1hxW6QpOFDKruno/FdiRPjOJXi',
    1,
    1
),
(
    2,
    'Supervisor',
    'WorkTrack',
    'supervisor@worktrack.test',
    '$2b$10$4nvTERVjRtXCQ9tsm77xpuGkwUx1hxW6QpOFDKruno/FdiRPjOJXi',
    1,
    2
),
(
    3,
    'Empleado',
    'WorkTrack',
    'empleado@worktrack.test',
    '$2b$10$4nvTERVjRtXCQ9tsm77xpuGkwUx1hxW6QpOFDKruno/FdiRPjOJXi',
    1,
    3
),
(
    4,
    'Recursos Humanos',
    'WorkTrack',
    'rrhh@worktrack.test',
    '$2b$10$4nvTERVjRtXCQ9tsm77xpuGkwUx1hxW6QpOFDKruno/FdiRPjOJXi',
    1,
    4
);


-- =====================================================
-- REDES AUTORIZADAS DE DESARROLLO
-- LOCALHOST SE UTILIZA PARA LAS PRUEBAS LOCALES
-- =====================================================

INSERT INTO redes_autorizadas (
    id,
    nombre,
    tipo,
    ip_rango,
    estado
)
VALUES
(
    1,
    'Red local de desarrollo',
    'LOCAL',
    '127.0.0.1/32',
    1
),
(
    2,
    'VPN simulada de desarrollo',
    'VPN',
    '127.0.0.1/32',
    1
);


-- =====================================================
-- HORARIOS DEL SUPERVISOR
-- Modalidad PRESENCIAL durante toda la semana
-- Permite probar el registro mediante QR y red LOCAL
-- =====================================================

INSERT INTO horarios (
    usuario_id,
    hora_entrada,
    hora_salida,
    dia_semana,
    tolerancia_minutos,
    modalidad
)
VALUES
    (2, '00:00:00', '23:59:59', 'lunes',    10, 'PRESENCIAL'),
    (2, '00:00:00', '23:59:59', 'martes',   10, 'PRESENCIAL'),
    (2, '00:00:00', '23:59:59', 'miercoles',10, 'PRESENCIAL'),
    (2, '00:00:00', '23:59:59', 'jueves',   10, 'PRESENCIAL'),
    (2, '00:00:00', '23:59:59', 'viernes',  10, 'PRESENCIAL'),
    (2, '00:00:00', '23:59:59', 'sabado',   10, 'PRESENCIAL'),
    (2, '00:00:00', '23:59:59', 'domingo',  10, 'PRESENCIAL');


-- =====================================================
-- HORARIOS DEL EMPLEADO
-- Modalidad HOME durante toda la semana
-- Permite probar el registro sin QR y con VPN
-- =====================================================

INSERT INTO horarios (
    usuario_id,
    hora_entrada,
    hora_salida,
    dia_semana,
    tolerancia_minutos,
    modalidad
)
VALUES
    (3, '00:00:00', '23:59:59', 'lunes',    10, 'HOME'),
    (3, '00:00:00', '23:59:59', 'martes',   10, 'HOME'),
    (3, '00:00:00', '23:59:59', 'miercoles',10, 'HOME'),
    (3, '00:00:00', '23:59:59', 'jueves',   10, 'HOME'),
    (3, '00:00:00', '23:59:59', 'viernes',  10, 'HOME'),
    (3, '00:00:00', '23:59:59', 'sabado',   10, 'HOME'),
    (3, '00:00:00', '23:59:59', 'domingo',  10, 'HOME');