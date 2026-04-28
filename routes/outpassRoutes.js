const express = require("express");
const Outpass = require("../models/Outpass");
const User = require("../models/User");

const router = express.Router();

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
      return res.status(400).json({ message: "Return time must be after out time" });
    }

    const overlapping = await Outpass.findOne({
      userId,
      outTime: { $lt: returnDate },
      returnTime: { $gt: outDate },
      status: { $in: ["Pending", "Approved"] }
    });

    if (overlapping) {
      return res.status(400).json({ message: "You already have an overlapping pending/approved request" });
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

router.post("/outpass/update", async (req, res) => {
  try {
    const { userId, outpassId, outTime, returnTime, reason } = req.body;

    if (!userId || !outpassId || !outTime || !returnTime || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      return res.status(404).json({ message: "Outpass request not found" });
    }

    if (String(outpass.userId) !== String(userId)) {
      return res.status(403).json({ message: "You can edit only your own requests" });
    }

    if (outpass.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be edited" });
    }

    const outDate = new Date(outTime);
    const returnDate = new Date(returnTime);

    if (returnDate <= outDate) {
      return res.status(400).json({ message: "Return time must be after out time" });
    }

    const overlapping = await Outpass.findOne({
      _id: { $ne: outpassId },
      userId,
      outTime: { $lt: returnDate },
      returnTime: { $gt: outDate },
      status: { $in: ["Pending", "Approved"] }
    });

    if (overlapping) {
      return res.status(400).json({ message: "Updated time overlaps another pending/approved request" });
    }

    outpass.outTime = outDate;
    outpass.returnTime = returnDate;
    outpass.reason = reason.trim();
    await outpass.save();

    res.json({ message: "Outpass request updated", outpass });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/outpass/cancel", async (req, res) => {
  try {
    const { userId, outpassId } = req.body;

    if (!userId || !outpassId) {
      return res.status(400).json({ message: "userId and outpassId are required" });
    }

    const outpass = await Outpass.findById(outpassId);
    if (!outpass) {
      return res.status(404).json({ message: "Outpass request not found" });
    }

    if (String(outpass.userId) !== String(userId)) {
      return res.status(403).json({ message: "You can cancel only your own requests" });
    }

    if (outpass.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be canceled" });
    }

    await Outpass.findByIdAndDelete(outpassId);
    res.json({ message: "Outpass request canceled" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

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

router.get("/outpass/all", async (req, res) => {
  try {
    const { userId } = req.query;

    const admin = await User.findById(userId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Only admin can view all requests" });
    }

    const requests = await Outpass.find()
      .populate("userId", "name email hostelRoom phone role")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/outpass/analytics", async (req, res) => {
  try {
    const { userId } = req.query;
    const admin = await User.findById(userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Only admin can view analytics" });
    }

    const now = new Date();

    const approvedRequests = await Outpass.find({ status: "Approved" })
      .populate("userId", "name email hostelRoom phone");

    const stillOut = approvedRequests.filter((item) => now >= item.outTime && now <= item.returnTime);
    const overdue = approvedRequests.filter((item) => now > item.returnTime);

    res.json({
      stillOutCount: stillOut.length,
      overdueCount: overdue.length,
      stillOut,
      overdue
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

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
