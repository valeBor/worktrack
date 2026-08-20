const jwt = require('jsonwebtoken');


// ======================================================
// VERIFICAR TOKEN JWT DE SESIÓN
// ======================================================

exports.verifyToken = (
  req,
  res,
  next
) => {

  const authHeader =
    req.headers.authorization;


  // ----------------------------------------------------
  // 1. VERIFICAR ENCABEZADO
  // ----------------------------------------------------

  if (!authHeader) {

    return res.status(401).json({

      message:
        'Token requerido'

    });

  }


  // El formato correcto es:
  //
  // Authorization: Bearer TOKEN
  const partes =
    authHeader.split(' ');


  if (
    partes.length !== 2 ||
    partes[0] !== 'Bearer' ||
    !partes[1]
  ) {

    return res.status(401).json({

      message:
        'Formato de token inválido'

    });

  }


  const token =
    partes[1];


  // ----------------------------------------------------
  // 2. OBTENER SECRETO
  // ----------------------------------------------------

  const jwtSecret =
    process.env.JWT_SECRET;


  if (!jwtSecret) {

    console.error(

      'Falta JWT_SECRET en el archivo .env'

    );


    return res.status(500).json({

      message:
        'Error de configuración del servidor'

    });

  }


  // ----------------------------------------------------
  // 3. VERIFICAR TOKEN
  // ----------------------------------------------------

  try {

    const decoded = jwt.verify(

      token,

      jwtSecret

    );


    req.user =
      decoded;


    next();

  } catch (error) {

    return res.status(401).json({

      message:
        'Token inválido o vencido'

    });

  }

};