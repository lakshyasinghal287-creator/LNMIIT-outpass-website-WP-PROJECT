const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Simple login by name + role
router.post("/login", async (req, res) => {
  try {
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ message: "Name and role are required" });
    }

    const user = await User.findOne({ name: name.trim(), role });

    if (!user) {
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
