-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V11:
-- AMPLIAR NOTIFICACIONES Y CONFIGURAR PERMISOS
-- =====================================================

-- =====================================================
-- NORMALIZAR DATOS ANTERIORES
-- =====================================================
--
-- La tabla existe desde V1, pero todavía no era utilizada
-- por el backend. Se eliminan registros sin destinatario,
-- porque una notificación siempre debe pertenecer a un
-- usuario concreto.
-- =====================================================

DELETE FROM notificaciones
WHERE usuario_id IS NULL;

UPDATE notificaciones
SET mensaje = 'Notificación del sistema'
WHERE mensaje IS NULL
   OR TRIM(mensaje) = '';

UPDATE notificaciones
SET leido = 0
WHERE leido IS NULL;

UPDATE notificaciones
SET fecha = CURDATE()
WHERE fecha IS NULL;

-- =====================================================
-- CAMBIAR FECHA POR FECHA Y HORA DE CREACIÓN
-- =====================================================

ALTER TABLE notificaciones
    CHANGE COLUMN fecha
        creada_en DATETIME
        NULL
        DEFAULT CURRENT_TIMESTAMP;

-- =====================================================
-- AGREGAR INFORMACIÓN DEL EVENTO
-- =====================================================

ALTER TABLE notificaciones
    ADD COLUMN actor_id
        INT DEFAULT NULL
        AFTER usuario_id,

    ADD COLUMN tipo
        VARCHAR(50) DEFAULT NULL
        AFTER actor_id,

    ADD COLUMN titulo
        VARCHAR(150) DEFAULT NULL
        AFTER tipo,

    ADD COLUMN entidad_tipo
        VARCHAR(30) DEFAULT NULL
        AFTER mensaje,

    ADD COLUMN entidad_id
        INT DEFAULT NULL
        AFTER entidad_tipo,

    ADD COLUMN leida_en
        DATETIME DEFAULT NULL
        AFTER creada_en;

-- =====================================================
-- COMPLETAR POSIBLES NOTIFICACIONES ANTERIORES
-- =====================================================

UPDATE notificaciones
SET
    tipo = 'SISTEMA',
    titulo = 'Notificación del sistema'
WHERE tipo IS NULL
   OR titulo IS NULL;

UPDATE notificaciones
SET leida_en = creada_en
WHERE leido = 1
  AND leida_en IS NULL;

-- =====================================================
-- ESTABLECER CAMPOS OBLIGATORIOS
-- =====================================================

ALTER TABLE notificaciones
    MODIFY COLUMN usuario_id
        INT NOT NULL,

    MODIFY COLUMN tipo
        VARCHAR(50) NOT NULL,

    MODIFY COLUMN titulo
        VARCHAR(150) NOT NULL,

    MODIFY COLUMN mensaje
        TEXT NOT NULL,

    MODIFY COLUMN leido
        TINYINT(1) NOT NULL
        DEFAULT 0,

    MODIFY COLUMN creada_en
        DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP;

-- =====================================================
-- ÍNDICES
-- =====================================================

ALTER TABLE notificaciones
    ADD INDEX idx_notificaciones_usuario_leido_fecha (
        usuario_id,
        leido,
        creada_en
    ),

    ADD INDEX idx_notificaciones_actor (
        actor_id
    ),

    ADD INDEX idx_notificaciones_entidad (
        entidad_tipo,
        entidad_id
    );

-- =====================================================
-- CLAVE FORÁNEA DEL ACTOR
-- =====================================================
--
-- actor_id identifica al usuario que originó el evento.
-- Puede quedar NULL si el evento fue generado directamente
-- por el sistema.
-- =====================================================

ALTER TABLE notificaciones
    ADD CONSTRAINT fk_notificaciones_actor
        FOREIGN KEY (actor_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

-- =====================================================
-- VALIDACIONES DE INTEGRIDAD
-- =====================================================

ALTER TABLE notificaciones
    ADD CONSTRAINT chk_notificaciones_leido
        CHECK (
            leido IN (0, 1)
        ),

    ADD CONSTRAINT chk_notificaciones_entidad
        CHECK (
            (
                entidad_tipo IS NULL
                AND entidad_id IS NULL
            )
            OR
            (
                entidad_tipo IS NOT NULL
                AND entidad_id IS NOT NULL
                AND entidad_id > 0
            )
        );

-- =====================================================
-- CREAR PERMISOS
-- =====================================================

INSERT INTO permisos (nombre)
VALUES
    ('VER_NOTIFICACIONES_PROPIAS'),
    ('MARCAR_NOTIFICACIONES_PROPIAS'),
    ('VER_ALERTAS');

-- =====================================================
-- ASIGNAR PERMISOS A TODOS LOS ROLES
-- =====================================================
--
-- Todos los usuarios pueden consultar y marcar sus
-- propias notificaciones.
--
-- Todos pueden consultar alertas, pero el backend
-- determinará el alcance correspondiente a cada rol.
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
AND p.nombre IN (
    'VER_NOTIFICACIONES_PROPIAS',
    'MARCAR_NOTIFICACIONES_PROPIAS',
    'VER_ALERTAS'
);