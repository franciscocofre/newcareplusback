const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const nodemailer = require('nodemailer');
const { sendEmail } = require('../services/emailService'); // Importar servicio de correo
const { Op } = require('sequelize');
const authController = {};

// Registro de usuarios
authController.register = async (req, res) => {
  try {
    const { name, email, password, role, specialty, biography, years_of_experience, location, rate_per_hour, address, phone_number } = req.body;

    if (!['paciente', 'profesional'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      specialty: role === 'profesional' ? specialty : null,
      biography: role === 'profesional' ? biography : null,
      years_of_experience: role === 'profesional' ? years_of_experience : null,
      location: role === 'profesional' ? location : null,
      rate_per_hour: role === 'profesional' ? rate_per_hour : null,
      address: role === 'paciente' ? address : null,
      phone_number: role === 'paciente' ? phone_number : null,
    });

    res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
  } catch (error) {
    res.status(400).json({ error: 'Error en el registro', details: error.message });
  }
};

// Inicio de sesión
authController.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log("Rol del usuario al iniciar sesión:", user.role);

    // Generar token con información adicional si es necesario
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Inicio de sesión exitoso', token, role: user.role });
  } catch (error) {
    console.error("Error en el backend (login):", error);
    res.status(400).json({ error: 'Error al iniciar sesión', details: error.message });
  }
};


// controllers/authController.js
authController.recoverPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // Expira en 15 minutos
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    const emailBody = `Para recuperar tu contraseña, haz clic en el siguiente enlace: ${resetUrl}`;

    await sendEmail(user.email, 'Recuperación de contraseña', emailBody);
    res.json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    res.status(500).json({ error: 'Error al enviar correo de recuperación', details: error.message });
  }
};


authController.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar al usuario con el ID del token y token válido
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: Date.now() }, // Comprobar que el token no ha expirado
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Actualizar la contraseña
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Contraseña restablecida con éxito' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña', details: error.message });
  }
};

// Obtener perfil de usuario
authController.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Este userId viene del token

    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'name', 'email', 'role'] // Ajusta los atributos según lo que necesites
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(400).json({ error: 'Error al obtener el perfil del usuario', details: error.message });
  }
};
module.exports = authController;
