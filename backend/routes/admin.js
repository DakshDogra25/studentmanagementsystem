const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  adminListUsers,
  adminGetUser,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
} = require('../controllers/userController');

router.use(authenticate, authorize('admin'));

router.get('/users', adminListUsers);
router.post('/users', adminCreateUser);
router.get('/users/:id', adminGetUser);
router.put('/users/:id', adminUpdateUser);
router.delete('/users/:id', adminDeleteUser);

module.exports = router;
