const jwt = require('jsonwebtoken');

// Función para crear un token
const createToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Función para verificar un token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  createToken,
  verifyToken
};
