const express = require("express");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

router.get("/generar", async (req, res) => {
  
  console.log("Generando qr:", new Date());
   
  try {

    const token = uuidv4();

    const datosQR = JSON.stringify({
      token: token,
      //devuelve milisegundos, un numero, la fecha en numero, que despues servira para hacer la cuenta,
      //de tiempo de llegada, token valido, etc.
      timestamp: Date.now()
    });

    const qrBuffer = await QRCode.toBuffer(datosQR);

    res.setHeader("Content-Type", "image/png");
    //navegador no guarda la imagen, la pide siempre de nuevo segun los segundos establecidos
    res.setHeader("Cache-Control", "no-store");

    res.send(qrBuffer);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      ok: false,
      mensaje: "Error generando QR"
    });

  }

});

module.exports = router;