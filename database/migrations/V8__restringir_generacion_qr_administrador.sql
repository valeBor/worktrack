-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V8:
-- RESTRINGIR GENERACIÓN DE QR AL ADMINISTRADOR
-- =====================================================

-- =====================================================
-- RETIRAR EL PERMISO A ROLES NO ADMINISTRADORES
-- =====================================================

DELETE rp
FROM rol_permiso rp
INNER JOIN roles r
    ON r.id = rp.rol_id
INNER JOIN permisos p
    ON p.id = rp.permiso_id
WHERE UPPER(TRIM(p.nombre)) = 'GENERAR_QR'
  AND LOWER(TRIM(r.nombre)) <> 'admin';

-- =====================================================
-- GARANTIZAR EL PERMISO DEL ADMINISTRADOR
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
WHERE LOWER(TRIM(r.nombre)) = 'admin'
  AND UPPER(TRIM(p.nombre)) = 'GENERAR_QR'
  AND NOT EXISTS (
      SELECT 1
      FROM rol_permiso rp
      WHERE rp.rol_id = r.id
        AND rp.permiso_id = p.id
  );