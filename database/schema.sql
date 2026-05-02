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

-- 🔹 ASISTENCIA
CREATE TABLE IF NOT EXISTS asistencia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  fecha DATE,
  hora_entrada TIME,
  hora_salida TIME,
  tipo_asistencia VARCHAR(20),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);