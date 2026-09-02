-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V4:
-- CONTROL DE INTENTOS FALLIDOS DE LOGIN
-- =====================================================


-- =====================================================
-- AGREGAR CAMPOS DE SEGURIDAD A USUARIOS
-- =====================================================

ALTER TABLE usuarios

    ADD COLUMN intentos_fallidos
        TINYINT UNSIGNED NOT NULL
        DEFAULT 0
        AFTER estado,

    ADD COLUMN cuenta_bloqueada
        TINYINT(1) NOT NULL
        DEFAULT 0
        AFTER intentos_fallidos;


-- =====================================================
-- VALIDACIONES
-- =====================================================

ALTER TABLE usuarios

    ADD CONSTRAINT chk_usuarios_intentos_fallidos
        CHECK (
            intentos_fallidos
            BETWEEN 0 AND 5
        ),

    ADD CONSTRAINT chk_usuarios_cuenta_bloqueada
        CHECK (
            cuenta_bloqueada
            IN (0, 1)
        );