const prisma = require("../config/db");

async function createPrice({ pricePerKg, effectiveAt }) {
  return prisma.priceSetting.create({
    data: {
      pricePerKg,
      ...(effectiveAt ? { effectiveAt: new Date(effectiveAt) } : {}),
    },
  });
}

async function getCurrentPrice() {
  return prisma.priceSetting.findFirst({ orderBy: { effectiveAt: "desc" } });
}

async function listPrices() {
  return prisma.priceSetting.findMany({ orderBy: { effectiveAt: "desc" } });
}

async function deleteAllPrices() {
  return prisma.priceSetting.deleteMany({});
}

module.exports = { createPrice, getCurrentPrice, listPrices, deleteAllPrices };