const express = require("express");
const PostalRecord = require("../models/PostalRecord");
const User = require("../models/User");

const router = express.Router();

async function isValidUser(userId) {
  const user = await User.findById(userId);
  return user;
}

router.post("/records/create", async (req, res) => {
  try {
    const {
      userId,
      movementType,
      articleType,
      referenceNo,
      sender,
      receiver,
      department,
      subject,
      recordDate,
      status,
      remarks
    } = req.body;

    if (!userId || !movementType || !articleType || !referenceNo || !sender || !receiver || !department || !subject || !recordDate) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const user = await isValidUser(userId);
    if (!user) {
      return res.status(403).json({ message: "Invalid user" });
    }

    const existing = await PostalRecord.findOne({ referenceNo: referenceNo.trim() });
    if (existing) {
      return res.status(400).json({ message: "Reference number already exists" });
    }

    const record = await PostalRecord.create({
      movementType,
      articleType,
      referenceNo: referenceNo.trim(),
      sender: sender.trim(),
      receiver: receiver.trim(),
      department: department.trim(),
      subject: subject.trim(),
      recordDate: new Date(recordDate),
      status: status || "received",
      remarks: remarks ? remarks.trim() : ""
    });

    res.status(201).json({ message: "Postal record created", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/records/all", async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await isValidUser(userId);

    if (!user) {
      return res.status(403).json({ message: "Invalid user" });
    }

    const records = await PostalRecord.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/records/search", async (req, res) => {
  try {
    const { userId, movementType, articleType, department, status, keyword } = req.query;
    const user = await isValidUser(userId);

    if (!user) {
      return res.status(403).json({ message: "Invalid user" });
    }

    const filter = {};

    if (movementType && movementType !== "all") filter.movementType = movementType;
    if (articleType && articleType !== "all") filter.articleType = articleType;
    if (department && department !== "all") filter.department = department;
    if (status && status !== "all") filter.status = status;

    let records = await PostalRecord.find(filter).sort({ createdAt: -1 });

    if (keyword) {
      const key = keyword.trim().toLowerCase();
      records = records.filter((r) =>
        r.referenceNo.toLowerCase().includes(key) ||
        r.sender.toLowerCase().includes(key) ||
        r.receiver.toLowerCase().includes(key) ||
        r.subject.toLowerCase().includes(key)
      );
    }

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/records/update", async (req, res) => {
  try {
    const { userId, recordId, status, remarks } = req.body;

    if (!userId || !recordId) {
      return res.status(400).json({ message: "userId and recordId are required" });
    }

    const user = await isValidUser(userId);
    if (!user) {
      return res.status(403).json({ message: "Invalid user" });
    }

    const record = await PostalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (status) record.status = status;
    if (remarks !== undefined) record.remarks = remarks.trim();
    await record.save();

    res.json({ message: "Record updated", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
