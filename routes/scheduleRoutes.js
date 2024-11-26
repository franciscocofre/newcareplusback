// backend/routes/scheduleRoutes.js

const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const router = express.Router();

// Rutas de horarios (solo profesionales pueden crear horarios)
router.post('/', authMiddleware, roleMiddleware(['profesional']), scheduleController.createSchedule);

// Ruta para obtener horarios de un profesional específico (accesible para todos los roles)
router.get('/:professional_id/available-schedules', authMiddleware, scheduleController.getSchedulesByProfessional);

module.exports = router;
