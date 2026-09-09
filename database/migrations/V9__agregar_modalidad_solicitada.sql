-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V9:
-- AGREGAR MODALIDAD SOLICITADA
-- =====================================================

-- =====================================================
-- AGREGAR COLUMNA TEMPORALMENTE PERMITIENDO NULL
-- =====================================================

ALTER TABLE solicitudes

    ADD COLUMN modalidad_solicitada
        ENUM(
            'PRESENCIAL',
            'HOME'
        )
        DEFAULT NULL
        AFTER hora_salida_solicitada;


-- =====================================================
-- CONSERVAR LAS SOLICITUDES EXISTENTES
-- =====================================================
--
-- Las solicitudes anteriores no permitían cambiar
-- la modalidad. Por eso se conserva su modalidad actual.
-- =====================================================

UPDATE solicitudes

SET modalidad_solicitada =
    modalidad_actual

WHERE modalidad_solicitada IS NULL;


-- =====================================================
-- HACER OBLIGATORIA LA MODALIDAD SOLICITADA
-- =====================================================

ALTER TABLE solicitudes

    MODIFY COLUMN modalidad_solicitada
        ENUM(
            'PRESENCIAL',
            'HOME'
        )
        NOT NULL
        AFTER hora_salida_solicitada;