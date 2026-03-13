require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.dev") });
const mongoose = require("mongoose");
const User = require("../src/models/user.model");

async function createAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log("Admin already exists");
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.create({
    name: "Naivolt Admin",
    username: "naivolt_admin",
    email: process.env.ADMIN_EMAIL,
    phone: "09066309138",
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
  });

  console.log("Admin created successfully");
  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  mongoose.disconnect().then(() => process.exit(1)).catch(() => process.exit(1));
});
