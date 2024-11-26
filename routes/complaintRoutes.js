const express = require('express');
const complaintController = require('../controllers/complaintController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const router = express.Router();


router.get(
    "/professional", // Nota: este es el segmento después de "/api/complaints"
    authMiddleware,
    roleMiddleware(["profesional"]),
    complaintController.getComplaintsByProfessional
  );
// Crear un reclamo o sugerencia
router.post('/', authMiddleware, roleMiddleware(['paciente', 'profesional']), complaintController.createComplaint);

// Listar todos los reclamos o sugerencias con opción de filtro por rol
router.get('/with-users', authMiddleware, roleMiddleware(['admin']), complaintController.getAllComplaintsWithUsers);

// Responder a un reclamo o sugerencia
router.put('/:id/response', authMiddleware, roleMiddleware(['admin']), complaintController.respondComplaint);

// Cerrar un reclamo
router.put('/:id/close', authMiddleware, roleMiddleware(['admin']), complaintController.closeComplaint);


router.get('/', authMiddleware, roleMiddleware(['paciente',]), complaintController.getComplaintsByUser);

router.get(
    "/complaints/professional",
    authMiddleware,
    roleMiddleware(["profesional"]),
    complaintController.getComplaintsByProfessional
  );
  

module.exports = router;
