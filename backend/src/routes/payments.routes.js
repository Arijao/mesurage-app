const express = require("express");
const router = express.Router();
const paymentsService = require("../services/payments.service");
const { requireAuth } = require("../middlewares/auth.middleware");
const { broadcast } = require("../services/ws");
router.get("/", requireAuth, async (req, res) => {
  const { employeeId, from, to } = req.query;
  const payments = await paymentsService.listPayments({ employeeId, from, to });
  res.json(payments);
});
router.post("/", requireAuth, async (req, res) => {
  const { employeeId, amount, paidAt, note } = req.body;
  if (!employeeId || !amount || !paidAt) {
    return res.status(400).json({ error: "Champs requis: employeeId, amount, paidAt" });
  }
  const payment = await paymentsService.createPayment({ employeeId, amount, paidAt, note });
  broadcast("update", { entity: "payment", action: "create" });
  res.status(201).json(payment);
});
router.patch("/:id", requireAuth, async (req, res) => {
  const payment = await paymentsService.updatePayment(req.params.id, req.body);
  broadcast("update", { entity: "payment", action: "update" });
  res.json(payment);
});
router.delete("/:id", requireAuth, async (req, res) => {
  await paymentsService.deletePayment(req.params.id);
  broadcast("update", { entity: "payment", action: "delete" });
  res.status(204).send();
});
module.exports = router;