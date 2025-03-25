const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./src/models/user");

require("dotenv").config(); //load environment variables

const url = process.env.ATLAS_URI;

const createAdmin = async () => {
  await mongoose.connect(url);

  const existingAdmin = await User.findOne({ email: "admin@admin.com" });
  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = new User({
    name: "Admin User",
    email: "admin@admin.com",
    password: hashedPassword,
    role: "admin",
    isVerified: true,
  });

  await admin.save();
  console.log("Admin created successfully");

  mongoose.disconnect();
};

createAdmin().catch((err) => {
  console.error("Error creating admin:", err);
  mongoose.disconnect();
});
