const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const LOCAL_DIRECTORY = path.join(
  __dirname,
  '..',
  'private_uploads'
);

const VALID_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'png'
]);

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getProvider() {
  const configuredProvider = process.env.FILE_STORAGE_PROVIDER;

  const provider = (
    configuredProvider ||
    (process.env.VERCEL ? 'VERCEL_BLOB' : 'LOCAL')
  ).toUpperCase();

  if (!['LOCAL', 'VERCEL_BLOB'].includes(provider)) {
    throw createError(
      'El proveedor de almacenamiento configurado no es válido.'
    );
  }

  return provider;
}

function createStorageKey(extension) {
  if (!VALID_EXTENSIONS.has(extension)) {
    throw createError(
      'La extensión del archivo no es válida.',
      400
    );
  }

  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const identifier = crypto.randomUUID();

  return [
    'justificativos',
    year,
    month,
    `${identifier}.${extension}`
  ].join('/');
}

function resolveLocalPath(storageKey) {
  const normalizedKey = storageKey
    .split('/')
    .filter(Boolean);

  const resolvedPath = path.resolve(
    LOCAL_DIRECTORY,
    ...normalizedKey
  );

  const resolvedDirectory = path.resolve(LOCAL_DIRECTORY);
  const validPrefix = `${resolvedDirectory}${path.sep}`;

  if (
    resolvedPath !== resolvedDirectory &&
    !resolvedPath.startsWith(validPrefix)
  ) {
    throw createError(
      'La ubicación del archivo no es válida.',
      400
    );
  }

  return resolvedPath;
}

async function saveLocally(storageKey, file) {
  const destination = resolveLocalPath(storageKey);

  await fs.mkdir(path.dirname(destination), {
    recursive: true
  });

  await fs.writeFile(destination, file.buffer, {
    flag: 'wx'
  });

  return {
    provider: 'LOCAL',
    storageKey
  };
}

async function saveInVercelBlob(storageKey, file) {
  const {put} = await import('@vercel/blob');

  const blob = await put(
    storageKey,
    file.buffer,
    {
      access: 'private',
      contentType: file.mimeType,
      addRandomSuffix: false
    }
  );

  return {
    provider: 'VERCEL_BLOB',
    storageKey: blob.pathname
  };
}

async function saveFile(file) {
  const provider = getProvider();
  const storageKey = createStorageKey(file.extension);

  if (provider === 'VERCEL_BLOB') {
    return saveInVercelBlob(storageKey, file);
  }

  return saveLocally(storageKey, file);
}

async function readLocalFile(storageKey) {
  try {
    return await fs.readFile(
      resolveLocalPath(storageKey)
    );
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createError(
        'El archivo solicitado no existe.',
        404
      );
    }

    throw error;
  }
}

async function readVercelBlob(storageKey) {
  const {get} = await import('@vercel/blob');

  const result = await get(storageKey, {
    access: 'private',
    useCache: false
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw createError(
      'El archivo solicitado no existe.',
      404
    );
  }

  const arrayBuffer = await new Response(
    result.stream
  ).arrayBuffer();

  return Buffer.from(arrayBuffer);
}

async function readFile(provider, storageKey) {
  if (provider === 'VERCEL_BLOB') {
    return readVercelBlob(storageKey);
  }

  if (provider === 'LOCAL') {
    return readLocalFile(storageKey);
  }

  throw createError(
    'El proveedor del archivo no es válido.',
    500
  );
}

async function deleteLocalFile(storageKey) {
  try {
    await fs.unlink(resolveLocalPath(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function deleteVercelBlob(storageKey) {
  const {del} = await import('@vercel/blob');
  await del(storageKey);
}

async function deleteFile(provider, storageKey) {
  if (provider === 'VERCEL_BLOB') {
    return deleteVercelBlob(storageKey);
  }

  if (provider === 'LOCAL') {
    return deleteLocalFile(storageKey);
  }

  throw createError(
    'El proveedor del archivo no es válido.',
    500
  );
}

module.exports = {
  saveFile,
  readFile,
  deleteFile
};