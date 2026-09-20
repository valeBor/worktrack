const db = require('../config/db');

// ======================================================
// FILTROS INTERNOS
// ======================================================

function obtenerFiltroActivos(
  soloActivos
) {
  return soloActivos
    ? 'AND u.estado = 1'
    : '';
}

// ======================================================
// OBTENER ACTOR AUTENTICADO
// ======================================================

exports.getActorById = async actorId => {
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

  const [rows] = await db.query(
    sql,
    [actorId]
  );

  return rows[0] || null;
};

// ======================================================
// USUARIOS REPORTABLES
// ======================================================

async function getUsuariosReportables(
  soloActivos
) {
  const filtroActivos =
    obtenerFiltroActivos(
      soloActivos
    );

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
    WHERE LOWER(r.nombre) IN (
      'empleado',
      'supervisor'
    )
    ${filtroActivos}
    ORDER BY
      FIELD(
        LOWER(r.nombre),
        'supervisor',
        'empleado'
      ),
      u.apellido,
      u.nombre,
      u.id
  `;

  const [rows] = await db.query(sql);

  return rows.map(usuario => ({
    ...usuario,
    estado: Boolean(usuario.estado),
    role: String(usuario.role || '')
      .trim()
      .toLowerCase()
  }));
}

// ======================================================
// USUARIOS DEL REPORTE DIARIO
// ======================================================

exports.getUsuariosReportables = async () => {
  return getUsuariosReportables(true);
};

// ======================================================
// USUARIOS DEL HISTORIAL
// ======================================================
//
// Incluye usuarios inactivos porque sus registros
// históricos deben permanecer disponibles.
// ======================================================

exports.getUsuariosReportablesHistorial =
  async () => {
    return getUsuariosReportables(false);
  };

// ======================================================
// ASISTENCIAS
// ======================================================

async function getAsistencias(
  fechaDesde,
  fechaHasta,
  soloActivos
) {
  const filtroActivos =
    obtenerFiltroActivos(
      soloActivos
    );

  const sql = `
    SELECT
      a.id,
      a.usuario_id,
      DATE_FORMAT(
        a.fecha,
        '%Y-%m-%d'
      ) AS fecha,
      a.hora_entrada,
      a.hora_salida,
      a.tipo_asistencia,
      a.ubicacion,
      a.estado
    FROM asistencia a
    JOIN usuarios u
      ON a.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE a.fecha BETWEEN ? AND ?
      AND LOWER(r.nombre) IN (
        'empleado',
        'supervisor'
      )
      ${filtroActivos}
    ORDER BY
      a.usuario_id,
      a.fecha,
      a.id DESC
  `;

  const [rows] = await db.query(
    sql,
    [
      fechaDesde,
      fechaHasta
    ]
  );

  return rows;
}

// ======================================================
// ASISTENCIAS DEL REPORTE DIARIO
// ======================================================

exports.getAsistenciasByFecha =
  async fecha => {
    return getAsistencias(
      fecha,
      fecha,
      true
    );
  };

// ======================================================
// ASISTENCIAS DEL HISTORIAL
// ======================================================

exports.getAsistenciasByPeriodo = async (
  fechaDesde,
  fechaHasta
) => {
  return getAsistencias(
    fechaDesde,
    fechaHasta,
    false
  );
};

// ======================================================
// HORARIOS
// ======================================================

async function getHorarios(
  fechaDesde,
  fechaHasta,
  soloActivos,
  diaSemana = null
) {
  const filtroActivos =
    obtenerFiltroActivos(
      soloActivos
    );

  const filtroDia = diaSemana
    ? 'AND LOWER(h.dia_semana) = LOWER(?)'
    : '';

  const parametros = [
    fechaHasta,
    fechaDesde
  ];

  if (diaSemana) {
    parametros.push(diaSemana);
  }

  const sql = `
    SELECT
      h.id,
      h.usuario_id,
      h.dia_semana,
      h.hora_entrada,
      h.hora_salida,
      h.tolerancia_minutos,
      h.modalidad,
      DATE_FORMAT(
        h.vigente_desde,
        '%Y-%m-%d'
      ) AS vigente_desde,
      DATE_FORMAT(
        h.vigente_hasta,
        '%Y-%m-%d'
      ) AS vigente_hasta
    FROM horarios h
    JOIN usuarios u
      ON h.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE h.vigente_desde <= ?
      AND (
        h.vigente_hasta IS NULL
        OR h.vigente_hasta >= ?
      )
      AND LOWER(r.nombre) IN (
        'empleado',
        'supervisor'
      )
      ${filtroActivos}
      ${filtroDia}
    ORDER BY
      h.usuario_id,
      h.vigente_desde DESC,
      h.id DESC
  `;

  const [rows] = await db.query(
    sql,
    parametros
  );

  return rows;
}

// ======================================================
// HORARIOS DEL REPORTE DIARIO
// ======================================================

exports.getHorariosByFecha = async (
  fecha,
  diaSemana
) => {
  return getHorarios(
    fecha,
    fecha,
    true,
    diaSemana
  );
};

// ======================================================
// HORARIOS DEL HISTORIAL
// ======================================================

exports.getHorariosByPeriodo = async (
  fechaDesde,
  fechaHasta
) => {
  return getHorarios(
    fechaDesde,
    fechaHasta,
    false
  );
};

// ======================================================
// SOLICITUDES APROBADAS
// ======================================================

async function getCambiosAprobados(
  fechaDesde,
  fechaHasta,
  soloActivos
) {
  const filtroActivos =
    obtenerFiltroActivos(
      soloActivos
    );

  const sql = `
    SELECT
      s.id,
      s.usuario_id,
      DATE_FORMAT(
        s.fecha_solicitada,
        '%Y-%m-%d'
      ) AS fecha_solicitada,
      s.hora_entrada_solicitada,
      s.hora_salida_solicitada,
      s.modalidad_solicitada,
      s.tolerancia_actual
    FROM solicitudes s
    JOIN usuarios u
      ON s.usuario_id = u.id
    JOIN roles r
      ON u.rol_id = r.id
    WHERE s.tipo = 'CAMBIO_HORARIO'
      AND s.estado = 'APROBADA'
      AND s.fecha_solicitada
        BETWEEN ? AND ?
      AND LOWER(r.nombre) IN (
        'empleado',
        'supervisor'
      )
      ${filtroActivos}
    ORDER BY
      s.usuario_id,
      s.fecha_solicitada,
      s.id DESC
  `;

  const [rows] = await db.query(
    sql,
    [
      fechaDesde,
      fechaHasta
    ]
  );

  return rows;
}

// ======================================================
// CAMBIOS DEL REPORTE DIARIO
// ======================================================

exports.getCambiosAprobadosByFecha =
  async fecha => {
    return getCambiosAprobados(
      fecha,
      fecha,
      true
    );
  };

// ======================================================
// CAMBIOS DEL HISTORIAL
// ======================================================

exports.getCambiosAprobadosByPeriodo =
  async (
    fechaDesde,
    fechaHasta
  ) => {
    return getCambiosAprobados(
      fechaDesde,
      fechaHasta,
      false
    );
  };
  // ======================================================
// JUSTIFICACIONES DE INASISTENCIA APROBADAS
// ======================================================

async function getJustificacionesAprobadas(
  fechaDesde,
  fechaHasta,
  soloActivos
) {
  const filtroActivos = obtenerFiltroActivos(
    soloActivos
  );

  const sql = `
    SELECT
      s.id,
      s.usuario_id,
      DATE_FORMAT(
        s.fecha_inasistencia,
        '%Y-%m-%d'
      ) AS fecha_inasistencia,
      s.motivo,
      tj.codigo AS tipo_justificativo,
      tj.nombre AS tipo_justificativo_nombre
    FROM solicitudes s
    JOIN usuarios u
      ON u.id = s.usuario_id
    JOIN roles r
      ON r.id = u.rol_id
    JOIN tipos_justificativo tj
      ON tj.id = s.tipo_justificativo_id
    WHERE s.tipo = 'JUSTIFICACION_INASISTENCIA'
      AND s.estado = 'APROBADA'
      AND s.fecha_inasistencia BETWEEN ? AND ?
      AND LOWER(r.nombre) IN (
        'empleado',
        'supervisor'
      )
      ${filtroActivos}
    ORDER BY
      s.usuario_id,
      s.fecha_inasistencia,
      s.resuelta_en DESC,
      s.id DESC
  `;

  const [rows] = await db.query(sql, [
    fechaDesde,
    fechaHasta
  ]);

  return rows;
}

// ======================================================
// JUSTIFICACIONES DEL REPORTE DIARIO
// ======================================================

exports.getJustificacionesAprobadasByFecha = async fecha => {
  return getJustificacionesAprobadas(
    fecha,
    fecha,
    true
  );
};

// ======================================================
// JUSTIFICACIONES DEL HISTORIAL Y ESTADÍSTICAS
// ======================================================

exports.getJustificacionesAprobadasByPeriodo = async (
  fechaDesde,
  fechaHasta
) => {
  return getJustificacionesAprobadas(
    fechaDesde,
    fechaHasta,
    false
  );
};