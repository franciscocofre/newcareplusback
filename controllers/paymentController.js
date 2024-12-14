const axios = require("axios");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const Payment = require("../models/payment");

const FLOW_API_KEY = process.env.FLOW_API_KEY;
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY;
const FLOW_BASE_URL = process.env.FLOW_BASE_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

const paymentController = {};

// Crear link de pago con Flow
paymentController.createPaymentLink = async (req, res) => {
  try {
    const { appointment_id } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ error: "El ID de la cita no es válido." });
    }

    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    const amount = Math.round(appointment.total_price); // Convertir a entero

    const params = {
      apiKey: FLOW_API_KEY,
      commerceOrder: `ORD-${appointment.id}-${Date.now()}`,
      subject: `Pago por cita médica - ID ${appointment.id}`,
      amount: amount, // Enviar como entero
      email: req.user?.email || "test@example.com",
      urlConfirmation: `${BACKEND_URL}/api/payments/confirm-payment`,
      urlReturn: `${FRONTEND_URL}/app/patient/page.js`,
    };

    // Log detallado para depuración
    console.log("Parámetros enviados a Flow:", params);

    // Ordenar los parámetros por clave para generar la firma
    const orderedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    const signature = crypto
      .createHmac("sha256", FLOW_SECRET_KEY)
      .update(orderedParams)
      .digest("base64");

    console.log("Parámetros ordenados para la firma:", orderedParams);
    console.log("Firma generada:", signature);

    // Realizar la solicitud a Flow
    const response = await axios.post(`${FLOW_BASE_URL}/payment/create`, {
      ...params,
      s: signature,
    });

    console.log("Respuesta de Flow:", response.data);

    await Payment.create({
      appointment_id: appointment_id,
      payment_method: "Flow",
      payment_status: "pending",
      amount: amount,
    });

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
    const { commerceOrder, status } = req.body;

    if (!commerceOrder) {
      return res.status(400).json({ error: "Orden de comercio no proporcionada." });
    }

    const appointmentId = commerceOrder.split("-")[1];

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Cita no encontrada." });
    }

    // Actualizar estado de la cita y el pago según el estado recibido
    if (status === 1) {
      appointment.status = "confirmed";
      await Payment.update(
        { payment_status: "completed" },
        { where: { appointment_id: appointmentId } }
      );
    } else {
      appointment.status = "cancelled";
      await Payment.update(
        { payment_status: "failed" },
        { where: { appointment_id: appointmentId } }
      );
    }

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
    const payments = await Payment.findAll({
      include: [{ model: Appointment, as: "appointment" }],
    });
    res.json(payments);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error al obtener los pagos", details: error.message });
  }
};

module.exports = paymentController;
