# WorkTrack

Sistema de gestión laboral y control de asistencia mediante QR.

## Descripción del proyecto

WorkTrack es una aplicación web que centraliza el registro de asistencia, la administración de cronogramas y la consulta de información laboral. Cuenta con funciones diferenciadas para administradores, Recursos Humanos, supervisores y empleados.

El empleado puede registrar su entrada y salida mediante un QR dinámico. El backend valida su identidad, el cronograma aplicable, la secuencia de marcaciones y la red autorizada.

## Objetivos

### Objetivo general

Diseñar e implementar un sistema de gestión de asistencia laboral basado en una arquitectura cliente-servidor y el uso de códigos QR.

### Objetivos específicos

- Registrar entradas y salidas de manera digital.
- Administrar usuarios, roles y cronogramas.
- Gestionar solicitudes de cambio puntual de horario y justificaciones de inasistencia.
- Consultar historial, alertas, estadísticas y reportes.
- Proteger las operaciones mediante autenticación, permisos y validación de red.
- Mantener la integridad de los datos mediante MariaDB y migraciones Flyway.

## Arquitectura del sistema

- **Frontend:** Angular, ubicado en `worktrack/`.
- **Backend:** API REST con Node.js y Express, ubicada en `backend/`.
- **Base de datos:** MariaDB. Su esquema y datos iniciales se administran mediante las migraciones de `database/migrations/`.
- **Servicios externos:** Brevo para correos de recuperación, Vercel Blob para archivos justificativos privados y Cloudflare Turnstile para proteger el inicio de sesión.

El navegador se comunica con la API; únicamente el backend accede a la base de datos y a los servicios que requieren claves privadas.

## Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| Angular y TypeScript | Interfaz web |
| Node.js y Express | API y reglas de negocio |
| MariaDB | Persistencia de datos |
| Flyway | Migraciones de la base de datos |
| Docker | Construcción del servicio backend en Railway |
| Git y GitHub | Control de versiones |
| Railway | Despliegue del backend y MariaDB |
| Vercel | Despliegue del frontend y almacenamiento privado de justificativos |
| Brevo | Envío de correos mediante API HTTPS |
| Cloudflare Turnstile | Protección del formulario de inicio de sesión |

## Instalación local

### Requisitos

Se necesitan Git, Node.js, npm, MariaDB y Flyway para ejecutar el proyecto localmente. La base de desarrollo debe estar disponible antes de iniciar el backend.

### Backend

Desde la carpeta principal del repositorio:

```bash
cd backend
npm install
```

Crear `backend/.env` tomando `backend/.env.example` como referencia y completar las variables correspondientes al entorno local. No subir el archivo `.env` ni publicar contraseñas o tokens.

Crear la base MariaDB de desarrollo y aplicar las migraciones Flyway. Los comandos configurados en `backend/package.json` son:

```bash
npm run db:info
npm run db:migrate
npm run db:validate
```

Luego iniciar la API:

```bash
npm start
```

### Frontend

En otra terminal, desde la carpeta principal del repositorio:

```bash
cd worktrack
npm install
npm start
```

La configuración del frontend local debe apuntar a la API local. Para utilizar el escáner también se necesita permiso de cámara y una red autorizada para la modalidad de asistencia correspondiente.

## Pruebas y compilación

Desde la carpeta principal del repositorio:

```bash
npm --prefix backend test
npm --prefix worktrack test -- --watch=false
npm --prefix worktrack run build
```

Las pruebas automáticas se complementan con pruebas funcionales del flujo completo en el entorno local y en el despliegue.

## Base de datos y datos iniciales

Flyway crea y actualiza el esquema. La migración de datos iniciales incorpora los cuatro roles y cuatro usuarios de demostración: administrador, supervisor, empleado y Recursos Humanos. También incorpora permisos, relaciones entre roles y permisos, redes iniciales y catálogos necesarios para el funcionamiento.

En el despliegue, las redes autorizadas se configuran con los rangos efectivos de cada entorno. Los horarios, registros de asistencia y solicitudes generados durante las pruebas no forman parte de los datos iniciales que deben conservarse para la presentación.

Las contraseñas y demás secretos no se publican en este README.

## Despliegue

El frontend se publica en Vercel. El backend y MariaDB se ejecutan en Railway. El repositorio contiene un `Dockerfile` para construir el backend y ejecutar las migraciones requeridas durante el despliegue.

Las variables de entorno de cada servicio se configuran en su plataforma. El frontend, el backend y la base de datos deben quedar conectados mediante las direcciones y credenciales correspondientes; los secretos se mantienen fuera del repositorio.

## Autores

- Valeria Borgatti
- María Días Paredes
- Yeila Insaurralde
- Brisa Zubiri

## Contexto institucional

Proyecto desarrollado en el marco de Prácticas Profesionalizantes III bajo la supervisión del Prof. Sergio Benítez.