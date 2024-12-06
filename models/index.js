const Sequelize = require('sequelize');
const sequelize = require('../config/config');

// Importar modelos existentes
const User = require('./User');
const Appointment = require('./Appointment');
const Schedule = require('./schedule.js');
const Payment = require('./payment.js');
const Report = require('./report');
const Complaint = require('./Complaint');
const Notification = require("./Notification");
// Importar nuevo modelo
const Evaluation = require('./Evaluation.js')(sequelize);

// Relación de citas
User.hasMany(Appointment, { foreignKey: 'professional_id', as: 'professional_appointments' });
User.hasMany(Appointment, { foreignKey: 'patient_id', as: 'patient_appointments' });
Appointment.belongsTo(User, { foreignKey: 'professional_id', as: 'professional' });
Appointment.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });

// Relación de horarios
User.hasMany(Schedule, { foreignKey: 'professional_id', as: 'schedules' });
Schedule.belongsTo(User, { foreignKey: 'professional_id', as: 'professional' });

// Relación de pagos
Appointment.hasOne(Payment, { foreignKey: 'appointment_id', as: 'payment' });
Payment.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// Relación de evaluaciones

Appointment.hasOne(Evaluation, { foreignKey: 'appointment_id', as: 'evaluation' });
Evaluation.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

User.hasMany(Evaluation, { foreignKey: 'patient_id', as: 'patient_evaluations' });
User.hasMany(Evaluation, { foreignKey: 'professional_id', as: 'professional_evaluations' });

Evaluation.belongsTo(User, { foreignKey: 'patient_id', as: 'patient' });
Evaluation.belongsTo(User, { foreignKey: 'professional_id', as: 'professional' });

User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Definir relaciones
User.hasMany(Complaint, { foreignKey: 'user_id', as: 'complaints' });
Complaint.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// Exportar modelos y sequelize para sincronización y consultas
module.exports = {
  sequelize,
  User,
  Appointment,
  Schedule,
  Payment,
  Report,
  Evaluation,
  Complaint,
  Notification,
};
