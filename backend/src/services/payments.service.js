const prisma = require("../config/db");

async function createPayment({ employeeId, amount, paidAt, note }) {
  return prisma.payment.create({
    data: {
      employeeId,
      amount,
      paidAt: new Date(paidAt),
      note,
    },
  });
}

async function listPayments({ employeeId, from, to }) {
  return prisma.payment.findMany({
    where: {
      employeeId: employeeId || undefined,
      paidAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    include: { employee: true },
    orderBy: { paidAt: "desc" },
  });
}

async function updatePayment(id, { amount, paidAt, note }) {
  const data = {};
  if (amount !== undefined) data.amount = amount;
  if (paidAt !== undefined) data.paidAt = new Date(paidAt);
  if (note !== undefined) data.note = note;
  return prisma.payment.update({ where: { id }, data });
}

async function deletePayment(id) {
  return prisma.payment.delete({ where: { id } });
}

module.exports = { createPayment, listPayments, updatePayment, deletePayment };