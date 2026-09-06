-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V6:
-- CONFIGURAR PERMISOS POR ROL
-- =====================================================

-- =====================================================
-- AJUSTAR RELACIÓN ROL-PERMISO
-- =====================================================

ALTER TABLE rol_permiso

    MODIFY COLUMN rol_id
        INT NOT NULL,

    MODIFY COLUMN permiso_id
        INT NOT NULL,

    ADD CONSTRAINT uk_rol_permiso
        UNIQUE (rol_id, permiso_id);

-- =====================================================
-- CREAR PERMISOS
-- =====================================================

INSERT INTO permisos (nombre)
VALUES
    ('VER_USUARIOS'),
    ('CREAR_USUARIOS'),
    ('EDITAR_USUARIOS'),
    ('ELIMINAR_USUARIOS'),
    ('GESTIONAR_HORARIOS'),
    ('CREAR_SOLICITUD_CAMBIO'),
    ('VER_SOLICITUDES_PROPIAS'),
    ('VER_SOLICITUDES_PENDIENTES'),
    ('RESOLVER_SOLICITUDES'),
    ('GENERAR_QR');

-- =====================================================
-- PERMISOS DEL ADMINISTRADOR
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
WHERE LOWER(r.nombre) = 'admin'
  AND p.nombre IN (
      'VER_USUARIOS',
      'CREAR_USUARIOS',
      'EDITAR_USUARIOS',
      'ELIMINAR_USUARIOS',
      'GESTIONAR_HORARIOS',
      'VER_SOLICITUDES_PENDIENTES',
      'GENERAR_QR'
  );

-- =====================================================
-- PERMISOS DE RECURSOS HUMANOS
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
WHERE LOWER(r.nombre) = 'rrhh'
  AND p.nombre IN (
      'VER_USUARIOS',
      'GESTIONAR_HORARIOS',
      'VER_SOLICITUDES_PENDIENTES',
      'RESOLVER_SOLICITUDES'
  );

-- =====================================================
-- PERMISOS DEL SUPERVISOR
-- =====================================================
--
-- Puede crear solicitudes propias.
-- Puede resolver solicitudes de empleados.
-- No podrá resolver sus propias solicitudes.
-- Las solicitudes propias serán resueltas por RRHH.
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
WHERE LOWER(r.nombre) = 'supervisor'
  AND p.nombre IN (
      'GESTIONAR_HORARIOS',
      'CREAR_SOLICITUD_CAMBIO',
      'VER_SOLICITUDES_PROPIAS',
      'VER_SOLICITUDES_PENDIENTES',
      'RESOLVER_SOLICITUDES',
      'GENERAR_QR'
  );

-- =====================================================
-- PERMISOS DEL EMPLEADO
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
WHERE LOWER(r.nombre) = 'empleado'
  AND p.nombre IN (
      'CREAR_SOLICITUD_CAMBIO',
      'VER_SOLICITUDES_PROPIAS'
  );