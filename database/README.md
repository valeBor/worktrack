WorkTrack: Sistema de Gestión Laboral y Control de Asistencia mediante QR
1. Descripción del Proyecto
WorkTrack es una plataforma web integral diseñada para la optimización del registro de jornada laboral. El sistema emplea tecnología de códigos QR para digitalizar el control de asistencia, garantizando la trazabilidad de la información y minimizando errores operativos en la administración de personal.

La solución está orientada a organizaciones que requieren centralizar la gestión de recursos humanos a través de una estructura de permisos jerárquica, permitiendo una supervisión eficiente del presentismo en tiempo real.

2. Objetivos
2.1 Objetivo General
Diseñar e implementar un sistema distribuido para la gestión de asistencia laboral basado en tecnología de identificación QR y arquitectura cliente-servidor.

2.2 Objetivos Específicos
Desarrollar un módulo de autenticación robusto con control de acceso basado en roles (RBAC).

Implementar el registro digital de ingresos y egresos de personal.

Diseñar un esquema de persistencia de datos bajo el modelo relacional para asegurar la integridad de la información.

Proveer una interfaz administrativa para la gestión de usuarios, horarios y permisos.

3. Arquitectura del Sistema
El proyecto se fundamenta en una arquitectura de tres capas:

Capa de Presentación (Frontend): Desarrollada en Angular, encargada de la interfaz de usuario y la lógica de navegación.

Capa de Aplicación (Backend): API REST construida en Node.js mediante el framework Express, gestionando la lógica de negocio y seguridad.

Capa de Persistencia (Base de Datos): Implementada en MySQL para la gestión de datos relacionales.

Flujo de Datos: Frontend (HTTP/JSON) <-> Backend (ORM/SQL) <-> Base de Datos.

4. Tecnologías y Herramientas
Framework Frontend: Angular

Entorno de Ejecución Backend: Node.js

Framework de Servidor: Express

Motor de Base de Datos: MySQL

Herramienta de Administración de Datos: DBeaver

Control de Versiones: Git / GitHub

5. Diseño de la Base de Datos
El sistema se basa en un modelo entidad-relación que garantiza la integridad referencial. Las entidades principales incluyen:

Usuarios: Almacena credenciales (encriptadas) e información de perfil.

Roles: Define los niveles de acceso (Administrador, RRHH, Supervisor, Empleado).

Asistencia: Registra marcas temporales vinculadas a los usuarios.

6. Procedimiento de Instalación y Despliegue
6.1 Configuración del Backend
Acceder al directorio del servidor: cd backend

Instalar dependencias: npm install

Ejecutar script de inicialización de la base de datos: npm run init-db

Iniciar servidor de desarrollo: node server.js

6.2 Configuración del Frontend
Acceder al directorio de la aplicación: cd worktrack

Instalar dependencias: npm install

Iniciar entorno local: ng serve

7. Credenciales de Acceso (Entorno de Pruebas)
Para validar las funcionalidades de administración, se ha habilitado la siguiente cuenta de prueba:

Usuario: admin@test.com

Clave: 123456

8. Funcionalidades Implementadas y Cronograma
Fase Actual: Autenticación de usuarios, gestión de sesiones mediante tokens y control de rutas por rol.

Próximas Implementaciones: * Módulo de generación y lectura de códigos QR.

Sistema de validación por geolocalización.

Generación de reportes estadísticos y exportación de datos.

9. Autores
Nombre y Apellido: Borgatti Valeria
Nombre y Apellido: Dias Paredes Maria
Nombre y Apellido: Insaurralde Yeila
Nombre y Apellido: Zubiri Brisa

10. Contexto Institucional
Este proyecto se desarrolla en el marco de las Prácticas Profesionalizantes III, bajo la supervisión del Prof. Sergio Benitez. El trabajo integra conceptos avanzados de ingeniería de software, seguridad informática y administración de sistemas de bases de datos.