const prisma = require("../config/db");

async function createPrice({ pricePerKg }) {
  return prisma.priceSetting.create({ data: { pricePerKg } });
}

async function getCurrentPrice() {
  return prisma.priceSetting.findFirst({ orderBy: { effectiveAt: "desc" } });
}

module.exports = { createPrice, getCurrentPrice };