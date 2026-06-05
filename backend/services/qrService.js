const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

//genera la imagen qr
exports.generarQR = async () => {

  const token = uuidv4();

  const datosQR = JSON.stringify({
    token,
    timestamp: Date.now()
  });

  return await QRCode.toBuffer(datosQR);

};