
const { DataTypes } = require('sequelize');
const sequelize = require('../config/config'); // Importa la configuración



const Complaint = sequelize.define('Complaint', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved'),
      defaultValue: 'pending',
    },
  }, {
    timestamps: true,
    tableName: 'complaints',
  });
  
  module.exports = Complaint;
  