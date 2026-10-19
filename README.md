# WorkTrack

Sistema web de gestiÃ³n laboral y control de asistencia mediante QR.

## TecnologÃ­as

- Angular standalone.
- Node.js y Express.
- MariaDB.
- Flyway.
- JWT y control de permisos por rol.
- Cloudflare Turnstile.
- Vercel Blob para archivos privados.

## Arquitectura

El backend utiliza la separaciÃ³n:

```text
router -> controller -> service -> model
```

El frontend se encuentra en `worktrack/`, el backend en `backend/` y las migraciones de la base de datos en `database/migrations/`.

## PreparaciÃ³n del backend

```bash
cd backend
npm install
```

Crear el archivo `backend/.env` a partir de `backend/.env.example` y completar las variables del entorno correspondiente.

## Base de datos

Flyway es el Ãºnico mecanismo autorizado para crear y actualizar la base de datos. No se utilizan scripts independientes de esquema o carga inicial.

La base configurada debe existir y encontrarse vacÃ­a antes de la primera ejecuciÃ³n. Desde `backend/` ejecutar:

```bash
npm run db:info
npm run db:migrate
npm run db:validate
```

Las migraciones crean:

- La estructura completa de WorkTrack.
- Los cuatro roles del sistema.
- Cuatro usuarios de demostraciÃ³n.
- Las dos redes autorizadas para la presentaciÃ³n.
- Permisos y relaciones entre roles y permisos.
- Tipos de justificativo.

La migraciÃ³n V14 retira los horarios amplios utilizados durante el desarrollo. En una instalaciÃ³n nueva, las tablas transaccionales quedan vacÃ­as.

## EjecuciÃ³n del backend

```bash
cd backend
npm start
```

## PreparaciÃ³n y ejecuciÃ³n del frontend

```bash
cd worktrack
npm install
npm start
```

Para generar una compilaciÃ³n de producciÃ³n:

```bash
npm run build
```

## Usuarios de demostraciÃ³n

Los cuatro usuarios iniciales representan los roles administrador, supervisor, empleado y Recursos Humanos. Sus datos se encuentran definidos en la migraciÃ³n `V2__datos_iniciales_desarrollo.sql`.

## Autores

- Borgatti Valeria
- Dias Paredes Maria
- Insaurralde Yeila
- Zubiri Brisa

## Contexto institucional

Proyecto desarrollado en el marco de PrÃ¡cticas Profesionalizantes III bajo la supervisiÃ³n del Prof. Sergio Benitez.