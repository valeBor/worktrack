-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V10:
-- REPORTES GLOBALES DE ASISTENCIA
-- =====================================================

-- =====================================================
-- CREAR PERMISO
-- =====================================================

INSERT INTO permisos (
    nombre
)
VALUES (
    'VER_REPORTES_ASISTENCIA'
);

-- =====================================================
-- ASIGNAR PERMISO A RRHH Y ADMINISTRADOR
-- =====================================================
--
-- RRHH podrá consultar:
-- - Reporte diario.
-- - Historial global.
-- - Estadísticas de asistencia.
--
-- El administrador podrá consultar los reportes,
-- pero no intervenir en las asistencias.
--
-- Supervisor y empleado no reciben este permiso.
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
    'rrhh',
    'admin'
)
AND p.nombre = 'VER_REPORTES_ASISTENCIA';

-- =====================================================
-- ÍNDICE PARA CONSULTAS DE ASISTENCIA POR FECHA
-- =====================================================
--
-- Los reportes globales buscarán primero por período
-- y después relacionarán cada asistencia con el usuario.
-- =====================================================

ALTER TABLE asistencia

    ADD INDEX idx_asistencia_fecha_usuario (
        fecha,
        usuario_id
    );