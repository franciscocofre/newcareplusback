const Notification = require("../models/Notification");
const User = require("../models/User");
const sequelize = require("../config/config"); 
const notificationController = {};

// Crear una notificación
notificationController.createNotification = async (userId, title, message) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
    });
    return notification;
  } catch (error) {
    console.error("Error al crear la notificación:", error);
    throw error;
  }
};

// Obtener notificaciones de un usuario
notificationController.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// Marcar notificaciones como leídas
notificationController.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ error: "Notificación no encontrada." });
    }

    notification.is_read = true;
    await notification.save();

    res.status(200).json({ message: "Notificación marcada como leída.", notification });
  } catch (error) {
    console.error("Error al marcar la notificación como leída:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = notificationController;
