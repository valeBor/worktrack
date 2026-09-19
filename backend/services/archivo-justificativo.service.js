const crypto = require('crypto');
const path = require('path');

const {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES
} = require('../middlewares/upload.middleware');

const FILE_SIGNATURES = [
  {
    mimeType: 'application/pdf',
    extension: 'pdf',
    matches: buffer =>
      buffer.length >= 5 &&
      buffer.subarray(0, 5).toString('ascii') === '%PDF-'
  },
  {
    mimeType: 'image/jpeg',
    extension: 'jpg',
    matches: buffer =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
  },
  {
    mimeType: 'image/png',
    extension: 'png',
    matches: buffer =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47,
          0x0d, 0x0a, 0x1a, 0x0a
        ])
      )
  }
];

function crearError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function limpiarNombreOriginal(originalName) {
  const baseName = path.basename(originalName || 'archivo');

  const cleanedName = baseName
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .trim()
    .slice(0, 180);

  return cleanedName || 'archivo';
}

function detectarTipoReal(buffer) {
  return FILE_SIGNATURES.find(signature =>
    signature.matches(buffer)
  ) || null;
}

function validarArchivoJustificativo(file) {
  if (!file) {
    throw crearError(
      'Debés adjuntar el certificado correspondiente.'
    );
  }

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw crearError('El archivo adjunto está vacío.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw crearError(
      'El archivo no puede superar los 4 MB.'
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw crearError(
      'Solo se permiten archivos PDF, JPG o PNG.'
    );
  }

  const detectedType = detectarTipoReal(file.buffer);

  if (!detectedType) {
    throw crearError(
      'El contenido del archivo no corresponde a un PDF, JPG o PNG válido.'
    );
  }

  if (detectedType.mimeType !== file.mimetype) {
    throw crearError(
      'El tipo declarado del archivo no coincide con su contenido.'
    );
  }

  const hash = crypto
    .createHash('sha256')
    .update(file.buffer)
    .digest('hex');

  return {
    buffer: file.buffer,
    originalName: limpiarNombreOriginal(file.originalname),
    mimeType: detectedType.mimeType,
    extension: detectedType.extension,
    size: file.buffer.length,
    sha256: hash
  };
}

module.exports = {
  validarArchivoJustificativo
};