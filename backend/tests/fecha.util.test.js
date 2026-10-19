const {
  test
} = require('node:test');

const assert =
  require('node:assert/strict');

const {
  normalizarFechaBaseDatos
} = require('../utils/fecha.util');


// ======================================================
// FECHA RECIBIDA COMO OBJETO DATE
// ======================================================

test(

  'Conserva el día calendario de una fecha de base de datos',

  () => {

    const fechaBaseDatos =
      new Date(
        '2026-10-05T00:00:00.000Z'
      );

    const resultado =
      normalizarFechaBaseDatos(
        fechaBaseDatos
      );

    assert.equal(
      resultado,
      '2026-10-05'
    );

  }

);


// ======================================================
// FECHA RECIBIDA COMO TEXTO
// ======================================================

test(

  'Extrae la fecha sin modificarla cuando recibe texto',

  () => {

    const resultado =
      normalizarFechaBaseDatos(
        '2026-10-05 14:00:00'
      );

    assert.equal(
      resultado,
      '2026-10-05'
    );

  }

);


// ======================================================
// VALOR VACÍO
// ======================================================

test(

  'Devuelve texto vacío cuando no existe una fecha',

  () => {

    assert.equal(
      normalizarFechaBaseDatos(null),
      ''
    );

    assert.equal(
      normalizarFechaBaseDatos(undefined),
      ''
    );

    assert.equal(
      normalizarFechaBaseDatos(''),
      ''
    );

  }

);