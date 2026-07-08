const prisma = require("../config/db");

async function createEmployee({ name, phone, alertNote }) {
  return prisma.employee.create({ data: { name, phone, alertNote } });
}

async function listEmployees() {
  return prisma.employee.findMany({ orderBy: { name: "asc" } });
}

async function getEmployee(id) {
  return prisma.employee.findUnique({ where: { id } });
}

async function updateEmployee(id, { name, phone, alertNote }) {
  const data = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (alertNote !== undefined) data.alertNote = alertNote;
  return prisma.employee.update({ where: { id }, data });
}

async function getSummary(employeeId) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return null;

  const weighings = await prisma.weighing.aggregate({
    where: { employeeId },
    _sum: { amountDue: true },
  });
  const payments = await prisma.payment.aggregate({
    where: { employeeId },
    _sum: { amount: true },
  });

  const totalDue = Number(weighings._sum.amountDue || 0);
  const totalPaid = Number(payments._sum.amount || 0);

  return { employee, totalDue, totalPaid, balance: totalDue - totalPaid };
}

async function deleteEmployee(id) {
  return prisma.employee.delete({ where: { id } });
}

module.exports = {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  getSummary,
  deleteEmployee,
};