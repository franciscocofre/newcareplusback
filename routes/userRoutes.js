const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const router = express.Router();


// Ruta protegida para obtener estadísticas del profesional
router.get('/professional/:id/stats', authMiddleware, roleMiddleware(['profesional','admin']), userController.getProfessionalStats);


router.get('/professionals/specialty', authMiddleware, roleMiddleware(['profesional','paciente']), userController.getProfessionalsBySpecialty);
// Endpoint para calificar profesionales
router.post('/appointments/rate', authMiddleware, roleMiddleware(['paciente']), userController.rateProfessional);

// Ruta para obtener información del usuario
router.get(
  '/info',
  authMiddleware,
  roleMiddleware(['profesional','admin','paciente']),
  userController.getUserInfo
);


router.get('/:id', authMiddleware, roleMiddleware(['profesional','admin']), userController.getUserById);
router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getAllUsers);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), userController.updateUser);

router.delete('/:id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);

module.exports = router;
