// backend/controllers/reportController.js

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Schedule = require('../models/schedule');
const { Op, Sequelize, fn, literal } = require('sequelize');

const reportController = {};

// Reporte de los profesionales con más citas completadas
reportController.getTopProfessionalsByAppointments = async (req, res) => {
  try {
    const professionals = await Appointment.findAll({
      where: { status: 'completed' },
      attributes: [
        'professional_id',
        [Sequelize.fn('COUNT', Sequelize.col('Appointment.id')), 'completed_appointments']
      ],
      include: [{
        model: User,
        as: 'professional',
        attributes: ['name', 'specialty', 'id']
      }],
      group: ['professional_id', 'professional.id', 'professional.name', 'professional.specialty'],
      order: [[Sequelize.literal('completed_appointments'), 'DESC']],
      limit: 10
    });

    res.status(200).json({ topProfessionals: professionals });
  } catch (error) {
    console.error('Error al obtener el reporte de profesionales:', error.message);
    res.status(500).json({ error: 'Error al obtener el reporte de profesionales' });
  }
};

// Reporte de ingresos totales por profesional
reportController.getTotalEarningsByProfessional = async (req, res) => {
  try {
    const earnings = await Appointment.findAll({
      where: { status: 'completed' },
      attributes: [
        'professional_id',
        [Sequelize.fn('SUM', Sequelize.col('total_price')), 'total_earnings']
      ],
      include: [{
        model: User,
        as: 'professional',
        attributes: ['name', 'specialty', 'id']
      }],
      group: ['professional_id', 'professional.id', 'professional.name', 'professional.specialty'],
      order: [[Sequelize.literal('total_earnings'), 'DESC']]
    });

    res.status(200).json({ earningsByProfessional: earnings });
  } catch (error) {
    console.error('Error al obtener el reporte de ingresos:', error.message);
    res.status(500).json({ error: 'Error al obtener el reporte de ingresos' });
  }
};

// Recaudación total (suma de todo lo recaudado)
reportController.getTotalRevenue = async (req, res) => {
  try {
    const totalRevenue = await Appointment.sum('total_price', {
      where: { status: 'completed' }
    });
    res.status(200).json({ totalRevenue });
  } catch (error) {
    console.error('Error al obtener la recaudación total:', error.message);
    res.status(500).json({ error: 'Error al obtener la recaudación total' });
  }
};

// Profesionales con más ingresos recaudados
reportController.getTopEarningsProfessionals = async (req, res) => {
  try {
    const topEarningsProfessionals = await Appointment.findAll({
      where: { status: 'completed' },
      attributes: [
        'professional_id',
        [Sequelize.fn('SUM', Sequelize.col('total_price')), 'total_earnings'],
        [Sequelize.fn('MAX', Sequelize.col('created_at')), 'latest_date'],
      ],
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['name', 'specialty', 'id', 'role'],
        },
      ],
      group: [
        'professional_id',
        'professional.id',
        'professional.name',
        'professional.specialty',
        'professional.role',
      ],
      order: [[Sequelize.literal('total_earnings'), 'DESC']],
      limit: 10,
    });

    if (!topEarningsProfessionals || topEarningsProfessionals.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos.' });
    }

    res.status(200).json({ topEarningsProfessionals });
  } catch (error) {
    console.error(
      'Error al obtener el reporte de profesionales con más ingresos:',
      error.message
    );
    res.status(500).json({
      error:
        'Error interno al obtener el reporte de profesionales con más ingresos',
      details: error.message,
    });
  }
};

// Reporte de citas por estado
reportController.getAppointmentsByStatus = async (req, res) => {
  try {
    const appointmentsByStatus = await Appointment.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('Appointment.id')), 'count']
      ],
      group: ['status']
    });

    res.status(200).json({ appointmentsByStatus });
  } catch (error) {
    console.error('Error al obtener el reporte de citas por estado:', error.message);
    res.status(500).json({ error: 'Error al obtener el reporte de citas por estado' });
  }
};

// Reporte de los profesionales con más horas disponibles
reportController.getProfessionalsByAvailability = async (req, res) => {
  try {
    const professionalsByAvailability = await Schedule.findAll({
      attributes: [
        'professional_id',
        [fn('SUM', literal("EXTRACT(EPOCH FROM (available_to - available_from)) / 3600")), 'total_available_hours']
      ],
      include: [
        {
          model: User,
          as: 'professional',
          attributes: ['name', 'specialty'],
          where: { role: 'profesional' }
        }
      ],
      group: ['professional_id', 'professional.id'],
      order: [[literal('total_available_hours'), 'DESC']],
      limit: 10
    });

    res.status(200).json({ professionalsByAvailability });
  } catch (error) {
    console.error('Error al obtener el reporte de disponibilidad de profesionales:', error.message);
    res.status(500).json({ error: 'Error al obtener el reporte de disponibilidad de profesionales' });
  }
};

module.exports = reportController;
