const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { name, role, password } = req.body;

    if (!name || !role || !password) {
      return res.status(400).json({ message: "Name, role and password are required" });
    }

    const user = await User.findOne({ name: name.trim(), role });

    if (!user) {
      return res.status(401).json({ message: "Invalid login details" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password || "");
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid login details" });
    }

    res.json({
      message: "Login successful",
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
