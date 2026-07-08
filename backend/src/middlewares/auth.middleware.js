const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Non authentifié" });

  try {
    const token = header.replace("Bearer ", "");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = { requireAuth };