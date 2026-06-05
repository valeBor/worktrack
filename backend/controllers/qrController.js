const qrService = require("../services/qrService");

exports.generarQR = async (req, res) => {

    console.log("Generando qr:", new Date());

  try {

      
    const qrBuffer = await qrService.generarQR();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");

    res.send(qrBuffer);

  } catch (error) {

    res.status(500).json({
      mensaje: "Error generando QR"
    });

  }

};