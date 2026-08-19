// ======================================================
// VERIFICAR TOKEN DE CLOUDFLARE TURNSTILE
// ======================================================

exports.verifyTurnstile = async (
  turnstileToken
) => {

  if (!turnstileToken) {

    return false;

  }


  const secretKey =
    process.env.TURNSTILE_SECRET_KEY;


  if (!secretKey) {

    throw new Error(
      'Falta configurar TURNSTILE_SECRET_KEY en el archivo .env'
    );

  }


  const response = await fetch(

    'https://challenges.cloudflare.com/turnstile/v0/siteverify',

    {
      method: 'POST',

      headers: {

        'Content-Type': 'application/json'

      },

      body: JSON.stringify({

        secret: secretKey,

        response: turnstileToken

      })

    }

  );


  // Primero leemos la respuesta como texto.
  const responseText =
    await response.text();


  // Si Cloudflare devuelve un código HTTP de error,
  // mostramos información de diagnóstico.
  //
  // No mostramos la clave secreta ni el token.
  if (!response.ok) {

    console.error(
      'Cloudflare Turnstile respondió:',
      response.status,
      response.statusText
    );

    console.error(
      'Detalle de Cloudflare:',
      responseText
    );

    throw new Error(
      'No se pudo verificar Turnstile'
    );

  }


  let data;


  try {

    data = JSON.parse(responseText);

  } catch (error) {

    console.error(
      'Respuesta no válida de Cloudflare:',
      responseText
    );

    throw new Error(
      'Cloudflare devolvió una respuesta inválida'
    );

  }


  // Si el token no fue aceptado,
  // mostramos solamente los códigos de error.
  if (data.success !== true) {

    console.error(
      'Turnstile rechazado:',
      data['error-codes'] || []
    );

    return false;

  }


  return true;

};