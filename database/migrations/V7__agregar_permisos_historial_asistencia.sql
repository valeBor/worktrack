-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V7:
-- PERMISOS PARA HISTORIAL DE ASISTENCIA
-- =====================================================

-- =====================================================
-- CREAR PERMISOS
-- =====================================================

INSERT INTO permisos (nombre)
VALUES
    ('VER_HISTORIAL_PROPIO'),
    ('VER_HISTORIAL_GESTIONADO');

-- =====================================================
-- HISTORIAL PROPIO
-- Todos los roles pueden consultar su historial.
-- =====================================================

INSERT INTO rol_permiso (
    rol_id,
    permiso_id
)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permisos p
WHERE LOWER(r.nombre) IN (
    'admin',
    'rrhh',
    'supervisor',
    'empleado'
)
AND p.nombre = 'VER_HISTORIAL_PROPIO';

-- =====================================================
-- HISTORIAL DE OTROS USUARIOS
-- admin:
-- Puede consultar a todos.
--
-- rrhh:
-- Puede consultar a todos.
--
-- supervisor:
-- Puede consultar empleados.
--
-- El alcance concreto será validado por el servicio.
-- =====================================================

INSERT INTO rol_permiso (
    rol_id,
    permiso_id
)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permisos p
WHERE LOWER(r.nombre) IN (
    'admin',
    'rrhh',
    'supervisor'
)
AND p.nombre = 'VER_HISTORIAL_GESTIONADO';