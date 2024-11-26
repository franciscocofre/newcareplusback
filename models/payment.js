const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const Appointment = require('./Appointment');

const Payment = sequelize.define(
  'Payment',
  {
    appointment_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Appointment,
        key: 'id',
      },
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    payment_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: 'payments',
  }
);

module.exports = Payment;
