const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/recover-password', authController.recoverPassword);
router.post('/reset-password', authController.resetPassword); // Nueva ruta para restablecer contraseña
router.get('/profile', authMiddleware, authController.getProfile);
module.exports = router;
