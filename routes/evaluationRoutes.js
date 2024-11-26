const express = require('express');
const evaluationController = require('../controllers/evaluationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['paciente']), evaluationController.createEvaluation);
// Obtener evaluaciones de un profesional (Debe permitir "profesional")
router.get('/professional/:professional_id',authMiddleware,roleMiddleware(['profesional','admin']), evaluationController.getEvaluationsByProfessional);
router.get('/appointment/:appointment_id', authMiddleware, evaluationController.getEvaluationByAppointment);
// Nuevo: Obtener evaluaciones de un usuario autenticado
router.get('/user', authMiddleware, evaluationController.getEvaluationsByUser); 

router.get(
    '/details',
    authMiddleware,
    roleMiddleware(['profesional']),
    evaluationController.getProfessionalDetails
  );
  

module.exports = router;
