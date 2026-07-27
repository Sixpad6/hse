require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const fitToWorkRoutes = require("./routes/fitToWork");
const take5Routes = require("./routes/take5");
const hazardReportRoutes = require("./routes/hazardReport");
const ptoRoutes = require("./routes/pto");
const inspectionRoutes = require("./routes/inspection");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/fit-to-work", fitToWorkRoutes);
app.use("/api/take5", take5Routes);
app.use("/api/hazard-report", hazardReportRoutes);
app.use("/api/pto", ptoRoutes);
app.use("/api/inspection", inspectionRoutes);

app.use((req, res) => res.status(404).json({ message: "Endpoint tidak ditemukan." }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`HSE & Fatigue Management API berjalan di http://localhost:${PORT}`);
});
