const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'profesional', 'paciente'),
    allowNull: false,
  },
  specialty: DataTypes.STRING, // Solo para profesionales
  biography: DataTypes.TEXT,   // Solo para profesionales
  years_of_experience: DataTypes.INTEGER, // Solo para profesionales
  location: DataTypes.STRING,  // Solo para profesionales
  rate_per_hour: DataTypes.DECIMAL(10, 2), // Solo para profesionales
  address: DataTypes.STRING,   // Solo para pacientes
  phone_number: DataTypes.STRING, // Solo para pacientes
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,  // Se almacena el token de recuperación de contraseña
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,  // Fecha de expiración del token
  }
}, {
  timestamps: true,
  tableName: 'users',
});

module.exports = User;
