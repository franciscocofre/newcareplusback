const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decodificado en authMiddleware:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error en la verificación del token:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
