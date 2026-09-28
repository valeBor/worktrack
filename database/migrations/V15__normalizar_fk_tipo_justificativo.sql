-- =====================================================
-- WORKTRACK
-- V15 - NORMALIZAR FK DE TIPO DE JUSTIFICATIVO
-- =====================================================
--
-- MariaDB 10.11 no permite utilizar dentro de una
-- restriccion CHECK una columna que pertenezca a una
-- clave foranea configurada con ON UPDATE CASCADE.
--
-- V13 fue ajustada para que las instalaciones nuevas
-- utilicen ON UPDATE RESTRICT.
--
-- Esta migracion normaliza las bases donde la version
-- original de V13 ya habia sido aplicada.
-- =====================================================

ALTER TABLE solicitudes
    DROP FOREIGN KEY fk_solicitudes_tipo_justificativo;

ALTER TABLE solicitudes
    ADD CONSTRAINT fk_solicitudes_tipo_justificativo
        FOREIGN KEY (
            tipo_justificativo_id
        )
        REFERENCES tipos_justificativo(id)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT;