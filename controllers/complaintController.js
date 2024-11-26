const { sequelize } = require('../models');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

const complaintController = {};

// Crear un reclamo o sugerencia
complaintController.createComplaint = async (req, res) => {
  try {
    const { title, description } = req.body;
    const user_id = req.user.userId;

    if (!title || !description) {
      return res.status(400).json({ error: 'El título y la descripción son obligatorios.' });
    }

    const complaint = await Complaint.create({ user_id, title, description });
    res.status(201).json({ message: 'Reclamo o sugerencia enviado exitosamente.', complaint });
  } catch (error) {
    console.error('Error al crear el reclamo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Obtener reclamos con información de los usuarios y filtro por rol
complaintController.getAllComplaintsWithUsers = async (req, res) => {
  try {
    const { role } = req.query; // Paciente o profesional (opcional)

    const whereClause = role
      ? `WHERE u.role = '${role}'` // Agregar filtro por rol si se proporciona
      : '';

    const complaints = await sequelize.query(
      `
      SELECT 
          c.id AS complaint_id,
          c.title AS complaint_title,
          c.description AS complaint_description,
          c.response AS complaint_response,
          c.status AS complaint_status,
          c."createdAt" AS complaint_created_at,
          c."updatedAt" AS complaint_updated_at,
          u.id AS user_id,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role
      FROM 
          complaints AS c
      JOIN 
          users AS u
      ON 
          c.user_id = u.id
      ${whereClause}
      ORDER BY 
          c."createdAt" DESC
      `,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.status(200).json(complaints);
  } catch (error) {
    console.error('Error al obtener los reclamos con usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Responder a un reclamo
complaintController.respondComplaint = async (req, res) => {
    try {
      const { id } = req.params; // ID del reclamo
      const { response } = req.body; // Respuesta enviada por el administrador
  
      // Verificar que el ID exista
      const complaint = await Complaint.findByPk(id);
      if (!complaint) {
        return res.status(404).json({ error: 'Reclamo no encontrado.' });
      }
  
      // Actualizar el reclamo con la respuesta y cambiar el estado
      complaint.response = response;
      complaint.status = 'resolved';
      await complaint.save();
  
      res.status(200).json({ message: 'Respuesta enviada exitosamente.', complaint });
    } catch (error) {
      console.error('Error al responder el reclamo:', error);
      res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
    }
  };
  
  // Cerrar un reclamo
  complaintController.closeComplaint = async (req, res) => {
    try {
      const { id } = req.params;
  
      const complaint = await Complaint.findByPk(id, {
        include: { model: User, attributes: ["id", "name"] },
      });
  
      if (!complaint) {
        return res.status(404).json({ error: "Reclamo no encontrado." });
      }
  
      complaint.status = "closed";
      await complaint.save();
  
      // Crear notificación
      await notificationController.createNotification(
        complaint.user_id,
        "Reclamo Cerrado",
        `Tu reclamo "${complaint.title}" ha sido cerrado.`
      );
  
      res.status(200).json({ message: "Reclamo cerrado exitosamente.", complaint });
    } catch (error) {
      console.error("Error al cerrar el reclamo:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  };
//solo para pacientes
  complaintController.getComplaintsByUser = async (req, res) => {
    try {
      const userId = req.user.userId;
      const complaints = await Complaint.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json(complaints);
    } catch (error) {
      console.error("Error al obtener los reclamos del usuario:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  };

//solo para profesionales

complaintController.getComplaintsByProfessional = async (req, res) => {
  try {
    const professionalId = req.user.userId;

    const complaints = await Complaint.findAll({
      where: { user_id: professionalId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error al obtener los reclamos del profesional:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};



module.exports = complaintController;
