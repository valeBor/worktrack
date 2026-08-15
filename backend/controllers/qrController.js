const qrService = require("../services/qrService");

exports.generarQR = async (req, res) => {

  console.log(
    "Generando QR:",
    new Date()
  );

  try {

    const qrBuffer =
      await qrService.generarQR();

    res.setHeader(
      "Content-Type",
      "image/png"
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    res.send(qrBuffer);

  } catch (error) {

    console.error(
      "Error generando QR:",
      error
    );

    res.status(500).json({
      mensaje:
        "Error generando QR"
    });

  }

};