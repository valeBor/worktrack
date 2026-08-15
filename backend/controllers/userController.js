const bcrypt = require('bcrypt');

const userService =
  require('../services/userService');

const {
  validateUser
} = require('../utils/validators');


// ======================================================
// GET USUARIOS
// ======================================================

exports.getUsers = async (req, res) => {

  try {

    const users =
      await userService.getUsers();

    res.json(users);

  } catch (error) {

    console.error(
      'Error al obtener usuarios:',
      error
    );

    res.status(500).json({
      message: 'Error al obtener usuarios'
    });

  }

};


// ======================================================
// CREAR USUARIO
// ======================================================

exports.createUser = async (req, res) => {

  try {

    const error =
      validateUser(req.body);

    if (error) {

      return res.status(400).json({
        message: error
      });

    }


    const {
      nombre,
      apellido,
      email,
      password,
      estado,
      rol_id
    } = req.body;


    // Generamos hash de la contraseña.

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    const newUser = {

      nombre,
      apellido,
      email,

      password:
        hashedPassword,

      estado,
      rol_id

    };


    await userService.createUser(
      newUser
    );


    res.status(201).json({
      message: 'Usuario creado'
    });

  } catch (error) {

    console.error(
      'Error al crear usuario:',
      error
    );

    res.status(500).json({
      message: 'Error servidor'
    });

  }

};


// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

exports.updateUser = async (req, res) => {

  try {

    const { id } = req.params;


    const {
      nombre,
      apellido,
      email,
      password,
      estado,
      rol_id
    } = req.body;


    // Creamos los datos que siempre
    // se pueden modificar.

    const userData = {

      nombre,
      apellido,
      email,
      estado,
      rol_id

    };


    // ==================================================
    // CONTRASEÑA
    // ==================================================
    //
    // Solamente generamos un hash nuevo
    // si Admin escribió una contraseña.
    //
    // Si viene:
    //
    // password: ""
    //
    // NO modificamos la contraseña existente.
    // ==================================================

    if (
      password &&
      password.trim() !== ''
    ) {

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      userData.password =
        hashedPassword;

    }


    await userService.updateUser(
      id,
      userData
    );


    res.json({
      message: 'Usuario actualizado',
      id: Number(id)
    });

  } catch (error) {

    console.error(
      'Error al actualizar usuario:',
      error
    );


    res.status(500).json({
      message: 'Error servidor'
    });

  }

};


// ======================================================
// ELIMINAR USUARIO
// ======================================================

exports.deleteUser = async (req, res) => {

  try {

    const { id } = req.params;


    await userService.deleteUser(id);


    res.json({
      message: 'Usuario eliminado'
    });

  } catch (error) {

    console.error(
      'Error al eliminar usuario:',
      error
    );


    res.status(500).json({
      message: 'Error servidor'
    });

  }

};