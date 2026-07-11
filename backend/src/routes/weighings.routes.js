const express = require("express");
const router = express.Router();
const weighingsService = require("../services/weighings.service");
const { requireAuth } = require("../middlewares/auth.middleware");
const { broadcast } = require("../services/ws");
router.get("/", requireAuth, async (req, res) => {
  const { employeeId, from, to } = req.query;
  const weighings = await weighingsService.listWeighings({ employeeId, from, to });
  res.json(weighings);
});
router.post("/", requireAuth, async (req, res) => {
  const { employeeId, weightKg, qualityName, pricePerKg, weighedAt } = req.body;
  if (!employeeId || !weightKg || !qualityName || !pricePerKg || !weighedAt) {
    return res.status(400).json({ error: "Champs requis: employeeId, weightKg, qualityName, pricePerKg, weighedAt" });
  }
  const weighing = await weighingsService.createWeighing(req.body);
  broadcast("update", { entity: "weighing", action: "create" });
  res.status(201).json(weighing);
});
router.patch("/:id", requireAuth, async (req, res) => {
  const weighing = await weighingsService.updateWeighing(req.params.id, req.body);
  broadcast("update", { entity: "weighing", action: "update" });
  res.json(weighing);
});
router.delete("/:id", requireAuth, async (req, res) => {
  await weighingsService.deleteWeighing(req.params.id);
  broadcast("update", { entity: "weighing", action: "delete" });
  res.status(204).send();
});
module.exports = router;