require("dotenv").config();
const express = require("express");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const employeesRoutes = require("./routes/employees.routes");
const weighingsRoutes = require("./routes/weighings.routes");
const paymentsRoutes = require("./routes/payments.routes");
const pricesRoutes = require("./routes/prices.routes");

const app = express();
app.use(express.json());

// API
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/weighings", weighingsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/prices", pricesRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Frontend statique (même port, même origine → pas de CORS)
const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));
app.get("*", (req, res) => res.sendFile(path.join(frontendPath, "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mesurage App disponible sur http://localhost:${PORT}`);
});