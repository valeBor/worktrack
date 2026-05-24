const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');

const { verifyToken } = require('../middlewares/authMiddleware');

const { verifyRole } = require('../middlewares/roleMiddleware');



// GET
router.get(
  '/',
  verifyToken,
  userController.getUsers
);



// POST
router.post(
  '/',
  verifyToken,
  verifyRole('admin'),
  userController.createUser
);



// PUT
router.put(
  '/:id',
  verifyToken,
  verifyRole('admin'),
  userController.updateUser
);



// DELETE
router.delete(
  '/:id',
  verifyToken,
  verifyRole('admin'),
  userController.deleteUser
);



module.exports = router;