const express = require("express");
const router = express.Router();
const employeesService = require("../services/employees.service");
const { requireAuth } = require("../middlewares/auth.middleware");

router.get("/", requireAuth, async (req, res) => {
  const employees = await employeesService.listEmployees();
  res.json(employees);
});

router.post("/", requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Champ requis: name" });
  }
  const employee = await employeesService.createEmployee({ name, phone });
  res.status(201).json(employee);
});

router.get("/:id", requireAuth, async (req, res) => {
  const employee = await employeesService.getEmployee(req.params.id);
  if (!employee) return res.status(404).json({ error: "Employé introuvable" });
  res.json(employee);
});

router.get("/:id/summary", requireAuth, async (req, res) => {
  const summary = await employeesService.getSummary(req.params.id);
  if (!summary) return res.status(404).json({ error: "Employé introuvable" });
  res.json(summary);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { name, phone, alertNote } = req.body;
  const employee = await employeesService.updateEmployee(req.params.id, { name, phone, alertNote });
  res.json(employee);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await employeesService.deleteEmployee(req.params.id);
  res.status(204).send();
});

module.exports = router;