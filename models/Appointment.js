const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Appointment = sequelize.define(
  'Appointment',
  {
    professional_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    patient_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending',
      allowNull: false,
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cancellation_status: {
      type: DataTypes.ENUM('none', 'pending_approval', 'approved', 'rejected'),
      defaultValue: 'none',
    },
    cancellation_reason: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    tableName: 'appointments',
  }
);

module.exports = Appointment;
