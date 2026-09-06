const permisoModel = require('../models/permiso.model');

// ======================================================
// VERIFICAR UNO O MÁS PERMISOS
// ======================================================

exports.verifyPermission = (
    ...permisosRecibidos
) => {
    const permisos = permisosRecibidos
        .map(
            (permiso) =>
                String(permiso || '')
                    .trim()
                    .toUpperCase()
        )
        .filter(Boolean);

    if (permisos.length === 0) {
        throw new Error(
            'Debe configurar al menos un permiso.'
        );
    }

    return async (req, res, next) => {
        try {
            const usuarioId =
                Number(req.user?.id);

            if (
                !Number.isInteger(usuarioId) ||
                usuarioId <= 0
            ) {
                return res.status(401).json({
                    mensaje: 'Usuario no autenticado.'
                });
            }

            const autorizacion =
                await permisoModel
                    .verificarPermisosUsuario(
                        usuarioId,
                        permisos
                    );

            if (
                !autorizacion ||
                !autorizacion.estado ||
                autorizacion.cuenta_bloqueada
            ) {
                return res.status(401).json({
                    mensaje:
                        'El usuario no existe, está inactivo o tiene la cuenta bloqueada.'
                });
            }

            if (!autorizacion.autorizado) {
                return res.status(403).json({
                    mensaje:
                        'No tiene permisos para realizar esta acción.'
                });
            }

            next();
        } catch (error) {
            console.error(
                'Error al verificar permisos:',
                error
            );

            return res.status(500).json({
                mensaje:
                    'Error interno al verificar los permisos.'
            });
        }
    };
};