const {
  afterEach,
  mock,
  test
} = require('node:test');

const assert =
  require('node:assert/strict');

const db =
  require('../config/db');

const horarioModel =
  require('../models/horario.model');

const asistenciaModel =
  require('../models/asistencia.model');

const solicitudService =
  require('../services/solicitud.service');


// ======================================================
// DATOS DE PRUEBA
// ======================================================

const actorToken = {
  id: 3
};

const actorActivo = {
  id: 3,
  nombre: 'Empleado',
  apellido: 'WorkTrack',
  estado: 1,
  role: 'empleado'
};

const datosJustificativo = {
  fecha_inasistencia:
    '2026-09-28',

  tipo_justificativo:
    'ENFERMEDAD',

  motivo:
    'Inasistencia por enfermedad'
};


// ======================================================
// CREAR CONEXIÓN SIMULADA
// ======================================================

function crearConexionSimulada() {
  const estado = {
    transaccionIniciada: false,
    rollbackEjecutado: false,
    conexionLiberada: false
  };

  const connection = {
    beginTransaction:
      async () => {
        estado.transaccionIniciada =
          true;
      },

    rollback:
      async () => {
        estado.rollbackEjecutado =
          true;
      },

    release:
      () => {
        estado.conexionLiberada =
          true;
      }
  };

  return {
    connection,
    estado
  };
}


// ======================================================
// RESTAURAR MOCKS
// ======================================================

afterEach(
  () => {
    mock.restoreAll();
  }
);


// ======================================================
// FECHA SIN CRONOGRAMA APLICABLE
// ======================================================

test(
  'Rechaza una justificación si no existe un cronograma vigente para la fecha',
  async () => {
    const {
      connection,
      estado
    } = crearConexionSimulada();

    let consultaAsistenciaEjecutada =
      false;

    let parametrosHorario;

    mock.method(
      horarioModel,
      'getUsuarioConRol',
      async () => actorActivo
    );

    mock.method(
      horarioModel,
      'getByUsuarioAndDiaEnFecha',
      async (
        usuarioId,
        diaSemana,
        fecha
      ) => {
        parametrosHorario = {
          usuarioId,
          diaSemana,
          fecha
        };

        return undefined;
      }
    );

    mock.method(
      asistenciaModel,
      'buscarAsistenciaPorFecha',
      async () => {
        consultaAsistenciaEjecutada =
          true;

        return undefined;
      }
    );

    mock.method(
      db,
      'getConnection',
      async () => connection
    );

    await assert.rejects(
      () =>
        solicitudService
          .createJustificativo(
            actorToken,
            datosJustificativo,
            null
          ),

      error => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.equal(
          error.message,
          'No puede justificar esa fecha porque no tenía un horario asignado.'
        );

        return true;
      }
    );

    assert.deepEqual(
      parametrosHorario,
      {
        usuarioId: 3,
        diaSemana: 'lunes',
        fecha: '2026-09-28'
      }
    );

    assert.equal(
      consultaAsistenciaEjecutada,
      false
    );

    assert.equal(
      estado.transaccionIniciada,
      true
    );

    assert.equal(
      estado.rollbackEjecutado,
      true
    );

    assert.equal(
      estado.conexionLiberada,
      true
    );
  }
);


// ======================================================
// FECHA CON ASISTENCIA EFECTIVA
// ======================================================

test(
  'Rechaza una justificación si existe una entrada registrada para la fecha',
  async () => {
    const {
      connection,
      estado
    } = crearConexionSimulada();

    let parametrosAsistencia;

    mock.method(
      horarioModel,
      'getUsuarioConRol',
      async () => actorActivo
    );

    mock.method(
      horarioModel,
      'getByUsuarioAndDiaEnFecha',
      async () => ({
        id: 10,
        usuario_id: 3,
        dia_semana: 'lunes',
        hora_entrada: '08:00:00',
        hora_salida: '16:00:00',
        tolerancia_minutos: 10,
        modalidad: 'PRESENCIAL',
        vigente_desde: '2026-09-01',
        vigente_hasta: null
      })
    );

    mock.method(
      asistenciaModel,
      'buscarAsistenciaPorFecha',
      async (
        receivedConnection,
        usuarioId,
        fecha
      ) => {
        parametrosAsistencia = {
          receivedConnection,
          usuarioId,
          fecha
        };

        return {
          id: 25,
          usuario_id: 3,
          fecha: '2026-09-28',
          hora_entrada: '08:05:00',
          hora_salida: null,
          estado: 'PRESENTE'
        };
      }
    );

    mock.method(
      db,
      'getConnection',
      async () => connection
    );

    await assert.rejects(
      () =>
        solicitudService
          .createJustificativo(
            actorToken,
            datosJustificativo,
            null
          ),

      error => {
        assert.equal(
          error.statusCode,
          409
        );

        assert.equal(
          error.message,
          'No puede justificar una inasistencia porque ya existe una asistencia registrada para esa fecha.'
        );

        return true;
      }
    );

    assert.equal(
      parametrosAsistencia
        .receivedConnection,
      connection
    );

    assert.equal(
      parametrosAsistencia.usuarioId,
      3
    );

    assert.equal(
      parametrosAsistencia.fecha,
      '2026-09-28'
    );

    assert.equal(
      estado.transaccionIniciada,
      true
    );

    assert.equal(
      estado.rollbackEjecutado,
      true
    );

    assert.equal(
      estado.conexionLiberada,
      true
    );
  }
);