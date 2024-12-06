const axios = require("axios");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const Payment = require("../models/payment"); // Asegúrate de tener definido este modelo

const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_BASE_URL = process.env.FLOW_BASE_URL;

const paymentController = {};

// Crear link de pago con Flow
// Crear link de pago con Flow
paymentController.createPaymentLink = async (req, res) => {
  try {
    const { appointment_id } = req.body;

    // Validar appointment_id
    if (!appointment_id) {
      return res.status(400).json({ error: "El ID de la cita no es válido." });
    }

    // Obtener la cita de la base de datos
    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    // Parámetros requeridos para Flow
    const params = {
      apiKey: FLOW_API_KEY,
      commerceOrder: `ORD-${appointment.id}-${Date.now()}`, // Identificador único
      subject: `Pago por cita médica - ID ${appointment.id}`,
      amount: parseFloat(appointment.total_price).toFixed(2), // Monto como número con 2 decimales
      email: req.user.email, // Asegúrate de que `req.user` esté correctamente configurado
      urlConfirmation: `${process.env.BACKEND_URL}/api/payments/confirm-payment`,
      urlReturn: `${process.env.FRONTEND_URL}/payment-success`,
    };

    // Verificar que las URLs sean accesibles
    if (!params.urlConfirmation.startsWith("http")) {
      return res
        .status(400)
        .json({ error: "La URL de confirmación debe ser accesible públicamente." });
    }

    if (!params.urlReturn.startsWith("http")) {
      return res
        .status(400)
        .json({ error: "La URL de retorno debe ser accesible públicamente." });
    }

    // Ordenar los parámetros por clave para generar la firma
    const orderedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    // Generar la firma (HMAC-SHA256)
    const signature = crypto
      .createHmac("sha256", FLOW_SECRET_KEY)
      .update(orderedParams)
      .digest("base64");

    // Realizar la solicitud a Flow
    const response = await axios.post(`${FLOW_BASE_URL}/payment/create`, {
      ...params,
      s: signature, // Adjuntar la firma
    });

    // Devolver el link de pago generado
    if (response.data && response.data.url) {
      res.status(201).json({ paymentLink: response.data.url });
    } else {
      res.status(500).json({ error: "No se pudo generar el link de pago." });
    }
  } catch (error) {
    console.error(
      "Error al crear link de pago:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Error al procesar el pago",
      details: error.response?.data || error.message,
    });
  }
};


// Confirmar el pago recibido de Flow
paymentController.confirmPayment = async (req, res) => {
  try {
    const { commerceOrder } = req.body;

    if (!commerceOrder) {
      return res.status(400).json({ error: "Orden de comercio no proporcionada." });
    }

    const appointmentId = commerceOrder.split("-")[1];

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    appointment.status = "confirmed";
    await appointment.save();

    res.status(200).json({ message: "Pago confirmado y cita actualizada." });
  } catch (error) {
    console.error("Error al confirmar el pago:", error.message);
    res.status(500).json({
      error: "Error al confirmar el pago",
      details: error.message,
    });
  }
};

// Obtener todos los pagos (solo para administradores)
paymentController.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error al obtener los pagos", details: error.message });
  }
};

module.exports = paymentController;
