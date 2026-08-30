const express = require("express");
const router = express.Router();
const adminService = require("../services/admin.service");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

router.use(requireAuth, requireAdmin);

router.get("/users", async (req, res) => {
  const users = await adminService.listUsers();
  res.json(users);
});

router.post("/users", async (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Champs requis: fullName, email, password" });
  }
  try {
    const user = await adminService.createUser({ fullName, email, password, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.patch("/users/:id", async (req, res) => {
  if (req.params.id === req.userId && req.body.role === "user") {
    return res.status(400).json({ error: "Impossible de retirer vos propres droits admin" });
  }
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: "Impossible de supprimer votre propre compte" });
  }
  await adminService.deleteUser(req.params.id);
  res.status(204).send();
});

module.exports = router;