const {test, afterEach, mock} = require('node:test');
const assert = require('node:assert/strict');
const model = require('../models/reporte-asistencia.model');
const service = require('../services/reporte-asistencia.service');
const {obtenerFechaHoraActual} = require('../utils/fecha.util');

afterEach(() => mock.restoreAll());

function mockData(role = 'supervisor', asistencias = []) {
  mock.method(model, 'getActorById', async () => ({
    id: 3, estado: 1, cuenta_bloqueada: 0, role
  }));
  mock.method(model, 'getUsuariosReportablesHistorial', async () => [
    {id: 5, nombre: 'Ana', apellido: 'Empleado', role: 'empleado', estado: 1},
    {id: 6, nombre: 'Sol', apellido: 'Supervisor', role: 'supervisor', estado: 1},
    {id: 7, nombre: 'Eva', apellido: 'Exempleada', role: 'empleado', estado: 0}
  ]);
  mock.method(model, 'getAsistenciasByPeriodo', async () => asistencias);
  for (const name of [
    'getHorariosByPeriodo',
    'getCambiosAprobadosByPeriodo', 'getJustificacionesAprobadasByPeriodo'
  ]) mock.method(model, name, async () => []);
}

test('El parte del supervisor solo devuelve empleados activos', async () => {
  const {fecha} = obtenerFechaHoraActual();
  mockData('supervisor', [
    {usuario_id: 7, fecha, hora_entrada: '09:00:00', estado: 'PRESENTE'}
  ]);
  const result = await service.obtenerHistorialSupervisor({id: 3}, {
    fechaDesde: fecha, fechaHasta: fecha
  });
  assert.equal(result.registros.length, 1);
  assert.equal(result.registros[0].usuario.id, 5);
  assert.equal(result.registros.some(registro => registro.usuario.id === 7), false);
  assert.equal(result.registros[0].estado, 'SIN_HORARIO');
});

test('El parte del supervisor rechaza otro rol aunque tenga la ruta', async () => {
  mockData('empleado');
  await assert.rejects(
    service.obtenerHistorialSupervisor({id: 3}),
    error => error.statusCode === 403
  );
});

test('El parte del supervisor rechaza una fecha futura', async () => {
  mockData();
  await assert.rejects(
    service.obtenerHistorialSupervisor({id: 3}, {
      fechaDesde: '2099-01-01', fechaHasta: '2099-01-01'
    }),
    error => error.statusCode === 400
  );
});

test('El historial global de RR. HH. conserva empleados y supervisores', async () => {
  const {fecha} = obtenerFechaHoraActual();
  mockData('rrhh', [
    {usuario_id: 5, fecha, hora_entrada: '09:00:00', estado: 'PRESENTE'},
    {usuario_id: 6, fecha, hora_entrada: '09:30:00', estado: 'TARDE'},
    {usuario_id: 7, fecha, hora_entrada: '10:00:00', estado: 'PRESENTE'}
  ]);
  const result = await service.obtenerHistorial({id: 3}, {
    fechaDesde: fecha, fechaHasta: fecha
  });
  assert.deepEqual(result.registros.map(registro => registro.usuario.id), [5, 7, 6]);
  assert.equal(result.periodo.fecha_desde, fecha);
});

test('El parte del supervisor rechaza cuentas inactivas', async () => {
  mock.method(model, 'getActorById', async () => ({
    id: 3, estado: 0, cuenta_bloqueada: 0, role: 'supervisor'
  }));
  await assert.rejects(
    service.obtenerHistorialSupervisor({id: 3}),
    error => error.statusCode === 401
  );
});
