const db = require('../config/db');

// ======================================================
// OBTENER EJECUTOR DE CONSULTAS
// ======================================================

function obtenerEjecutor(connection) {
  return connection || db;
}

// ======================================================
// OBTENER USUARIO CON SU ROL
// ======================================================

exports.getUsuarioConRol = async (
  usuarioId,
  connection = null
) => {
  const ejecutor =
    obtenerEjecutor(connection);

  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.estado,
      u.cuenta_bloqueada,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r
      ON u.rol_id = r.id
    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] =
    await ejecutor.query(
      sql,
      [usuarioId]
    );

  return rows[0] || null;
};

// ======================================================
// OBTENER USUARIOS ACTIVOS POR ROL
// ======================================================

exports.getUsuariosActivosPorRoles = async (
  connection,
  roles
) => {
  if (
    !Array.isArray(roles) ||
    roles.length === 0
  ) {
    return [];
  }

  const ejecutor =
    obtenerEjecutor(connection);

  const placeholders =
    roles.map(() => '?').join(', ');

  const sql = `
    SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      r.nombre AS role
    FROM usuarios u
    JOIN roles r
      ON u.rol_id = r.id
    WHERE u.estado = 1
      AND u.cuenta_bloqueada = 0
      AND LOWER(r.nombre) IN (${placeholders})
    ORDER BY
      u.apellido,
      u.nombre,
      u.id
  `;

  const [rows] =
    await ejecutor.query(
      sql,
      roles
    );

  return rows.map(usuario => ({
    ...usuario,
    id: Number(usuario.id),
    role: String(
      usuario.role || ''
    )
      .trim()
      .toLowerCase()
  }));
};

// ======================================================
// CREAR VARIAS NOTIFICACIONES
// ======================================================

exports.createMany = async (
  connection,
  notificaciones
) => {
  if (
    !Array.isArray(notificaciones) ||
    notificaciones.length === 0
  ) {
    return {
      affectedRows: 0
    };
  }

  const ejecutor =
    obtenerEjecutor(connection);

  const placeholders =
    notificaciones
      .map(
        () =>
          '(?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .join(', ');

  const parametros =
    notificaciones.flatMap(
      notificacion => [
        notificacion.usuario_id,
        notificacion.actor_id,
        notificacion.tipo,
        notificacion.titulo,
        notificacion.mensaje,
        notificacion.entidad_tipo,
        notificacion.entidad_id,
        notificacion.creada_en
      ]
    );

  const sql = `
    INSERT INTO notificaciones (
      usuario_id,
      actor_id,
      tipo,
      titulo,
      mensaje,
      entidad_tipo,
      entidad_id,
      creada_en
    )
    VALUES ${placeholders}
  `;

  const [result] =
    await ejecutor.query(
      sql,
      parametros
    );

  return result;
};

// ======================================================
// ELIMINAR NOTIFICACIONES EXCEDENTES
// ======================================================
//
// Conserva solamente las notificaciones más recientes
// del usuario. Si supera el máximo, elimina primero las
// más antiguas.
// ======================================================

exports.deleteExcessByUsuario = async (
  connection,
  usuarioId,
  maximo = 10
) => {
  const ejecutor =
    obtenerEjecutor(connection);

  const sqlExcedentes = `
    SELECT id
    FROM notificaciones
    WHERE usuario_id = ?
    ORDER BY
      creada_en DESC,
      id DESC
    LIMIT 18446744073709551615
    OFFSET ?
  `;

  const [excedentes] =
    await ejecutor.query(
      sqlExcedentes,
      [
        usuarioId,
        maximo
      ]
    );

  if (excedentes.length === 0) {
    return {
      affectedRows: 0
    };
  }

  const ids = excedentes.map(
    notificacion =>
      Number(notificacion.id)
  );

  const placeholders =
    ids.map(() => '?').join(', ');

  const sqlEliminar = `
    DELETE FROM notificaciones
    WHERE usuario_id = ?
      AND id IN (${placeholders})
  `;

  const [result] =
    await ejecutor.query(
      sqlEliminar,
      [
        usuarioId,
        ...ids
      ]
    );

  return result;
};

// ======================================================
// OBTENER NOTIFICACIONES DE UN USUARIO
// ======================================================

exports.getByUsuario = async (
  usuarioId,
  {
    soloNoLeidas = false,
    limite = 10,
    offset = 0
  } = {}
) => {
  const filtroNoLeidas =
    soloNoLeidas
      ? 'AND n.leido = 0'
      : '';

  const sql = `
    SELECT
      n.id,
      n.usuario_id,
      n.actor_id,
      n.tipo,
      n.titulo,
      n.mensaje,
      n.entidad_tipo,
      n.entidad_id,
      n.leido,
      n.creada_en,
      n.leida_en,
      actor.nombre AS actor_nombre,
      actor.apellido AS actor_apellido,
      actor_rol.nombre AS actor_role
    FROM notificaciones n
    LEFT JOIN usuarios actor
      ON n.actor_id = actor.id
    LEFT JOIN roles actor_rol
      ON actor.rol_id = actor_rol.id
    WHERE n.usuario_id = ?
      ${filtroNoLeidas}
    ORDER BY
      n.creada_en DESC,
      n.id DESC
    LIMIT ?
    OFFSET ?
  `;

  const [rows] = await db.query(
    sql,
    [
      usuarioId,
      limite,
      offset
    ]
  );

  return rows.map(notificacion => ({
    ...notificacion,
    id: Number(notificacion.id),
    usuario_id: Number(
      notificacion.usuario_id
    ),
    actor_id:
      notificacion.actor_id === null
        ? null
        : Number(
            notificacion.actor_id
          ),
    entidad_id:
      notificacion.entidad_id === null
        ? null
        : Number(
            notificacion.entidad_id
          ),
    leido: Boolean(
      notificacion.leido
    ),
    actor_role:
      notificacion.actor_role
        ? String(
            notificacion.actor_role
          )
            .trim()
            .toLowerCase()
        : null
  }));
};

// ======================================================
// CONTAR NOTIFICACIONES
// ======================================================

exports.countByUsuario = async (
  usuarioId,
  soloNoLeidas = false
) => {
  const filtroNoLeidas =
    soloNoLeidas
      ? 'AND leido = 0'
      : '';

  const sql = `
    SELECT
      COUNT(*) AS total
    FROM notificaciones
    WHERE usuario_id = ?
      ${filtroNoLeidas}
  `;

  const [rows] = await db.query(
    sql,
    [usuarioId]
  );

  return Number(
    rows[0]?.total || 0
  );
};

// ======================================================
// CONTAR NOTIFICACIONES NO LEÍDAS
// ======================================================

exports.countNoLeidasByUsuario =
  async usuarioId => {
    const sql = `
      SELECT
        COUNT(*) AS total
      FROM notificaciones
      WHERE usuario_id = ?
        AND leido = 0
    `;

    const [rows] = await db.query(
      sql,
      [usuarioId]
    );

    return Number(
      rows[0]?.total || 0
    );
  };

// ======================================================
// BUSCAR NOTIFICACIÓN PROPIA
// ======================================================

exports.getByIdAndUsuario = async (
  notificacionId,
  usuarioId
) => {
  const sql = `
    SELECT
      id,
      usuario_id,
      actor_id,
      tipo,
      titulo,
      mensaje,
      entidad_tipo,
      entidad_id,
      leido,
      creada_en,
      leida_en
    FROM notificaciones
    WHERE id = ?
      AND usuario_id = ?
    LIMIT 1
  `;

  const [rows] = await db.query(
    sql,
    [
      notificacionId,
      usuarioId
    ]
  );

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    id: Number(rows[0].id),
    usuario_id: Number(
      rows[0].usuario_id
    ),
    actor_id:
      rows[0].actor_id === null
        ? null
        : Number(
            rows[0].actor_id
          ),
    entidad_id:
      rows[0].entidad_id === null
        ? null
        : Number(
            rows[0].entidad_id
          ),
    leido: Boolean(
      rows[0].leido
    )
  };
};

// ======================================================
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// ======================================================

exports.markAsRead = async (
  notificacionId,
  usuarioId,
  fechaLectura
) => {
  const sql = `
    UPDATE notificaciones
    SET
      leido = 1,
      leida_en = COALESCE(
        leida_en,
        ?
      )
    WHERE id = ?
      AND usuario_id = ?
      AND leido = 0
  `;

  const [result] = await db.query(
    sql,
    [
      fechaLectura,
      notificacionId,
      usuarioId
    ]
  );

  return result;
};

// ======================================================
// MARCAR TODAS COMO LEÍDAS
// ======================================================

exports.markAllAsRead = async (
  usuarioId,
  fechaLectura
) => {
  const sql = `
    UPDATE notificaciones
    SET
      leido = 1,
      leida_en = COALESCE(
        leida_en,
        ?
      )
    WHERE usuario_id = ?
      AND leido = 0
  `;

  const [result] = await db.query(
    sql,
    [
      fechaLectura,
      usuarioId
    ]
  );

  return result;
};

// ======================================================
// CERRAR NOTIFICACIONES DE UN EVENTO RESUELTO
// ======================================================

exports.markEventAsRead = async (
  connection,
  {
    tipo,
    entidadTipo,
    entidadId,
    fechaLectura
  }
) => {
  const ejecutor =
    obtenerEjecutor(connection);

  const sql = `
    UPDATE notificaciones
    SET
      leido = 1,
      leida_en = COALESCE(
        leida_en,
        ?
      )
    WHERE tipo = ?
      AND entidad_tipo = ?
      AND entidad_id = ?
      AND leido = 0
  `;

  const [result] =
    await ejecutor.query(
      sql,
      [
        fechaLectura,
        tipo,
        entidadTipo,
        entidadId
      ]
    );

  return result;
};