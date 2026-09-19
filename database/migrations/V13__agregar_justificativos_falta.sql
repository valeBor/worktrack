-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V13:
-- JUSTIFICACIONES DE INASISTENCIA Y ARCHIVOS PRIVADOS
-- =====================================================

-- =====================================================
-- TIPOS DE JUSTIFICACIÓN
-- Permite agregar nuevas licencias sin alterar solicitudes
-- =====================================================

CREATE TABLE tipos_justificativo (
    id INT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    requiere_archivo TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_tipos_justificativo_codigo (codigo),

    CONSTRAINT chk_tipos_justificativo_requiere_archivo
        CHECK (requiere_archivo IN (0, 1)),

    CONSTRAINT chk_tipos_justificativo_activo
        CHECK (activo IN (0, 1))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

INSERT INTO tipos_justificativo (
    codigo,
    nombre,
    requiere_archivo
)
VALUES
    (
        'CERTIFICADO_MEDICO',
        'Certificado médico',
        1
    ),
    (
        'CERTIFICADO_ESTUDIO',
        'Certificado de estudio',
        1
    ),
    (
        'EMERGENCIA_FAMILIAR',
        'Emergencia familiar',
        0
    ),
    (
        'OTRO',
        'Otro motivo',
        0
    );

-- =====================================================
-- ADAPTAR SOLICITUDES PARA MÁS DE UN TIPO
-- motivo se conserva NOT NULL y se utiliza como descripción
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

    ADD COLUMN fecha_inasistencia
        DATE NULL
        AFTER motivo,

    ADD COLUMN tipo_justificativo_id
        INT NULL
        AFTER fecha_inasistencia;

-- =====================================================
-- RELACIÓN CON EL TIPO DE JUSTIFICACIÓN
-- =====================================================

ALTER TABLE solicitudes
    ADD CONSTRAINT fk_solicitudes_tipo_justificativo
        FOREIGN KEY (tipo_justificativo_id)
        REFERENCES tipos_justificativo(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

-- =====================================================
-- ÍNDICES PARA BÚSQUEDA Y CONTROL DE DUPLICADOS
-- =====================================================

ALTER TABLE solicitudes
    ADD INDEX idx_solicitudes_tipo_estado (
        tipo,
        estado
    ),

    ADD INDEX idx_solicitudes_usuario_inasistencia (
        usuario_id,
        fecha_inasistencia,
        tipo,
        estado
    ),

    ADD INDEX idx_solicitudes_tipo_justificativo (
        tipo_justificativo_id
    );

-- =====================================================
-- DATOS OBLIGATORIOS SEGÚN EL TIPO DE SOLICITUD
-- =====================================================

ALTER TABLE solicitudes
    ADD CONSTRAINT chk_solicitudes_tipo_soportado
        CHECK (
            tipo IN (
                'CAMBIO_HORARIO',
                'JUSTIFICACION_INASISTENCIA'
            )
        ),

    ADD CONSTRAINT chk_solicitudes_datos_por_tipo
        CHECK (
            (
                tipo = 'CAMBIO_HORARIO'
                AND fecha_solicitada IS NOT NULL
                AND hora_entrada_actual IS NOT NULL
                AND hora_salida_actual IS NOT NULL
                AND modalidad_actual IS NOT NULL
                AND tolerancia_actual IS NOT NULL
                AND hora_entrada_solicitada IS NOT NULL
                AND hora_salida_solicitada IS NOT NULL
                AND modalidad_solicitada IS NOT NULL
                AND fecha_inasistencia IS NULL
                AND tipo_justificativo_id IS NULL
            )
            OR
            (
                tipo = 'JUSTIFICACION_INASISTENCIA'
                AND fecha_solicitada IS NULL
                AND hora_entrada_actual IS NULL
                AND hora_salida_actual IS NULL
                AND modalidad_actual IS NULL
                AND tolerancia_actual IS NULL
                AND hora_entrada_solicitada IS NULL
                AND hora_salida_solicitada IS NULL
                AND modalidad_solicitada IS NULL
                AND fecha_inasistencia IS NOT NULL
                AND tipo_justificativo_id IS NOT NULL
            )
        );

-- =====================================================
-- ARCHIVOS PRIVADOS ASOCIADOS A SOLICITUDES
-- No se guardan URLs públicas
-- =====================================================

CREATE TABLE solicitud_archivos (
    id INT NOT NULL AUTO_INCREMENT,
    solicitud_id INT NOT NULL,
    storage_provider VARCHAR(30) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    extension VARCHAR(10) NOT NULL,
    tamanio_bytes INT UNSIGNED NOT NULL,
    sha256 CHAR(64) NOT NULL,
    creado_por INT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_solicitud_archivos_storage_key (
        storage_key
    ),

    INDEX idx_solicitud_archivos_solicitud (
        solicitud_id
    ),

    INDEX idx_solicitud_archivos_creado_por (
        creado_por
    ),

    CONSTRAINT fk_solicitud_archivos_solicitud
        FOREIGN KEY (solicitud_id)
        REFERENCES solicitudes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_solicitud_archivos_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_solicitud_archivos_tamanio
        CHECK (
            tamanio_bytes > 0
            AND tamanio_bytes <= 5242880
        ),

    CONSTRAINT chk_solicitud_archivos_extension
        CHECK (
            extension IN (
                'jpg',
                'jpeg',
                'png',
                'pdf'
            )
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =====================================================
-- AUDITORÍA DE ACCESO A DOCUMENTOS
-- =====================================================

CREATE TABLE solicitud_archivo_accesos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    archivo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    accion ENUM(
        'VISUALIZACION',
        'DESCARGA'
    ) NOT NULL,
    ip_actor VARCHAR(45) NULL,
    accedido_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_archivo_accesos_archivo_fecha (
        archivo_id,
        accedido_en
    ),

    INDEX idx_archivo_accesos_usuario_fecha (
        usuario_id,
        accedido_en
    ),

    CONSTRAINT fk_archivo_accesos_archivo
        FOREIGN KEY (archivo_id)
        REFERENCES solicitud_archivos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_archivo_accesos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- =====================================================
-- PERMISOS
-- =====================================================

INSERT INTO permisos (nombre)
SELECT 'CREAR_JUSTIFICATIVO_FALTA'
WHERE NOT EXISTS (
    SELECT 1
    FROM permisos
    WHERE nombre = 'CREAR_JUSTIFICATIVO_FALTA'
);

INSERT INTO permisos (nombre)
SELECT 'VER_ARCHIVO_JUSTIFICATIVO'
WHERE NOT EXISTS (
    SELECT 1
    FROM permisos
    WHERE nombre = 'VER_ARCHIVO_JUSTIFICATIVO'
);

-- Empleado y Supervisor pueden presentar justificativos.

INSERT INTO rol_permiso (
    rol_id,
    permiso_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permisos p
    ON p.nombre = 'CREAR_JUSTIFICATIVO_FALTA'
WHERE LOWER(r.nombre) IN (
    'empleado',
    'supervisor'
)
AND NOT EXISTS (
    SELECT 1
    FROM rol_permiso rp
    WHERE rp.rol_id = r.id
      AND rp.permiso_id = p.id
);

-- Todos los roles podrán llegar a solicitar una descarga,
-- pero el backend controlará el alcance sobre cada archivo.

INSERT INTO rol_permiso (
    rol_id,
    permiso_id
)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permisos p
    ON p.nombre = 'VER_ARCHIVO_JUSTIFICATIVO'
WHERE LOWER(r.nombre) IN (
    'empleado',
    'supervisor',
    'rrhh',
    'admin'
)
AND NOT EXISTS (
    SELECT 1
    FROM rol_permiso rp
    WHERE rp.rol_id = r.id
      AND rp.permiso_id = p.id
);