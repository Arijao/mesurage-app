const prisma = require("../config/db");

async function createWeighing({ employeeId, weightKg, qualityName, pricePerKg, weighedAt }) {
  const amountDue = Number(weightKg) * Number(pricePerKg);
  return prisma.weighing.create({
    data: { employeeId, weightKg, qualityName, pricePerKg, amountDue, weighedAt: new Date(weighedAt) },
  });
}

async function listWeighings({ employeeId, from, to }) {
  return prisma.weighing.findMany({
    where: {
      employeeId: employeeId || undefined,
      weighedAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    include: { employee: true },
    orderBy: { weighedAt: "desc" },
  });
}

async function updateWeighing(id, { weightKg, qualityName, pricePerKg, weighedAt }) {
  const data = {};
  if (weightKg !== undefined) data.weightKg = weightKg;
  if (qualityName !== undefined) data.qualityName = qualityName;
  if (pricePerKg !== undefined) data.pricePerKg = pricePerKg;
  if (weighedAt !== undefined) data.weighedAt = new Date(weighedAt);

  if (data.weightKg !== undefined || data.pricePerKg !== undefined) {
    const current = await prisma.weighing.findUnique({ where: { id } });
    const newWeight = data.weightKg !== undefined ? Number(data.weightKg) : Number(current.weightKg);
    const newPrice = data.pricePerKg !== undefined ? Number(data.pricePerKg) : Number(current.pricePerKg);
    data.amountDue = newWeight * newPrice;
  }

  return prisma.weighing.update({ where: { id }, data });
}

async function deleteWeighing(id) {
  return prisma.weighing.delete({ where: { id } });
}

module.exports = { createWeighing, listWeighings, updateWeighing, deleteWeighing };