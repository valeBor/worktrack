# WorkTrack
Sistema de Gestión Laboral y Control de Asistencia mediante QR

---

## Descripción del Proyecto

WorkTrack es una plataforma web integral diseñada para optimizar el registro de jornada laboral mediante tecnología QR.

El sistema permite centralizar la gestión de asistencia, supervisar presentismo en tiempo real y administrar usuarios mediante roles jerárquicos.

---

##  Objetivos

### Objetivo General

Diseñar e implementar un sistema distribuido para la gestión de asistencia laboral basado en tecnología QR y arquitectura cliente-servidor.

### Objetivos Específicos

- Implementar autenticación segura mediante RBAC.
- Registrar ingresos y egresos digitales.
- Garantizar integridad de datos mediante modelo relacional.
- Administrar usuarios, horarios y permisos.

---

## Arquitectura del Sistema

### Frontend
- Angular

### Backend
- Node.js
- Express
- API REST

### Base de Datos
- MySQL

### Flujo de Datos

Frontend ↔ Backend ↔ Base de Datos

---

##  Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| Angular | Frontend |
| Node.js | Backend |
| Express | API REST |
| MySQL | Persistencia |
| DBeaver | Administración DB |
| Git/GitHub | Control de versiones |

---

##  Instalación

### Backend

```bash
cd backend
npm install
npm run init-db
node server.js
```

### Frontend

```bash
cd worktrack
npm install
ng serve
```

---

##  Credenciales de Prueba

```txt
Usuario: admin@test.com
Clave: 123456
```

---

##  Autores

- Borgatti Valeria
- Dias Paredes Maria
- Insaurralde Yeila
- Zubiri Brisa

---

##  Contexto Institucional

Proyecto desarrollado en el marco de Prácticas Profesionalizantes III bajo la supervisión del Prof. Sergio Benitez.
