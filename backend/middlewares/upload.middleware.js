const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ======================================================
// CARPETA DE DESTINO
// ======================================================

const carpetaDestino = path.join(
  __dirname,
  '..',
  'uploads',
  'justificativos'
);

if (!fs.existsSync(carpetaDestino)) {
  fs.mkdirSync(carpetaDestino, {
    recursive: true
  });
}

// ======================================================
// CONFIGURACIÓN DE ALMACENAMIENTO
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaDestino);
  },
  filename: (req, file, cb) => {
    const sufijo =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9);

    cb(
      null,
      sufijo + path.extname(file.originalname)
    );
  }
});

// ======================================================
// FILTRO DE TIPO DE ARCHIVO
// ======================================================

const filtroArchivo = (req, file, cb) => {
  const tiposPermitidos = [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido.'));
  }
};

// ======================================================
// EXPORTAR MIDDLEWARE DE SUBIDA
// ======================================================

const upload = multer({
  storage: storage,
  fileFilter: filtroArchivo,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;