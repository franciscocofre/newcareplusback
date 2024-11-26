const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Report = sequelize.define('Report', {
  report_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'reports',
});

module.exports = Report;
