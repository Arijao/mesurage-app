const bcrypt = require("bcrypt");
const prisma = require("../config/db");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

async function createUser({ fullName, email, password, role }) {
  if (!isValidEmail(email)) throw new Error("Format d'email invalide");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email déjà utilisé");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash, role: role === "admin" ? "admin" : "user" },
  });
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
}

async function updateUser(id, { email, role, password }) {
  const data = {};
  if (email !== undefined) {
    if (!isValidEmail(email)) throw new Error("Format d'email invalide");
    data.email = email;
  }
  if (role !== undefined) {
    data.role = role === "admin" ? "admin" : "user";
  }
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  const user = await prisma.user.update({ where: { id }, data });
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = { listUsers, createUser, updateUser, deleteUser, isValidEmail };