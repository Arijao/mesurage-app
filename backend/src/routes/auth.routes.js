const express = require("express");
const router = express.Router();
const authService = require("../services/auth.service");

router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Champs manquants (fullName, email, password)" });
  }
  try {
    const result = await authService.register({ fullName, email, password });
    res.status(201).json(result);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Champs manquants (email, password)" });
  }
  try {
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;