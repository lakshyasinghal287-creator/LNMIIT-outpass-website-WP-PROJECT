const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const outpassRoutes = require("./routes/outpassRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/outpass_db";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(authRoutes);
app.use(outpassRoutes);

async function seedUsers() {
  // Demo users with plain passwords for easy viva explanation
  const users = [
    { name: "Aman", role: "student", plainPassword: "aman123" },
    { name: "Riya", role: "student", plainPassword: "riya123" },
    { name: "Warden", role: "admin", plainPassword: "warden123" }
  ];

  for (const userData of users) {
    const existing = await User.findOne({ name: userData.name, role: userData.role });
    const hashedPassword = await bcrypt.hash(userData.plainPassword, 10);

    if (!existing) {
      await User.create({
        name: userData.name,
        role: userData.role,
        password: hashedPassword
      });
    } else if (!existing.password) {
      existing.password = hashedPassword;
      await existing.save();
    }
  }
}

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    await seedUsers();
    console.log("Demo users ready");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
  }
}

startServer();
