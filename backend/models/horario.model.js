const db = require('../config/db');

// ======================================================
// OBTENER USUARIO CON SU ROL
// ======================================================

exports.getUsuarioConRol = async (usuarioId) => {
  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.estado,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r
      ON u.rol_id = r.id
    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [usuarioId]);

  return rows[0];
};

// ======================================================
// USUARIOS GESTIONABLES SEGÚN ROLES
// ======================================================

exports.getUsuariosGestionables = async (roles) => {
  const placeholders = roles.map(() => '?').join(', ');

  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.estado,
      u.rol_id,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r
      ON u.rol_id = r.id
    WHERE LOWER(r.nombre) IN (${placeholders})
      AND u.estado = 1
    ORDER BY
      u.apellido,
      u.nombre
  `;

  const [rows] = await db.query(sql, roles);

  return rows;
};

// ======================================================
// OBTENER HORARIOS VIGENTES SEGÚN ROLES
// ======================================================

exports.getAllByRoles = async (roles) => {
  const placeholders = roles.map(() => '?').join(', ');

  const sql = `
    SELECT
      h.id,
      h.usuario_id,
      h.dia_semana,
      h.hora_entrada,
      h.hora_salida,
      h.tolerancia_minutos,
      h.modalidad,
      h.vigente_desde,
      h.vigente_hasta,
      u.nombre,
      u.apellido,
      u.email,
      r.nombre AS role
    FROM horarios h
    JOIN usuarios u
      ON h.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE LOWER(r.nombre) IN (${placeholders})
      AND h.vigente_hasta IS NULL
    ORDER BY
      u.apellido,
      u.nombre,
      FIELD(
        LOWER(h.dia_semana),
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes',
        'sabado',
        'domingo'
      )
  `;

  const [rows] = await db.query(sql, roles);

  return rows;
};

// ======================================================
// HORARIOS VIGENTES DE UN USUARIO
// ======================================================

exports.getByUsuario = async (usuarioId) => {
  const sql = `
    SELECT
      h.id,
      h.usuario_id,
      h.dia_semana,
      h.hora_entrada,
      h.hora_salida,
      h.tolerancia_minutos,
      h.modalidad,
      h.vigente_desde,
      h.vigente_hasta,
      u.nombre,
      u.apellido,
      u.email,
      r.nombre AS role
    FROM horarios h
    JOIN usuarios u
      ON h.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE h.usuario_id = ?
      AND h.vigente_hasta IS NULL
    ORDER BY FIELD(
      LOWER(h.dia_semana),
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
      'domingo'
    )
  `;

  const [rows] = await db.query(sql, [usuarioId]);

  return rows;
};

// ======================================================
// BUSCAR HORARIO VIGENTE POR USUARIO Y DÍA
// ======================================================

exports.getByUsuarioAndDia = async (
  usuarioId,
  diaSemana
) => {
  const sql = `
    SELECT
      id,
      usuario_id,
      dia_semana,
      hora_entrada,
      hora_salida,
      tolerancia_minutos,
      modalidad,
      vigente_desde,
      vigente_hasta
    FROM horarios
    WHERE usuario_id = ?
      AND LOWER(dia_semana) = LOWER(?)
      AND vigente_hasta IS NULL
    ORDER BY vigente_desde DESC, id DESC
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [
    usuarioId,
    diaSemana
  ]);

  return rows[0];
};

// ======================================================
// BUSCAR HORARIO APLICABLE EN UNA FECHA
// ======================================================

exports.getByUsuarioAndDiaEnFecha = async (
  usuarioId,
  diaSemana,
  fecha
) => {
  const sql = `
    SELECT
      id,
      usuario_id,
      dia_semana,
      hora_entrada,
      hora_salida,
      tolerancia_minutos,
      modalidad,
      vigente_desde,
      vigente_hasta
    FROM horarios
    WHERE usuario_id = ?
      AND LOWER(dia_semana) = LOWER(?)
      AND vigente_desde <= ?
      AND (
        vigente_hasta IS NULL
        OR vigente_hasta >= ?
      )
    ORDER BY vigente_desde DESC, id DESC
    LIMIT 1
  `;

  const [rows] = await db.query(sql, [
    usuarioId,
    diaSemana,
    fecha,
    fecha
  ]);

  return rows[0];
};

// ======================================================
// CREAR UN HORARIO
// ======================================================

exports.create = async (
  connection,
  horario
) => {
  const sql = `
    INSERT INTO horarios (
      usuario_id,
      hora_entrada,
      hora_salida,
      dia_semana,
      tolerancia_minutos,
      modalidad,
      vigente_desde,
      vigente_hasta
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `;

  const [result] = await connection.query(sql, [
    horario.usuario_id,
    horario.hora_entrada,
    horario.hora_salida,
    horario.dia_semana,
    horario.tolerancia_minutos,
    horario.modalidad,
    horario.vigente_desde
  ]);

  return result;
};

// ======================================================
// CERRAR CRONOGRAMA VIGENTE
// ======================================================

exports.cerrarCronogramaVigente = async (
  connection,
  usuarioId,
  fechaActual,
  fechaAnterior
) => {
  const sqlEliminarMismoDia = `
    DELETE FROM horarios
    WHERE usuario_id = ?
      AND vigente_hasta IS NULL
      AND vigente_desde >= ?
  `;

  const [eliminados] = await connection.query(
    sqlEliminarMismoDia,
    [
      usuarioId,
      fechaActual
    ]
  );

  const sqlCerrarAnteriores = `
    UPDATE horarios
    SET vigente_hasta = ?
    WHERE usuario_id = ?
      AND vigente_hasta IS NULL
      AND vigente_desde < ?
  `;

  const [cerrados] = await connection.query(
    sqlCerrarAnteriores,
    [
      fechaAnterior,
      usuarioId,
      fechaActual
    ]
  );

  return {
    eliminados: eliminados.affectedRows,
    cerrados: cerrados.affectedRows
  };
};

// ======================================================
// CERRAR CRONOGRAMA VIGENTE
// ======================================================

exports.cerrarCronogramaVigente = async (
  connection,
  usuarioId,
  fechaInicioNuevaVigencia,
  fechaCierreAnterior
) => {
  const sqlEliminarMismoDia = `
    DELETE FROM horarios
    WHERE usuario_id = ?
      AND vigente_hasta IS NULL
      AND vigente_desde >= ?
  `;

  const [eliminados] = await connection.query(
    sqlEliminarMismoDia,
    [
      usuarioId,
      fechaInicioNuevaVigencia
    ]
  );

  const sqlCerrarAnteriores = `
    UPDATE horarios
    SET vigente_hasta = ?
    WHERE usuario_id = ?
      AND vigente_hasta IS NULL
      AND vigente_desde < ?
  `;

  const [cerrados] = await connection.query(
    sqlCerrarAnteriores,
    [
      fechaCierreAnterior,
      usuarioId,
      fechaInicioNuevaVigencia
    ]
  );

  return {
    eliminados: eliminados.affectedRows,
    cerrados: cerrados.affectedRows
  };
};

// ======================================================
// OBTENER HORARIOS QUE APLICAN EN UN PERÍODO
// ======================================================

exports.getHistorialByUsuarioAndPeriodo = async (
  usuarioId,
  fechaDesde,
  fechaHasta
) => {
  const sql = `
    SELECT
      id,
      usuario_id,
      dia_semana,
      hora_entrada,
      hora_salida,
      tolerancia_minutos,
      modalidad,
      DATE_FORMAT(
        vigente_desde,
        '%Y-%m-%d'
      ) AS vigente_desde,
      DATE_FORMAT(
        vigente_hasta,
        '%Y-%m-%d'
      ) AS vigente_hasta
    FROM horarios
    WHERE usuario_id = ?
      AND vigente_desde <= ?
      AND (
        vigente_hasta IS NULL
        OR vigente_hasta >= ?
      )
    ORDER BY
      vigente_desde ASC,
      id ASC
  `;

  const [rows] = await db.query(sql, [
    usuarioId,
    fechaHasta,
    fechaDesde
  ]);

  return rows;
};

// ======================================================
// OBTENER PRIMERA FECHA CON HORARIO CONOCIDO
// ======================================================

exports.getPrimeraVigenciaByUsuario = async (
  usuarioId
) => {
  const sql = `
    SELECT
      DATE_FORMAT(
        MIN(vigente_desde),
        '%Y-%m-%d'
      ) AS primera_vigencia
    FROM horarios
    WHERE usuario_id = ?
  `;

  const [rows] = await db.query(sql, [
    usuarioId
  ]);

  return rows[0]?.primera_vigencia || null;
};