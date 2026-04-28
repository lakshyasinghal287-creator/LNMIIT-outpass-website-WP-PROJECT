const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const outpassRoutes = require("./routes/outpassRoutes");

const app = express();
const PORT = 3000;
const MONGO_URI = "mongodb://127.0.0.1:27017/outpass_db";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(authRoutes);
app.use(outpassRoutes);

async function seedUsers() {
  // Create simple demo users if they do not already exist
  const users = [
    { name: "Aman", role: "student" },
    { name: "Riya", role: "student" },
    { name: "Warden", role: "admin" }
  ];

  for (const userData of users) {
    const exists = await User.findOne(userData);
    if (!exists) {
      await User.create(userData);
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
