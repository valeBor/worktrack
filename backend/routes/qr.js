const express = require("express");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

router.get("/generar", async (req, res) => {

  try {

    const token = uuidv4();

    const datosQR = JSON.stringify({
      token: token,
      fecha: new Date()
    });

    const qrBuffer = await QRCode.toBuffer(datosQR);

    res.setHeader("Content-Type", "image/png");

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