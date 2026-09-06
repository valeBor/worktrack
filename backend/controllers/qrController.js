const qrService =
  require('../services/qrService');

// ======================================================
// GENERAR CÓDIGO QR
// ======================================================

exports.generarQR = async (req, res) => {
  try {
    const resultado =
      await qrService.generarQR();

    const imagenBase64 =
      resultado.qrBuffer.toString('base64');

    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );

    res.setHeader(
      'Pragma',
      'no-cache'
    );

    return res.status(200).json({
      imagen:
        `data:image/png;base64,${imagenBase64}`,
      generado_en:
        new Date(
          resultado.generadoEn
        ).toISOString(),
      expira_en:
        new Date(
          resultado.expiraEn
        ).toISOString(),
      duracion_segundos:
        resultado.duracionSegundos
    });
  } catch (error) {
    console.error(
      'Error al generar el código QR:',
      error
    );

    return res.status(500).json({
      mensaje:
        'Error interno al generar el código QR.'
    });
  }
};