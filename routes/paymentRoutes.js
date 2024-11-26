const express = require('express');
const paymentController = require('../controllers/paymentController'); // Asegúrate de que la ruta sea correcta
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const router = express.Router();

// Endpoint para generar el link de pago
router.post(
  '/create-payment-link',
  authMiddleware,
  roleMiddleware(['paciente']),
  paymentController.createPaymentLink
);

// Endpoint para confirmar el pago
router.post(
  '/confirm-payment',
  authMiddleware,
  roleMiddleware(['paciente', 'admin']),
  paymentController.confirmPayment
);

// Endpoint para obtener todos los pagos (solo para administradores)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  paymentController.getAllPayments
);

module.exports = router;
