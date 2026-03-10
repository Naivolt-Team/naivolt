const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/auth.routes");
const rateRoutes = require("./src/routes/rate.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Naivolt API is running" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/rate", rateRoutes);

module.exports = app;
