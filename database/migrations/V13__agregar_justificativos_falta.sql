-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V12:
-- AGREGAR JUSTIFICATIVOS DE FALTA
-- =====================================================

-- =====================================================
-- AFLOJAR COLUMNAS QUE NO APLICAN A UN JUSTIFICATIVO
-- =====================================================

ALTER TABLE solicitudes

    MODIFY COLUMN fecha_solicitada
        DATE NULL,

    MODIFY COLUMN hora_entrada_actual
        TIME NULL,

    MODIFY COLUMN hora_salida_actual
        TIME NULL,

    MODIFY COLUMN modalidad_actual
        ENUM('PRESENCIAL', 'HOME') NULL,

    MODIFY COLUMN tolerancia_actual
        INT NULL,

    MODIFY COLUMN hora_entrada_solicitada
        TIME NULL,

    MODIFY COLUMN hora_salida_solicitada
        TIME NULL,

    MODIFY COLUMN modalidad_solicitada
        ENUM('PRESENCIAL', 'HOME') NULL,

    MODIFY COLUMN motivo
        VARCHAR(500) NULL;


-- =====================================================
-- COLUMNAS NUEVAS PARA EL JUSTIFICATIVO DE FALTA
-- =====================================================

ALTER TABLE solicitudes

    ADD COLUMN fecha_inasistencia
        DATE NULL
        AFTER motivo,

    ADD COLUMN tipo_justificativo
        ENUM(
            'CERTIFICADO_MEDICO',
            'EMERGENCIA_FAMILIAR',
            'OTRO_MOTIVO'
        ) NULL
        AFTER fecha_inasistencia,

    ADD COLUMN descripcion
        VARCHAR(500) NULL
        AFTER tipo_justificativo,

    ADD COLUMN archivo_url
        VARCHAR(255) NULL
        AFTER descripcion;


-- =====================================================
-- PERMISO PARA CREAR JUSTIFICATIVOS
-- =====================================================

INSERT INTO permisos (nombre)
VALUES ('CREAR_JUSTIFICATIVO_FALTA');

INSERT INTO rol_permiso (
    rol_id,
    permiso_id
)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permisos p
WHERE LOWER(r.nombre) IN ('empleado', 'supervisor')
  AND p.nombre = 'CREAR_JUSTIFICATIVO_FALTA';