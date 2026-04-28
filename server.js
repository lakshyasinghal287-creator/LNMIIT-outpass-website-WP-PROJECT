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
    {
      name: "Aman",
      email: "aman@student.com",
      role: "student",
      hostelRoom: "BH-2 104",
      phone: "9876500001",
      plainPassword: "aman123"
    },
    {
      name: "Riya",
      email: "riya@student.com",
      role: "student",
      hostelRoom: "GH-1 212",
      phone: "9876500002",
      plainPassword: "riya123"
    },
    {
      name: "Warden",
      email: "warden@lnmiit.ac.in",
      role: "admin",
      hostelRoom: "Office",
      phone: "9876500000",
      plainPassword: "warden123"
    }
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.plainPassword, 10);
    let existing = await User.findOne({ email: userData.email });

    if (!existing) {
      existing = await User.findOne({ name: userData.name, role: userData.role });
    }

    if (!existing) {
      await User.create({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        hostelRoom: userData.hostelRoom,
        phone: userData.phone,
        password: hashedPassword
      });
    } else {
      existing.email = existing.email || userData.email;
      existing.hostelRoom = existing.hostelRoom || userData.hostelRoom;
      existing.phone = existing.phone || userData.phone;
      existing.password = existing.password || hashedPassword;
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
