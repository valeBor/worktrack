const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyKioskToken } = require('../middlewares/kioskMiddleware');
const permisoModel = require('../models/permiso.model');
const authService = require('../services/authService');

const previousSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = 'secreto-prueba-kiosco';

afterEach(() => mock.restoreAll());

test('El token de tótem no autoriza las rutas normales', () => {
  const token = authService.generateKioskToken(7);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let status;
  const res = {
    status(code) { status = code; return this; },
    json() { return this; }
  };
  let continued = false;
  verifyToken(req, res, () => { continued = true; });
  assert.equal(status, 403);
  assert.equal(continued, false);
});

test('La ruta del tótem acepta solo el token limitado y un admin activo', async () => {
  mock.method(permisoModel, 'verificarPermisosUsuario', async () => ({
    estado: true, cuenta_bloqueada: false, autorizado: true
  }));
  const token = authService.generateKioskToken(7);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let continued = false;
  await verifyKioskToken(req, {}, () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(req.user.role, 'kiosk');
});

test('El token de login no sirve para la ruta exclusiva de tótem', async () => {
  const token = jwt.sign({ id: 7, role: 'admin' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let status;
  const res = {
    status(code) { status = code; return this; },
    json() { return this; }
  };
  let continued = false;
  await verifyKioskToken(req, res, () => { continued = true; });
  assert.equal(status, 403);
  assert.equal(continued, false);
});

test('Se revoca el tótem al desactivar la cuenta administradora', async () => {
  mock.method(permisoModel, 'verificarPermisosUsuario', async () => ({
    estado: false, cuenta_bloqueada: false, autorizado: true
  }));
  const token = authService.generateKioskToken(7);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let status;
  const res = {
    status(code) { status = code; return this; },
    json() { return this; }
  };
  await verifyKioskToken(req, res, () => assert.fail('No debe continuar'));
  assert.equal(status, 403);
});

process.on('exit', () => {
  if (previousSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = previousSecret;
});
