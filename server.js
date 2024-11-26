require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/config');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;


// Configurar CORS
app.use(cors({ origin: 'http://localhost:3000' }));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/evaluations", require("./routes/evaluationRoutes"));


// Sincronizar y arrancar servidor
sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al conectar a la base de datos:', err);
});