-- =====================================================
-- WORKTRACK - V12: REGISTRO MANUAL DE ASISTENCIA
-- =====================================================

-- Una asistencia por usuario y fecha.
-- Este cambio se ejecuta primero: si hubiera datos
-- incompatibles, la migración se detiene aquí.
ALTER TABLE asistencia
    MODIFY COLUMN usuario_id INT NOT NULL,
    MODIFY COLUMN fecha DATE NOT NULL DEFAULT CURDATE(),
    ADD CONSTRAINT uk_asistencia_usuario_fecha
        UNIQUE (usuario_id, fecha);

-- La modalidad sigue guardada en tipo_asistencia.
-- Estas columnas indican cómo se registró cada marcación.
ALTER TABLE asistencia
    ADD COLUMN origen_entrada
        ENUM('QR', 'HOME', 'MANUAL') NULL
        AFTER estado,
    ADD COLUMN origen_salida
        ENUM('QR', 'HOME', 'MANUAL') NULL
        AFTER origen_entrada;

-- Identificar las marcaciones existentes.
UPDATE asistencia
SET origen_entrada = CASE
    WHEN tipo_asistencia = 'HOME' THEN 'HOME'
    ELSE 'QR'
END
WHERE hora_entrada IS NOT NULL;

UPDATE asistencia
SET origen_salida = CASE
    WHEN tipo_asistencia = 'HOME' THEN 'HOME'
    ELSE 'QR'
END
WHERE hora_salida IS NOT NULL;

-- Un evento por cada operación manual.
-- Las horas y el horario aplicado quedan conservados
-- aunque el cronograma cambie posteriormente.
CREATE TABLE asistencia_auditoria (
    id INT NOT NULL AUTO_INCREMENT,
    asistencia_id INT NOT NULL,
    usuario_id INT NOT NULL,
    realizado_por INT NOT NULL,
    accion VARCHAR(30) NOT NULL,
    contingencia VARCHAR(40) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada_anterior TIME NULL,
    hora_salida_anterior TIME NULL,
    hora_entrada_nueva TIME NOT NULL,
    hora_salida_nueva TIME NULL,
    estado_anterior VARCHAR(20) NULL,
    estado_nuevo VARCHAR(20) NOT NULL,
    modalidad VARCHAR(20) NOT NULL,
    horario_entrada TIME NOT NULL,
    horario_salida TIME NOT NULL,
    tolerancia_minutos INT NOT NULL,
    origen_horario VARCHAR(30) NOT NULL,
    solicitud_cambio_id INT NULL,
    ip_actor VARCHAR(45) NULL,
    registrada_en DATETIME NOT NULL,

    PRIMARY KEY (id),
    INDEX idx_auditoria_asistencia (asistencia_id),
    INDEX idx_auditoria_usuario_fecha (usuario_id, fecha),
    INDEX idx_auditoria_actor (realizado_por),

    CONSTRAINT fk_auditoria_asistencia
        FOREIGN KEY (asistencia_id)
        REFERENCES asistencia(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_auditoria_actor
        FOREIGN KEY (realizado_por)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;

-- La auditoría admite nuevos eventos, pero no cambios
-- ni eliminaciones de los eventos ya registrados.
CREATE TRIGGER trg_auditoria_asistencia_no_update
BEFORE UPDATE ON asistencia_auditoria
FOR EACH ROW
SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se puede modificar la auditoria de asistencia';

CREATE TRIGGER trg_auditoria_asistencia_no_delete
BEFORE DELETE ON asistencia_auditoria
FOR EACH ROW
SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No se puede eliminar la auditoria de asistencia';

-- Permiso exclusivo para supervisor y RRHH.
INSERT INTO permisos (nombre)
VALUES ('REGISTRAR_ASISTENCIA_MANUAL');

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE LOWER(r.nombre) IN ('supervisor', 'rrhh')
  AND p.nombre = 'REGISTRAR_ASISTENCIA_MANUAL';