require("dotenv").config({
  path: ".env.dev",
});
const app = require("./app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const HOST = "0.0.0.0"; // so emulator (10.0.2.2) and devices on LAN can connect

async function start() {
  try {
    await connectDB();
    app.listen(PORT, HOST, () => {
      console.log(`Naivolt server is running on http://localhost:${PORT} (and http://10.0.2.2:${PORT} from Android emulator)`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
