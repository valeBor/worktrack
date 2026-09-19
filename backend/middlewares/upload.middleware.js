const multer = require('multer');

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png'
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
    parts: 11
  },

  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const error = new Error(
        'Solo se permiten archivos PDF, JPG o PNG.'
      );
      error.statusCode = 400;
      return callback(error);
    }

    return callback(null, true);
  }
});

function uploadJustificativo(req, res, next) {
  upload.single('archivo')(req, res, error => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const mensajes = {
        LIMIT_FILE_SIZE: 'El archivo no puede superar los 4 MB.',
        LIMIT_FILE_COUNT: 'Solo se permite adjuntar un archivo.',
        LIMIT_UNEXPECTED_FILE:
          'El campo del archivo debe llamarse "archivo".',
        LIMIT_FIELD_COUNT:
          'El formulario contiene demasiados campos.',
        LIMIT_PART_COUNT:
          'El formulario contiene demasiadas partes.'
      };

      return res.status(400).json({
        mensaje:
          mensajes[error.code] ||
          'No se pudo procesar el archivo adjunto.'
      });
    }

    return res.status(error.statusCode || 400).json({
      mensaje:
        error.message ||
        'El archivo adjunto no es válido.'
    });
  });
}

module.exports = {
  uploadJustificativo,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES
};