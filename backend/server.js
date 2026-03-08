const app = require("./app");
const { connectDB } = require("./src/config/db");
require("dotenv").config({
  path: ".env.dev",
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Naivolt server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
