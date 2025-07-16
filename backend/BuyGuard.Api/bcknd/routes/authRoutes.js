const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authControllers');
const { authorizeRoles } = require('../middleware/authmiddleware');

router.post('/login', login);
router.get('/me', authenticateToken, getMe);

router.get('/admin-only', authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Witaj adminie!' });
});

router.get('/manager-only', authorizeRoles('manager'), (req, res) => {
  res.json({ message: 'Witaj menedżerze!' });
});

router.get('/user-only', authorizeRoles('user'), (req, res) => {
  res.json({ message: 'Witaj użytkowniku!' });
});

module.exports = router;
