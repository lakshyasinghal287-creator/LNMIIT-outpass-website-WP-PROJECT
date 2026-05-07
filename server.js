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
  const users = [
    { name: "Postal Admin", email: "admin.post@lnmiit.ac.in", role: "admin", plainPassword: "admin123" },
    { name: "Postal Clerk", email: "clerk.post@lnmiit.ac.in", role: "clerk", plainPassword: "clerk123" }
  ];

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.plainPassword, 10);
      await User.create({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: hashedPassword
      });
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
