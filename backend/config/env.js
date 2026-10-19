// ======================================================
// ENTORNOS PERMITIDOS
// ======================================================

const VALID_NODE_ENVIRONMENTS =
  new Set([

    'development',
    'test',
    'production'
  ]);


// ======================================================
// VARIABLES OBLIGATORIAS EN PRODUCCIÓN
// ======================================================

const REQUIRED_PRODUCTION_VARIABLES = [

  'FRONTEND_URL',
  'CORS_ORIGINS',
  'TRUST_PROXY_HOPS',
  'APP_TIMEZONE',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'RESET_TOKEN_SECRET',
  'TURNSTILE_SECRET_KEY',
  'EMAIL_USER',
  'BREVO_API_KEY',
  'QR_TOKEN_SECRET',
  'FILE_STORAGE_PROVIDER'
];

// ======================================================
// VERIFICAR QUE EXISTA UN VALOR
// ======================================================

function hasValue(
  value
) {

  return (

    typeof value === 'string' &&

    value.trim().length > 0

  );

}


// ======================================================
// VALIDAR NÚMERO ENTERO
// ======================================================

function validateInteger(

  name,
  options = {}

) {

  const value =
    process.env[name];


  if (!hasValue(value)) {

    return;

  }

  const number =
    Number(value);

  const minimum =
    options.minimum ?? 1;


  if (

    !Number.isInteger(number) ||

    number < minimum

  ) {

    throw new Error(

      `${name} debe ser un número entero mayor o igual a ${minimum}.`

    );

  }

}


// ======================================================
// VALIDAR URL
// ======================================================

function validateUrl(

  name,
  value

) {

  try {

    const url =
      new URL(value);

    if (

      ![
        'http:',

        'https:'
      ].includes(
        url.protocol
      )

    ) {

      throw new Error();

    }

  } catch (error) {

    throw new Error(

      `${name} debe contener una URL HTTP o HTTPS válida.`

    );

  }

}


// ======================================================
// VALIDAR VARIABLES DE ENTORNO
// ======================================================

function validateEnvironment() {

  const nodeEnvironment = (

    process.env.NODE_ENV ||

    'development'

  )
    .trim()

    .toLowerCase();


  if (

    !VALID_NODE_ENVIRONMENTS.has(
      nodeEnvironment
    )

  ) {

    throw new Error(

      'NODE_ENV debe ser development, test o production.'

    );

  }


  // ----------------------------------------------------
  // VALORES NUMÉRICOS
  // ----------------------------------------------------

  validateInteger(
    'PORT'
  );


  validateInteger(
    'DB_PORT'
  );


  validateInteger(
    'DB_CONNECTION_LIMIT'
  );


  validateInteger(
    'DB_CONNECT_TIMEOUT_MS'
  );


  validateInteger(

    'TRUST_PROXY_HOPS',

    {

      minimum:
        0

    }

  );


  validateInteger(
    'QR_DURACION_SEGUNDOS'
  );


  // ----------------------------------------------------
  // DESARROLLO Y PRUEBAS
  // ----------------------------------------------------

  if (
    nodeEnvironment !== 'production'
  ) {

    return;

  }


  // ----------------------------------------------------
  // VARIABLES OBLIGATORIAS
  // ----------------------------------------------------

  const missingVariables =

    REQUIRED_PRODUCTION_VARIABLES

      .filter(

        name =>
          !hasValue(
            process.env[name]
          )

      );


  if (
    missingVariables.length > 0
  ) {

    throw new Error(

      `Faltan variables de producción: ${missingVariables.join(', ')}.`

    );

  }


  // ----------------------------------------------------
  // URL DEL FRONTEND
  // ----------------------------------------------------

  validateUrl(

    'FRONTEND_URL',

    process.env.FRONTEND_URL

  );


  // ----------------------------------------------------
  // ORÍGENES CORS
  // ----------------------------------------------------

  const corsOrigins =

    process.env.CORS_ORIGINS

      .split(',')

      .map(

        origin =>
          origin.trim()

      )

      .filter(Boolean);


  if (
    corsOrigins.length === 0
  ) {

    throw new Error(

      'CORS_ORIGINS debe contener al menos un origen.'

    );

  }


  corsOrigins.forEach(

    origin => {

      validateUrl(

        'CORS_ORIGINS',

        origin

      );

    }

  );


  // ----------------------------------------------------
  // ALMACENAMIENTO DE ARCHIVOS
  // ----------------------------------------------------

  const storageProvider =

    process.env.FILE_STORAGE_PROVIDER

      .trim()
      .toUpperCase();

  if (
    storageProvider !== 'VERCEL_BLOB'
  ) {

    throw new Error(

      'En producción FILE_STORAGE_PROVIDER debe ser VERCEL_BLOB.'

    );

  }


  if (

    !hasValue(
      process.env.BLOB_READ_WRITE_TOKEN
    )

  ) {

    throw new Error(

      'BLOB_READ_WRITE_TOKEN es obligatorio para Vercel Blob.'

    );

  }

}


module.exports = {

  validateEnvironment

};