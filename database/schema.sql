CREATE DATABASE IF NOT EXISTS worktrack;
USE worktrack;

-- 🔹 ROLES
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 🔹 USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL,
  apellido VARCHAR(30) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  estado BOOLEAN NOT NULL,
  rol_id INT,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- 🔹 PERMISOS
CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

-- 🔹 RELACIÓN ROL - PERMISOS
CREATE TABLE IF NOT EXISTS rol_permiso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rol_id INT,
  permiso_id INT,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (permiso_id) REFERENCES permisos(id)
);

-- 🔹 HORARIOS
CREATE TABLE IF NOT EXISTS horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  hora_entrada TIME,
  hora_salida TIME,
  dia_semana VARCHAR(10) NOT NULL,
  tolerancia_minutos INT NOT NULL,

  modalidad ENUM('PRESENCIAL', 'HOME') NOT NULL DEFAULT 'PRESENCIAL',

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 🔹 REDES AUTORIZADAS
CREATE TABLE IF NOT EXISTS redes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('LOCAL', 'VPN') NOT NULL,
  ip_rango VARCHAR(50) NOT NULL,
  estado BOOLEAN NOT NULL DEFAULT TRUE,

  UNIQUE KEY uk_red_tipo_rango (tipo, ip_rango)
);


-- 🔹 ASISTENCIA
CREATE TABLE IF NOT EXISTS asistencia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  red_id INT,

  fecha DATE,
  hora_entrada TIME,
  hora_salida TIME,
  tipo_asistencia VARCHAR(20),
  ubicacion VARCHAR(100),
  ip_detectada VARCHAR(45),
  estado VARCHAR(20),

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

  FOREIGN KEY (red_id)
    REFERENCES redes(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- 🔹 SOLICITUDES
CREATE TABLE IF NOT EXISTS solicitudes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  tipo VARCHAR(50) NOT NULL,
  estado VARCHAR(50),
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 🔹 INCIDENCIAS
CREATE TABLE IF NOT EXISTS incidencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  descripcion TEXT,
  fecha DATE,
  tipo VARCHAR(50) NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 🔹 NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  mensaje TEXT,
  leido BOOLEAN DEFAULT FALSE,
  fecha DATE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
