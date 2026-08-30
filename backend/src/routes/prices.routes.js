const express = require("express");
const router = express.Router();
const pricesService = require("../services/prices.service");
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/current", requireAuth, async (req, res) => {
  const price = await pricesService.getCurrentPrice();
  res.json(price);
});

router.get("/", requireAuth, async (req, res) => {
  const prices = await pricesService.listPrices();
  res.json(prices);
});

router.post("/", requireAuth, async (req, res) => {
  const { pricePerKg, effectiveAt } = req.body;
  if (!pricePerKg) {
    return res.status(400).json({ error: "Champ requis: pricePerKg" });
  }
  const price = await pricesService.createPrice({ pricePerKg, effectiveAt });
  res.status(201).json(price);
});

router.delete("/", requireAuth, async (req, res) => {
  await pricesService.deleteAllPrices();
  res.status(204).send();
});

module.exports = router;