const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/config');
const {Evaluation } = require('../models');

const appointmentController = {};

// Crear una nueva cita (solo para pacientes)
appointmentController.createAppointment = async (req, res) => {
  try {
    const { professional_id, scheduled_time } = req.body;
    const patient_id = req.user.userId;

    if (!professional_id || isNaN(parseInt(professional_id))) {
      return res.status(400).json({ error: 'El ID del profesional no es válido.' });
    }
    if (!patient_id || isNaN(parseInt(patient_id))) {
      return res.status(400).json({ error: 'El ID del paciente no es válido.' });
    }

    const appointmentStart = new Date(scheduled_time);
    if (isNaN(appointmentStart)) {
      return res.status(400).json({ error: 'La fecha y hora de la cita no son válidas' });
    }

    const professional = await User.findOne({ where: { id: professional_id, role: 'profesional' } });
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    if (!professional.rate_per_hour) {
      return res.status(400).json({ error: 'El profesional no tiene una tarifa establecida.' });
    }

    const blockEnd = new Date(appointmentStart.getTime() + 40 * 60 * 1000);

    const conflictingAppointment = await Appointment.findOne({
      where: {
        professional_id,
        status: 'confirmed',
        [Op.or]: [
          { scheduled_time: { [Op.between]: [appointmentStart, blockEnd] } },
          { scheduled_time: { [Op.between]: [new Date(appointmentStart.getTime() - 40 * 60 * 1000), appointmentStart] } },
        ]
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ error: 'Este bloque de horario ya está reservado. Selecciona otro.' });
    }

    const newAppointment = await Appointment.create({
      professional_id: parseInt(professional_id),
      patient_id: parseInt(patient_id),
      scheduled_time: appointmentStart,
      total_price: professional.rate_per_hour,
      status: 'pending',
    });

    res.status(201).json({ message: 'Cita creada con éxito', appointment: newAppointment });
  } catch (error) {
    console.error('Error al crear la cita:', error.message);
    res.status(400).json({ error: 'Error al crear la cita', details: error.message });
  }
};

// Obtener todas las citas (solo para administradores)
appointmentController.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({ include: [User] });
    res.json(appointments);
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener las citas', details: error.message });
  }
};

// Obtener cita por ID (solo para profesional o administrador)
appointmentController.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, { include: [User] });
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener la cita', details: error.message });
  }
};

// Eliminar una cita (solo para administradores)
appointmentController.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await appointment.destroy();
    res.json({ message: 'Cita eliminada con éxito' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar la cita', details: error.message });
  }
};

// Actualizar estado de la cita (solo para profesional o administrador)
appointmentController.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const { status } = req.body;
    appointment.status = status;
    await appointment.save();

    res.json({ message: 'Estado de la cita actualizado', appointment });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar la cita', details: error.message });
  }
};

// Cancelar una cita
appointmentController.cancelAppointment = async (req, res) => {
  try {
    const { appointment_id, cancellation_reason } = req.body;

    if (!appointment_id || !cancellation_reason) {
      return res.status(400).json({ error: 'Se requiere el ID de la cita y un motivo de cancelación.' });
    }

    const appointment = await Appointment.findByPk(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    if (appointment.patient_id !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita.' });
    }

    const currentTime = new Date();
    const scheduledTime = new Date(appointment.scheduled_time);
    const differenceInHours = (scheduledTime - currentTime) / (1000 * 60 * 60);

    if (differenceInHours < 24) {
      return res.status(400).json({ error: 'Solo puedes cancelar citas con al menos 24 horas de anticipación.' });
    }

    appointment.status = 'cancelled';
    appointment.cancellation_status = 'approved';
    appointment.cancellation_reason = cancellation_reason;
    appointment.cancellation_initiator = 'patient';
    appointment.cancellation_requested_at = currentTime;

    await appointment.save();

    res.status(200).json({ message: 'Cita cancelada exitosamente.', appointment });
  } catch (error) {
    console.error('Error al cancelar la cita:', error);
    res.status(500).json({ error: 'Error al cancelar la cita.' });
  }
};

// Obtener citas simplificadas por profesional
appointmentController.getProfessionalAppointmentsSimplified = async (req, res) => {
  try {
    const professional_id = req.user.userId;

    const appointments = await sequelize.query(
      `
      SELECT 
        a.id,
        a.status,
        a.total_price,
        a.scheduled_time,
        u.name AS patient_name,
        u.address AS patient_address
      FROM 
        appointments AS a
      JOIN 
        users AS u ON u.id = a.patient_id
      WHERE 
        a.professional_id = :professional_id
      `,
      {
        replacements: { professional_id },
        type: QueryTypes.SELECT,
      }
    );

    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener citas para el profesional:', error.message);
    res.status(400).json({ error: 'Error al obtener citas', details: error.message });
  }
};

// Obtener citas simplificadas por paciente
appointmentController.getPatientAppointmentsSimplified = async (req, res) => {
  try {
    const patient_id = req.user.userId;

    const appointments = await sequelize.query(
      `
      SELECT 
        a.id,
        a.status,
        a.total_price,
        a.scheduled_time,
        u.name AS professional_name,
        u.email AS professional_email
      FROM 
        appointments AS a
      JOIN 
        users AS u ON u.id = a.professional_id
      WHERE 
        a.patient_id = :patient_id
      `,
      {
        replacements: { patient_id },
        type: QueryTypes.SELECT,
      }
    );

    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener citas para el paciente:', error.message);
    res.status(400).json({ error: 'Error al obtener citas', details: error.message });
  }
}; 

// Obtener citas con evaluación
appointmentController.getAppointmentsWithEvaluations = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { status: 'completed' },
      include: [
        {
          model: Evaluation,
          as: 'evaluation',
          attributes: ['rating', 'comment'],
        },
      ],
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error al obtener citas con evaluaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}; 

// Obtener citas completadas de un paciente
appointmentController.getCompletedAppointments = async (req, res) => {
  try {
    const patientId = req.user.userId;

    const appointments = await Appointment.findAll({
      where: { 
        patient_id: patientId, 
        status: 'completed' 
      },
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['name'],
        },
        {
          model: Evaluation,
          as: 'evaluation',
          required: false, // Left join para incluir citas sin evaluación
          attributes: ['id'], // Solo queremos saber si hay evaluación
        },
      ],
      order: [['scheduled_time', 'DESC']],
    });

    // Filtrar citas que no tienen evaluación
    const nonEvaluatedAppointments = appointments.filter(
      (appointment) => !appointment.evaluation
    );

    if (!nonEvaluatedAppointments.length) {
      return res
        .status(404)
        .json({ error: 'No se encontraron citas completadas no evaluadas.' });
    }

    res.status(200).json(nonEvaluatedAppointments);
  } catch (error) {
    console.error('Error al obtener citas completadas no evaluadas:', error);
    res
      .status(500)
      .json({ error: 'Error interno al obtener citas completadas.' });
  }
};

module.exports = appointmentController;
