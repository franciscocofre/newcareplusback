const express = require("express");
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Obtener notificaciones del usuario autenticado
router.get("/", authMiddleware, notificationController.getUserNotifications);

// Marcar una notificación como leída
router.put("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;
