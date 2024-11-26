const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const router = express.Router();

// Crear una nueva cita (solo para pacientes)
router.post('/', authMiddleware, roleMiddleware(['paciente']), appointmentController.createAppointment);

// Obtener todas las citas (solo para administradores)
router.get('/', authMiddleware, roleMiddleware(['admin']), appointmentController.getAllAppointments);

// Obtener detalles de una cita por ID (para profesionales y administradores)
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'profesional']), appointmentController.getAppointmentById);

// Eliminar una cita (solo para administradores)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), appointmentController.deleteAppointment);

// Actualizar el estado de una cita (solo para profesionales o administradores)
router.put('/:id/status', authMiddleware, roleMiddleware(['admin', 'profesional']), appointmentController.updateAppointmentStatus);

// Cancelar una cita (solo para pacientes)
router.post('/cancel', authMiddleware, roleMiddleware(['paciente']), appointmentController.cancelAppointment);

// Obtener citas simplificadas para profesionales
router.get(
  '/professional/simplified',
  authMiddleware,
  roleMiddleware(['profesional']),
  appointmentController.getProfessionalAppointmentsSimplified
);

// Obtener citas simplificadas para pacientes
router.get(
  '/patient/simplified',
  authMiddleware,
  roleMiddleware(['paciente']),
  appointmentController.getPatientAppointmentsSimplified
);

router.get(
  '/patient/completed',
  authMiddleware,
  roleMiddleware(['paciente','profesional']),
  appointmentController.getCompletedAppointments
);

module.exports = router;
