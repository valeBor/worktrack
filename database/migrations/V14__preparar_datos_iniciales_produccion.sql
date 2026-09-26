-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V14:
-- PREPARAR DATOS INICIALES PARA PRODUCCIÓN
-- =====================================================
--
-- V1 a V13 ya fueron aplicadas y validadas por Flyway.
-- Esta migración no modifica sus archivos ni checksums.
--
-- Se conservan:
-- - Los cuatro roles.
-- - Los cuatro usuarios de demostración.
-- - Las dos redes autorizadas definidas en V2.
-- - Los permisos y sus relaciones con los roles.
-- - Los tipos de justificativo definidos en V13.
--
-- Se eliminan solamente los cronogramas amplios que V2
-- creó para realizar pruebas durante el desarrollo.
-- =====================================================

START TRANSACTION;

-- =====================================================
-- HORARIOS MOCK DEL SUPERVISOR
-- =====================================================

DELETE FROM horarios
WHERE id BETWEEN 1 AND 7
  AND usuario_id = 2
  AND hora_entrada = '00:00:00'
  AND hora_salida = '23:59:59'
  AND tolerancia_minutos = 10
  AND modalidad = 'PRESENCIAL'
  AND vigente_desde = '2026-09-03'
  AND dia_semana IN (
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
      'domingo'
  );

-- =====================================================
-- HORARIOS MOCK DEL EMPLEADO
-- =====================================================

DELETE FROM horarios
WHERE id BETWEEN 8 AND 14
  AND usuario_id = 3
  AND hora_entrada = '00:00:00'
  AND hora_salida = '23:59:59'
  AND tolerancia_minutos = 10
  AND modalidad = 'HOME'
  AND vigente_desde = '2026-09-03'
  AND dia_semana IN (
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
      'domingo'
  );

COMMIT;