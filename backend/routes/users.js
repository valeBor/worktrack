const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');


// GET
router.get('/', userController.getUsers);

// POST
router.post('/', userController.createUser);

// PUT
router.put('/:id', userController.updateUser);

// DELETE
router.delete('/:id', userController.deleteUser);

module.exports = router;