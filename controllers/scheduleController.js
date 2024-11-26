// backend/controllers/scheduleController.js
const Appointment = require('../models/Appointment'); 
const { Op } = require('sequelize'); 
const Schedule = require('../models/Schedule');

const scheduleController = {};

// Crear múltiples horarios de disponibilidad (solo para profesionales)
scheduleController.createSchedule = async (req, res) => {
  try {
    const professional_id = req.user.userId;
    const { date, times } = req.body;

    if (!times || times.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un horario' });
    }

    const formattedSchedules = times.map((time) => ({
      professional_id,
      available_from: new Date(time),
      available_to: new Date(new Date(time).getTime() + 40 * 60 * 1000), // Bloque de 40 minutos
    }));

    const createdSchedules = await Schedule.bulkCreate(formattedSchedules);

    res.status(201).json({
      message: 'Horarios creados con éxito',
      schedules: createdSchedules,
    });
  } catch (error) {
    console.error('Error al crear horarios:', error.message);
    res.status(400).json({ error: 'Error al crear los horarios', details: error.message });
  }
};

// Obtener horarios disponibles de un profesional en bloques de 40 minutos
scheduleController.getSchedulesByProfessional = async (req, res) => {
  const { professional_id } = req.params;
  try {
    const schedules = await Schedule.findAll({
      where: { professional_id },
      attributes: ['id', 'available_from', 'available_to'],
      order: [['available_from', 'ASC']]
    });

    const availableSchedules = [];

    for (const schedule of schedules) {
      let start = new Date(schedule.available_from);
      const end = new Date(schedule.available_to);

      while (start < end) {
        const blockEnd = new Date(start.getTime() + 40 * 60 * 1000); // Bloque de 40 minutos
        if (blockEnd > end) break;

        // Verificar si el bloque tiene citas conflictivas en estados "pending" o "confirmed"
        const conflictingAppointment = await Appointment.findOne({
          where: {
            professional_id,
            scheduled_time: { [Op.between]: [start, blockEnd] },
            status: { [Op.in]: ['pending', 'confirmed'] }  // Considerar tanto "pending" como "confirmed"
          }
        });

        if (!conflictingAppointment) {
          availableSchedules.push({ from: new Date(start), to: new Date(blockEnd) });
        }

        start = new Date(start.getTime() + 40 * 60 * 1000); // Avanzar al siguiente bloque de 40 minutos
      }
    }

    if (availableSchedules.length === 0) {
      return res.status(404).json({ error: 'No se encontraron horarios disponibles' });
    }

    res.json({ schedules: availableSchedules });
  } catch (error) {
    console.error('Error al obtener los horarios en el backend:', error.message);
    res.status(500).json({ error: 'Error al obtener horarios disponibles', details: error.message });
  }
};

module.exports = scheduleController;
