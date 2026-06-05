const express = require("express");
const router = express.Router();

const {generarQR} = require("../controllers/qrController");

//el cliente esta pidiendo recurso al servidor, cuando se accede a generar devuelve una imagen
router.get("/generar", generarQR);

module.exports = router;