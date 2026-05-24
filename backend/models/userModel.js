const db = require('../config/db');


// OBTENER TODOS
exports.getAllUsers = (callback) => {

  const query = `
  
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
  
  `;

  db.query(query, callback);

};



// CREAR
exports.createUser = (userData, callback) => {

  const query = `
  
    INSERT INTO usuarios
    (
      nombre,
      apellido,
      email,
      password,
      estado,
      rol_id
    )
    
    VALUES (?, ?, ?, ?, ?, ?)
  
  `;

  db.query(query, [

    userData.nombre,
    userData.apellido,
    userData.email,
    userData.password,
    userData.estado,
    userData.rol_id

  ], callback);

};



// EDITAR
exports.updateUser = (id, userData, callback) => {

  const query = `
  
    UPDATE usuarios
    
    SET
      nombre = ?,
      apellido = ?,
      email = ?,
      estado = ?,
      rol_id = ?
    
    WHERE id = ?
  
  `;

  db.query(query, [

    userData.nombre,
    userData.apellido,
    userData.email,
    userData.estado,
    userData.rol_id,
    id

  ], callback);

};




// ELIMINAR
exports.deleteUser = (id, callback) => {

  const query = `
  
    DELETE FROM usuarios
    
    WHERE id = ?
  
  `;

  db.query(query, [id], callback);

};