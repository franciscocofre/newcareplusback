const roleMiddleware = (roles) => {
  return (req, res, next) => {
    console.log("Token decodificado en roleMiddleware:", req.user);
    console.log("Roles permitidos:", roles);
    if (!roles.includes(req.user.role)) {
      console.error(`Acceso denegado: el rol ${req.user.role} no está permitido`);
      return res.status(403).json({ error: "Acceso denegado" });
    }
    console.log(`Acceso concedido para el rol: ${req.user.role}`);
    next();
  };
};

module.exports = roleMiddleware;
