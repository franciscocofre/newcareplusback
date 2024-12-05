require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configuración de Sequelize con soporte SSL para Azure PostgreSQL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432, // Incluye el puerto predeterminado para PostgreSQL
  dialect: 'postgres',
  logging: false, // Evita que los logs de consultas saturen la consola
  dialectOptions: {
    ssl: {
      require: true, // Forzar el uso de SSL (requerido por Azure PostgreSQL)
      rejectUnauthorized: false, // Permite certificados autofirmados
    },
  },
  pool: {
    max: 5, // Número máximo de conexiones en el pool
    min: 0, // Número mínimo de conexiones en el pool
    acquire: 30000, // Tiempo máximo para adquirir una conexión (ms)
    idle: 10000, // Tiempo máximo que una conexión puede estar inactiva (ms)
  },
});

// Exporta la instancia configurada de Sequelize
module.exports = sequelize;
