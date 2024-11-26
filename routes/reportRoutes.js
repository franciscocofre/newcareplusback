// Importamos las dependencias necesarias
const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware de autenticación
const roleMiddleware = require('../middlewares/roleMiddleware'); // Middleware para roles
const router = express.Router();

// Ruta para obtener el reporte de los profesionales con más citas completadas
// Solo accesible para administradores (admin)
router.get(
  '/top-professionals',
  authMiddleware, // Verifica que el usuario esté autenticado
  roleMiddleware(['admin']), // Verifica que el usuario tenga rol de administrador
  reportController.getTopProfessionalsByAppointments // Controlador que maneja esta lógica
);

// Ruta para obtener el total de ingresos por profesional
router.get(
  '/total-earnings',
  authMiddleware,
  roleMiddleware(['admin','profesional']),
  reportController.getTotalEarningsByProfessional
);

// Ruta para obtener el reporte de citas clasificadas por estado
router.get(
  '/appointments-by-status',
  authMiddleware,
  roleMiddleware(['admin']),
  reportController.getAppointmentsByStatus
);

// Ruta para obtener el reporte de los profesionales con más horas disponibles
router.get(
  '/top-availability',
  authMiddleware,
  roleMiddleware(['admin']),
  reportController.getProfessionalsByAvailability
);

// Nueva ruta: Recaudación total (suma de todos los ingresos de citas completadas)
router.get(
  '/total-revenue',
  authMiddleware,
  roleMiddleware(['admin']),
  reportController.getTotalRevenue
);

// Nueva ruta: Profesionales con más ingresos recaudados
router.get(
  '/top-earnings-professionals',
  authMiddleware,
  roleMiddleware(['admin']),
  reportController.getTopEarningsProfessionals
);

// Exportamos el router para que esté disponible en toda la aplicación
module.exports = router;
