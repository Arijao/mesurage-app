const express = require("express");
const router = express.Router();
const pricesService = require("../services/prices.service");
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/current", requireAuth, async (req, res) => {
  const price = await pricesService.getCurrentPrice();
  res.json(price);
});

router.post("/", requireAuth, async (req, res) => {
  const { pricePerKg } = req.body;
  if (!pricePerKg) {
    return res.status(400).json({ error: "Champ requis: pricePerKg" });
  }
  const price = await pricesService.createPrice({ pricePerKg });
  res.status(201).json(price);
});

module.exports = router;