//backend/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true para port 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Función para enviar correos electrónicos
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo enviado con éxito');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('Error al enviar el correo');
  }
};

module.exports = {
  sendEmail
};
