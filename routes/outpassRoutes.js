const express = require("express");
const Outpass = require("../models/Outpass");
const User = require("../models/User");

const router = express.Router();

// Student: create outpass request
router.post("/outpass/create", async (req, res) => {
  try {
    const { userId, outTime, returnTime, reason } = req.body;

    if (!userId || !outTime || !returnTime || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      return res.status(403).json({ message: "Only students can create requests" });
    }

    const outDate = new Date(outTime);
    const returnDate = new Date(returnTime);

    if (returnDate <= outDate) {
      return res.status(400).json({
        message: "Return time must be after out time"
      });
    }

    // Overlap check for the same student
    const overlapping = await Outpass.findOne({
      userId,
      outTime: { $lt: returnDate },
      returnTime: { $gt: outDate },
      status: { $in: ["Pending", "Approved"] }
    });

    if (overlapping) {
      return res.status(400).json({
        message: "You already have an overlapping pending/approved request"
      });
    }

    const outpass = await Outpass.create({
      userId,
      outTime: outDate,
      returnTime: returnDate,
      reason: reason.trim()
    });

    res.status(201).json({ message: "Outpass request created", outpass });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Student: view own requests
router.get("/outpass/my", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const requests = await Outpass.find({ userId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Admin: view all requests
router.get("/outpass/all", async (req, res) => {
  try {
    const { userId } = req.query;

    const admin = await User.findById(userId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Only admin can view all requests" });
    }

    const requests = await Outpass.find()
      .populate("userId", "name role")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Admin: approve/reject request
router.post("/outpass/update-status", async (req, res) => {
  try {
    const { adminUserId, outpassId, status, adminComment } = req.body;

    if (!adminUserId || !outpassId || !status) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const admin = await User.findById(adminUserId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update status" });
    }

    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      return res.status(404).json({ message: "Outpass request not found" });
    }

    outpass.status = status;
    outpass.adminComment = adminComment ? adminComment.trim() : "";
    await outpass.save();

    res.json({ message: "Status updated", outpass });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
