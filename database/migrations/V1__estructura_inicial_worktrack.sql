-- =====================================================
-- WORKTRACK
-- MIGRACIÓN V1: ESTRUCTURA INICIAL
-- Base de referencia: MariaDB 10.4.32
-- =====================================================


-- =====================================================
-- TABLA: roles
-- =====================================================

CREATE TABLE roles (

    id INT NOT NULL AUTO_INCREMENT,

    nombre VARCHAR(50) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT uk_roles_nombre
        UNIQUE (nombre)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: permisos
-- =====================================================

CREATE TABLE permisos (

    id INT NOT NULL AUTO_INCREMENT,

    nombre VARCHAR(100) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT uk_permisos_nombre
        UNIQUE (nombre)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: usuarios
-- =====================================================

CREATE TABLE usuarios (

    id INT NOT NULL AUTO_INCREMENT,

    nombre VARCHAR(30) NOT NULL,

    apellido VARCHAR(30) NOT NULL,

    email VARCHAR(100) NOT NULL,

    password VARCHAR(255) NOT NULL,

    estado TINYINT(1) NOT NULL DEFAULT 1,

    rol_id INT DEFAULT NULL,

    PRIMARY KEY (id),

    CONSTRAINT uk_usuarios_email
        UNIQUE (email),

    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: rol_permiso
-- =====================================================

CREATE TABLE rol_permiso (

    id INT NOT NULL AUTO_INCREMENT,

    rol_id INT DEFAULT NULL,

    permiso_id INT DEFAULT NULL,

    PRIMARY KEY (id),

    INDEX idx_rol_permiso_rol (rol_id),

    INDEX idx_rol_permiso_permiso (permiso_id),

    CONSTRAINT fk_rol_permiso_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id),

    CONSTRAINT fk_rol_permiso_permiso
        FOREIGN KEY (permiso_id)
        REFERENCES permisos(id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: redes_autorizadas
-- =====================================================

CREATE TABLE redes_autorizadas (

    id INT NOT NULL AUTO_INCREMENT,

    nombre VARCHAR(100) NOT NULL,

    tipo ENUM(
        'LOCAL',
        'VPN'
    ) NOT NULL,

    ip_rango VARCHAR(50) NOT NULL,

    estado TINYINT(1) NOT NULL DEFAULT 1,

    PRIMARY KEY (id),

    CONSTRAINT uk_red_tipo_rango
        UNIQUE (tipo, ip_rango)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: horarios
-- =====================================================

CREATE TABLE horarios (

    id INT NOT NULL AUTO_INCREMENT,

    usuario_id INT DEFAULT NULL,

    hora_entrada TIME DEFAULT NULL,

    hora_salida TIME DEFAULT NULL,

    dia_semana VARCHAR(10) NOT NULL,

    tolerancia_minutos INT NOT NULL,

    modalidad ENUM(
        'PRESENCIAL',
        'HOME'
    ) NOT NULL DEFAULT 'PRESENCIAL',

    PRIMARY KEY (id),

    INDEX idx_horarios_usuario (usuario_id),

    CONSTRAINT fk_horarios_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: asistencia
-- =====================================================

CREATE TABLE asistencia (

    id INT NOT NULL AUTO_INCREMENT,

    usuario_id INT DEFAULT NULL,

    red_id INT DEFAULT NULL,

    fecha DATE DEFAULT CURDATE(),

    hora_entrada TIME DEFAULT NULL,

    hora_salida TIME DEFAULT NULL,

    tipo_asistencia VARCHAR(20) NOT NULL,

    ubicacion VARCHAR(100) DEFAULT NULL,

    ip_detectada VARCHAR(45) DEFAULT NULL,

    estado VARCHAR(20) DEFAULT NULL,

    PRIMARY KEY (id),

    INDEX idx_asistencia_usuario (usuario_id),

    INDEX idx_asistencia_red (red_id),

    CONSTRAINT fk_asistencia_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_asistencia_red
        FOREIGN KEY (red_id)
        REFERENCES redes_autorizadas(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: solicitudes
-- =====================================================

CREATE TABLE solicitudes (

    id INT NOT NULL AUTO_INCREMENT,

    usuario_id INT DEFAULT NULL,

    tipo VARCHAR(50) NOT NULL,

    estado VARCHAR(50) DEFAULT NULL,

    fecha DATE DEFAULT CURDATE(),

    hora_inicio TIME DEFAULT NULL,

    hora_fin TIME DEFAULT NULL,

    PRIMARY KEY (id),

    INDEX idx_solicitudes_usuario (usuario_id),

    CONSTRAINT fk_solicitudes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: incidencias
-- =====================================================

CREATE TABLE incidencias (

    id INT NOT NULL AUTO_INCREMENT,

    usuario_id INT DEFAULT NULL,

    descripcion TEXT DEFAULT NULL,

    fecha DATE DEFAULT CURDATE(),

    tipo VARCHAR(50) NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_incidencias_usuario (usuario_id),

    CONSTRAINT fk_incidencias_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;


-- =====================================================
-- TABLA: notificaciones
-- =====================================================

CREATE TABLE notificaciones (

    id INT NOT NULL AUTO_INCREMENT,

    usuario_id INT DEFAULT NULL,

    mensaje TEXT DEFAULT NULL,

    leido TINYINT(1) DEFAULT 0,

    fecha DATE DEFAULT CURDATE(),

    PRIMARY KEY (id),

    INDEX idx_notificaciones_usuario (usuario_id),

    CONSTRAINT fk_notificaciones_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_general_ci;