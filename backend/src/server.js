require("dotenv").config();
const express = require("express");
const path = require("path");
const https = require("https");
const fs = require("fs");

const authRoutes = require("./routes/auth.routes");
const employeesRoutes = require("./routes/employees.routes");
const weighingsRoutes = require("./routes/weighings.routes");
const paymentsRoutes = require("./routes/payments.routes");
const pricesRoutes = require("./routes/prices.routes");
const { attachToServer } = require("./services/ws");

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

const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Serveur HTTP : usage desktop/admin sur cette machine (localhost)
// Pas besoin de certificat — localhost est déjà un contexte sécurisé pour le navigateur
const httpServer = app.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log(`Mesurage App (admin) disponible sur http://localhost:${HTTP_PORT}`);
});
attachToServer(httpServer);

// Serveur HTTPS : réservé à l'accès LAN (tablette/téléphone pour le scan QR)
const options = {
  key: fs.readFileSync(path.join(__dirname, "../certs/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../certs/cert.pem")),
};
const httpsServer = https.createServer(options, app).listen(HTTPS_PORT, "0.0.0.0", () => {
  console.log(`Mesurage App (scan) disponible sur https://<IP-de-cette-machine>:${HTTPS_PORT}`);
});
attachToServer(httpsServer);