const { sequelize, User, Evaluation,Appointment} = require('../models'); // Importa sequelize desde tu configuración de modelos
const { QueryTypes } = require('sequelize'); // Importar QueryTypes para consultas SQL directas

const evaluationController = {};

// Crear una evaluación
evaluationController.createEvaluation = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const patientId = req.user.userId;

    if (!appointmentId || !rating) {
      return res.status(400).json({ error: 'La cita y la calificación son obligatorias.' });
    }

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, patient_id: patientId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada.' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({
        error: 'Solo se pueden evaluar citas completadas.',
      });
    }

    const evaluation = await Evaluation.create({
      appointment_id: appointmentId,
      patient_id: patientId,
      professional_id: appointment.professional_id,
      rating,
      comment,
    });

    res.status(201).json({ message: 'Evaluación creada con éxito.', evaluation });
  } catch (error) {
    console.error('Error al crear la evaluación:', error);
    res.status(500).json({ error: 'Error interno al crear la evaluación.' });
  }
};


// Obtener evaluaciones por profesional
evaluationController.getEvaluationsByProfessional = async (req, res) => {
  try {
    // Obtener el ID del profesional desde el token autenticado o como parámetro
    const professionalId = req.params.id 
      ? parseInt(req.params.id, 10) 
      : req.user.userId;

    // Validar que el ID sea un número válido
    if (isNaN(professionalId)) {
      return res.status(400).json({ error: 'El ID del profesional no es válido.' });
    }

    // Buscar evaluaciones del profesional
    const evaluations = await Evaluation.findAll({
      where: { professional_id: professionalId },
      attributes: ['id', 'rating', 'comment', 'created_at'],
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['name'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Verificar si existen evaluaciones
    if (!evaluations || evaluations.length === 0) {
      return res.status(404).json({ error: 'No se encontraron evaluaciones para este profesional.' });
    }

    res.status(200).json(evaluations);
  } catch (error) {
    console.error('Error al obtener evaluaciones por profesional:', error.message);
    res.status(500).json({ error: 'Error interno al obtener evaluaciones.' });
  }
};

// Obtener evaluación por cita
evaluationController.getEvaluationByAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    const evaluation = await Evaluation.findOne({
      where: { appointment_id },
      include: [
        { model: User, as: 'patient', attributes: ['name'] },
        { model: User, as: 'professional', attributes: ['name'] },
      ],
    });

    if (!evaluation) {
      return res.status(404).json({ error: 'Evaluación no encontrada.' });
    }

    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error al obtener evaluación por cita:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
 


// Obtener evaluaciones de un usuario
evaluationController.getEvaluationsByUser = async (req, res) => {
    try {
        const userId = req.user.userId; // ID del usuario autenticado

        const evaluations = await Evaluation.findAll({
            where: { patient_id: userId },
            include: [
                { model: User, as: 'professional', attributes: ['name', 'specialty'] }
            ],
            order: [['created_at', 'DESC']],
        });

        if (!evaluations.length) {
            return res.status(404).json({ error: 'No se encontraron evaluaciones.' });
        }

        res.status(200).json(evaluations);
    } catch (error) {
        console.error('Error al obtener evaluaciones del usuario:', error.message);
        res.status(500).json({ error: 'Error interno al obtener evaluaciones.' });
    }
}; 



// Nuevo endpoint para obtener información del profesional
evaluationController.getProfessionalDetails = async (req, res) => {
  try {
    const professionalId = req.user.userId; // ID del profesional autenticado

    if (!professionalId) {
      return res.status(400).json({ error: 'ID del profesional no proporcionado.' });
    }

    const professionalDetails = await sequelize.query(
      `
      SELECT 
        u.name AS professional_name,
        u.specialty,
        u.email,
        u.phone_number,
        COALESCE(AVG(e.rating), 0) AS average_rating
      FROM users u
      LEFT JOIN evaluations e ON u.id = e.professional_id
      WHERE u.id = :professionalId AND u.role = 'profesional'
      GROUP BY u.id, u.name, u.specialty, u.email, u.phone_number
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { professionalId },
      }
    );

    if (!professionalDetails || professionalDetails.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado.' });
    }

    res.status(200).json(professionalDetails[0]);
  } catch (error) {
    console.error('Error al obtener detalles del profesional:', error);
    res.status(500).json({ error: 'Error interno al obtener los detalles del profesional.', details: error.message });
  }
};

module.exports = evaluationController;
