const bcrypt = require('bcrypt');
const authService = require('../services/authService');
const turnstileService = require('../services/turnstileService');
const emailService = require('../services/emailService');
const userModel = require('../models/userModel');

const mensajeRecuperacion =
  'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

// ======================================================
// INICIAR SESIÓN
// ======================================================

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
      turnstileToken
    } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof turnstileToken !== 'string'
    ) {
      return res.status(400).json({
        message: 'Los datos enviados no son válidos'
      });
    }

    if (
      !email.trim() ||
      password.length === 0 ||
      !turnstileToken.trim()
    ) {
      return res.status(400).json({
        message: 'Email, contraseña y verificación son obligatorios'
      });
    }

    const turnstileValido =
      await turnstileService.verifyTurnstile(
        turnstileToken
      );

    if (!turnstileValido) {
      return res.status(400).json({
        message: 'La verificación de seguridad es inválida o expiró'
      });
    }

    const emailNormalizado =
      email.trim().toLowerCase();

    const user =
      await userModel.getByEmailWithRole(
        emailNormalizado
      );

    if (!user) {
      return res.status(401).json({
        message: 'Correo o contraseña incorrectos'
      });
    }

    if (Number(user.estado) !== 1) {
      return res.status(403).json({
        message: 'El usuario se encuentra inactivo'
      });
    }

    if (Number(user.cuenta_bloqueada) === 1) {
      return res.status(423).json({
        message: 'La cuenta está bloqueada. Utilizá "¿Olvidaste tu contraseña?" para recuperarla.'
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      const estadoLogin =
        await userModel.registrarIntentoFallido(
          user.id
        );

      const intentosFallidos =
        Number(estadoLogin.intentos_fallidos);

      const cuentaBloqueada =
        Number(estadoLogin.cuenta_bloqueada) === 1;

      if (cuentaBloqueada) {
        return res.status(423).json({
          message: 'La cuenta fue bloqueada por cinco intentos fallidos. Utilizá "¿Olvidaste tu contraseña?" para recuperarla.'
        });
      }

      const intentosRestantes =
        5 - intentosFallidos;

      if (intentosFallidos >= 3) {
        const textoIntentos =
          intentosRestantes === 1
            ? 'Te queda 1 intento antes de bloquear la cuenta.'
            : `Te quedan ${intentosRestantes} intentos antes de bloquear la cuenta.`;

        return res.status(401).json({
          message: `Correo o contraseña incorrectos. ${textoIntentos}`
        });
      }

      return res.status(401).json({
        message: 'Correo o contraseña incorrectos'
      });
    }

    if (Number(user.intentos_fallidos) > 0) {
      await userModel.reiniciarIntentosLogin(
        user.id
      );
    }

    const token =
      authService.generateToken(user);

    return res.status(200).json({
      message: 'Login OK',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(
      'Error en login:',
      error.message
    );

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};

// ======================================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ======================================================

exports.forgotPassword = async (req, res) => {
  try {
    const {
      email,
      turnstileToken
    } = req.body;

    if (
      typeof email !== 'string' ||
      typeof turnstileToken !== 'string'
    ) {
      return res.status(400).json({
        message: 'Los datos enviados no son válidos'
      });
    }

    if (
      !email.trim() ||
      !turnstileToken.trim()
    ) {
      return res.status(400).json({
        message: 'El email y la verificación son obligatorios'
      });
    }

    const turnstileValido =
      await turnstileService.verifyTurnstile(
        turnstileToken
      );

    if (!turnstileValido) {
      return res.status(400).json({
        message: 'La verificación de seguridad es inválida o expiró'
      });
    }

    const emailNormalizado =
      email.trim().toLowerCase();

    const user =
      await userModel.getByEmail(
        emailNormalizado
      );

    if (
      !user ||
      Number(user.estado) !== 1
    ) {
      return res.status(200).json({
        message: mensajeRecuperacion
      });
    }

    const resetToken =
      authService.generateResetToken(user);

    const frontendUrl =
      process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error(
        'Falta configurar FRONTEND_URL en el archivo .env'
      );
    }

    const enlaceRecuperacion =
      `${frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;

    const nombreUsuario =
      `${user.nombre} ${user.apellido}`.trim();

    await emailService.enviarEmailRecuperacion(
      user.email,
      nombreUsuario,
      enlaceRecuperacion
    );

    return res.status(200).json({
      message: mensajeRecuperacion
    });
  } catch (error) {
    console.error(
      'Error en forgotPassword:',
      error.message
    );

    return res.status(500).json({
      message: 'No se pudo procesar la solicitud de recuperación'
    });
  }
};

// ======================================================
// RESTABLECER CONTRASEÑA
// ======================================================

exports.resetPassword = async (req, res) => {
  try {
    const {
      token,
      newPassword,
      confirmPassword
    } = req.body;

    if (
      typeof token !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      return res.status(400).json({
        message: 'Los datos enviados no son válidos'
      });
    }

    if (
      !token.trim() ||
      newPassword.length === 0 ||
      confirmPassword.length === 0
    ) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Las contraseñas no coinciden'
      });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 64
    ) {
      return res.status(400).json({
        message: 'La contraseña debe tener entre 8 y 64 caracteres'
      });
    }

    const passwordSegura =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

    if (!passwordSegura.test(newPassword)) {
      return res.status(400).json({
        message: 'La contraseña debe incluir mayúscula, minúscula y número'
      });
    }

    let tokenDecodificado;

    try {
      tokenDecodificado =
        authService.decodeResetToken(token);
    } catch (error) {
      return res.status(400).json({
        message: 'El enlace es inválido o expiró. Solicitá uno nuevo.'
      });
    }

    const user =
      await userModel.getById(
        tokenDecodificado.id
      );

    if (!user) {
      return res.status(400).json({
        message: 'El enlace es inválido o expiró. Solicitá uno nuevo.'
      });
    }

    if (Number(user.estado) !== 1) {
      return res.status(403).json({
        message: 'El usuario se encuentra inactivo'
      });
    }

    try {
      authService.verifyResetToken(
        token,
        user
      );
    } catch (error) {
      return res.status(400).json({
        message: 'El enlace es inválido, expiró o ya fue utilizado. Solicitá uno nuevo.'
      });
    }

    const esLaMismaPassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (esLaMismaPassword) {
      return res.status(400).json({
        message: 'La contraseña nueva debe ser diferente de la actual'
      });
    }

    const nuevoHash =
      await bcrypt.hash(
        newPassword,
        10
      );

    const resultado =
      await userModel.updatePassword(
        user.id,
        nuevoHash
      );

    if (resultado.affectedRows !== 1) {
      throw new Error(
        'No se pudo actualizar la contraseña'
      );
    }

    return res.status(200).json({
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error(
      'Error en resetPassword:',
      error.message
    );

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};