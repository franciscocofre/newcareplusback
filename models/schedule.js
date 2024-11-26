const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./User');

const Schedule = sequelize.define('Schedule', {
  professional_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  available_from: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  available_to: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'schedules',
});

module.exports = Schedule;
