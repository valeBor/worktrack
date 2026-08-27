-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V3:
-- COMPLETAR SOLICITUDES DE CAMBIO DE HORARIO
-- =====================================================
-- =====================================================
-- QUITAR TEMPORALMENTE LA CLAVE FORÁNEA EXISTENTE
-- =====================================================

ALTER TABLE solicitudes
    DROP FOREIGN KEY fk_solicitudes_usuario;

-- =====================================================
-- RENOMBRAR Y AJUSTAR COLUMNAS EXISTENTES
-- =====================================================

ALTER TABLE solicitudes

    MODIFY COLUMN usuario_id
        INT NOT NULL,

    MODIFY COLUMN tipo
        VARCHAR(50) NOT NULL
        DEFAULT 'CAMBIO_HORARIO',

    MODIFY COLUMN estado
        ENUM(
            'PENDIENTE',
            'APROBADA',
            'RECHAZADA'
        ) NOT NULL
        DEFAULT 'PENDIENTE',

    CHANGE COLUMN fecha
        fecha_solicitada
        DATE NOT NULL,

    CHANGE COLUMN hora_inicio
        hora_entrada_solicitada
        TIME NOT NULL,

    CHANGE COLUMN hora_fin
        hora_salida_solicitada
        TIME NOT NULL;


-- =====================================================
-- DATOS DEL HORARIO VIGENTE AL CREAR LA SOLICITUD
-- =====================================================

ALTER TABLE solicitudes

    ADD COLUMN hora_entrada_actual
        TIME NOT NULL
        AFTER fecha_solicitada,

    ADD COLUMN hora_salida_actual
        TIME NOT NULL
        AFTER hora_entrada_actual,

    ADD COLUMN modalidad_actual
        ENUM(
            'PRESENCIAL',
            'HOME'
        ) NOT NULL
        AFTER hora_salida_actual,

    ADD COLUMN tolerancia_actual
        INT NOT NULL
        AFTER modalidad_actual;


-- =====================================================
-- MOTIVO Y FECHA DE CREACIÓN
-- =====================================================

ALTER TABLE solicitudes

    ADD COLUMN motivo
        VARCHAR(500) NOT NULL
        AFTER hora_salida_solicitada,

    ADD COLUMN creada_en
        DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        AFTER motivo;


-- =====================================================
-- DATOS DE APROBACIÓN O RECHAZO
-- =====================================================

ALTER TABLE solicitudes

    ADD COLUMN respuesta
        VARCHAR(500) DEFAULT NULL
        AFTER creada_en,

    ADD COLUMN resuelto_por
        INT DEFAULT NULL
        AFTER respuesta,

    ADD COLUMN resuelta_en
        DATETIME DEFAULT NULL
        AFTER resuelto_por;


-- =====================================================
-- ÍNDICES
-- =====================================================

ALTER TABLE solicitudes

    ADD INDEX idx_solicitudes_estado_fecha (
        estado,
        fecha_solicitada
    ),

    ADD INDEX idx_solicitudes_usuario_fecha (
        usuario_id,
        fecha_solicitada
    ),

    ADD INDEX idx_solicitudes_resuelto_por (
        resuelto_por
    );


-- =====================================================
-- CLAVES FORÁNEAS
-- =====================================================

ALTER TABLE solicitudes

    ADD CONSTRAINT fk_solicitudes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    ADD CONSTRAINT fk_solicitudes_resuelto_por
        FOREIGN KEY (resuelto_por)
        REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

-- =====================================================
-- VALIDACIONES DE DATOS
-- =====================================================

ALTER TABLE solicitudes

    ADD CONSTRAINT chk_solicitudes_tolerancia
        CHECK (
            tolerancia_actual
            BETWEEN 0 AND 240
        ),

    ADD CONSTRAINT chk_solicitudes_horario_actual
        CHECK (
            hora_entrada_actual
            < hora_salida_actual
        ),

    ADD CONSTRAINT chk_solicitudes_horario_solicitado
        CHECK (
            hora_entrada_solicitada
            < hora_salida_solicitada
        );