const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

async function register({ fullName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email déjà utilisé");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { fullName, email, passwordHash } });
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  return { token, user: { id: user.id, fullName: user.fullName, email: user.email } };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error("Identifiants invalides");
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  return { token, user: { id: user.id, fullName: user.fullName, email: user.email } };
}

module.exports = { register, login };