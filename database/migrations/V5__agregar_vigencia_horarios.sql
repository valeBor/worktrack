-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V5:
-- AGREGAR VIGENCIA HISTÓRICA A LOS HORARIOS
-- =====================================================

-- =====================================================
-- AGREGAR COLUMNAS TEMPORALMENTE PERMITIENDO NULL
-- =====================================================

ALTER TABLE horarios

    ADD COLUMN vigente_desde
        DATE DEFAULT NULL
        AFTER modalidad,

    ADD COLUMN vigente_hasta
        DATE DEFAULT NULL
        AFTER vigente_desde;

-- =====================================================
-- ASIGNAR FECHA INICIAL A LOS HORARIOS EXISTENTES
-- =====================================================
--
-- Los cronogramas anteriores a esta migración no
-- conservaban su fecha de creación.
--
-- Se establece el 03/09/2026 como punto inicial
-- conocido para los datos existentes de desarrollo.
-- =====================================================

UPDATE horarios
SET vigente_desde = '2026-09-03'
WHERE vigente_desde IS NULL;

-- =====================================================
-- HACER OBLIGATORIA LA FECHA DE INICIO
-- =====================================================

ALTER TABLE horarios

    MODIFY COLUMN vigente_desde
        DATE NOT NULL;

-- =====================================================
-- ÍNDICE PARA CONSULTAR HORARIOS POR FECHA
-- =====================================================

ALTER TABLE horarios

    ADD INDEX idx_horarios_usuario_dia_vigencia (
        usuario_id,
        dia_semana,
        vigente_desde,
        vigente_hasta
    );

-- =====================================================
-- VALIDAR EL RANGO DE VIGENCIA
-- =====================================================

ALTER TABLE horarios

    ADD CONSTRAINT chk_horarios_vigencia
        CHECK (
            vigente_hasta IS NULL
            OR vigente_hasta >= vigente_desde
        );