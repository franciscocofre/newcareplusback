const { User, Appointments, Evaluations, sequelize } = require('../models');
const userController = {};

// Consultar todos los usuarios
userController.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener usuarios', details: error.message });
  }
};

// Consultar usuario por ID
userController.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener el usuario', details: error.message });
  }
};

// Modificar usuario
userController.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await user.update(req.body);
    res.json({ message: 'Usuario actualizado con éxito', user });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar usuario', details: error.message });
  }
};

// Eliminar usuario
userController.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await user.destroy();
    res.json({ message: 'Usuario eliminado con éxito' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar usuario', details: error.message });
  }
};

// Controlador para obtener profesionales por especialidad
userController.getProfessionalsBySpecialty = async (req, res) => {
  const { specialty } = req.query;
  try {
    const professionals = await User.findAll({
      where: {
        role: 'profesional',
        specialty, // Filtrar por especialidad
      },
    });
    res.status(200).json({ professionals });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener profesionales', details: error.message });
  }
};

// Calificar a un profesional
userController.rateProfessional = async (req, res) => {
  try {
    console.log("Datos recibidos en el endpoint:", req.body);
    console.log("Usuario autenticado:", req.user);

    const { appointmentId, rating, comment } = req.body;
    const patientId = req.user.userId;

    if (!patientId) {
      return res.status(400).json({ error: "No se pudo identificar al paciente." });
    }

    if (!appointmentId || !rating) {
      return res.status(400).json({ error: "Appointment ID y calificación son requeridos." });
    }

    // Verificar si la cita pertenece al paciente y está completada
    const [appointment] = await sequelize.query(
      `SELECT id, professional_id, status 
       FROM appointments 
       WHERE id = :appointmentId AND patient_id = :patientId 
       LIMIT 1`,
      {
        replacements: { appointmentId, patientId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!appointment) {
      return res.status(404).json({ error: "Cita no encontrada o no pertenece al paciente." });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ error: "Solo se pueden calificar citas completadas." });
    }

    // Verificar si ya existe una evaluación para la cita
    const [existingEvaluation] = await sequelize.query(
      `SELECT id 
       FROM evaluations 
       WHERE appointment_id = :appointmentId 
       LIMIT 1`,
      {
        replacements: { appointmentId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (existingEvaluation) {
      return res.status(400).json({ error: "Esta cita ya ha sido calificada." });
    }

    // Crear la evaluación
    await sequelize.query(
      `INSERT INTO evaluations (appointment_id, patient_id, professional_id, rating, comment, created_at, updated_at) 
       VALUES (:appointmentId, :patientId, :professionalId, :rating, :comment, NOW(), NOW())`,
      {
        replacements: {
          appointmentId,
          patientId,
          professionalId: appointment.professional_id,
          rating,
          comment: comment || null,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    console.log("Evaluación creada exitosamente.");
    return res.status(201).json({ message: "Calificación enviada exitosamente." });
  } catch (error) {
    console.error("Error interno en rateProfessional:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};



userController.getProfessionalStats = async (req, res) => {
  try {
    // Obtener el ID del profesional desde el token autenticado o como parámetro
    const professionalId = req.params.id 
      ? parseInt(req.params.id, 10) 
      : req.user.userId;

    // Validar que el ID sea un número válido
    if (isNaN(professionalId)) {
      return res.status(400).json({ error: 'El ID del profesional no es válido.' });
    }

    // Buscar información del profesional
    const professional = await User.findOne({
      where: { id: professionalId, role: 'profesional' },
      attributes: ['id', 'name', 'specialty'],
    });

    // Verificar si el profesional existe
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado.' });
    }

    // Obtener estadísticas: citas completadas y calificación promedio
    const [completedAppointments, averageRating] = await Promise.all([
      Appointments.count({
        where: { professional_id: professionalId, status: 'completed' },
      }),
      Evaluations.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating'],
        ],
        where: { professional_id: professionalId },
        raw: true,
      }),
    ]);

    // Construir la respuesta con estadísticas
    const stats = {
      name: professional.name,
      specialty: professional.specialty,
      completedAppointments,
      averageRating: averageRating?.average_rating
        ? parseFloat(averageRating.average_rating).toFixed(2)
        : "0.00", // Manejo de calificaciones vacías
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas del profesional:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};


// Controlador para obtener información del usuario autenticado

userController.getUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verifica que userId exista y sea válido
    if (!userId) {
      return res.status(400).json({ error: 'El ID del usuario no es válido.' });
    }

    const user = await User.findOne({
      where: { id: userId },
      attributes: [
        'name',
        'address',
        'phone_number',
        'email',
        'role',
        'specialty',
        'rate_per_hour',
      ],
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error al obtener información del usuario:', error.message);
    res.status(500).json({ error: 'Error al obtener información del usuario.' });
  }
};

module.exports = userController;
