const express = require("express");
const PostalRecord = require("../models/PostalRecord");
const User = require("../models/User");

const router = express.Router();

async function isValidUser(userId) {
  return await User.findById(userId);
}

function buildSampleRecords() {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  return [
    { movementType: "incoming", articleType: "letter", referenceNo: "LN-POST-1001", sender: "UGC New Delhi", receiver: "Registrar LNMIIT", department: "Registrar Office", subject: "Accreditation Notice", recordDate: daysAgo(0), status: "received", remarks: "Marked urgent" },
    { movementType: "outgoing", articleType: "official-document", referenceNo: "LN-POST-1002", sender: "Accounts Section LNMIIT", receiver: "Bank of Rajasthan", department: "Accounts", subject: "Fee Reconciliation File", recordDate: daysAgo(1), status: "dispatched", remarks: "Speed post" },
    { movementType: "incoming", articleType: "parcel", referenceNo: "LN-POST-1003", sender: "TechBooks India", receiver: "Central Library LNMIIT", department: "Library", subject: "New Semester Book Shipment", recordDate: daysAgo(2), status: "in-transit", remarks: "Arrival expected tomorrow" },
    { movementType: "outgoing", articleType: "letter", referenceNo: "LN-POST-1004", sender: "Dean Academics LNMIIT", receiver: "AICTE Regional Office", department: "Dean Office", subject: "Annual Academic Compliance", recordDate: daysAgo(4), status: "received", remarks: "Pending dispatch" },
    { movementType: "incoming", articleType: "official-document", referenceNo: "LN-POST-1005", sender: "Jaipur Municipal Corporation", receiver: "Estate Office LNMIIT", department: "Estate", subject: "Property Tax Communication", recordDate: daysAgo(6), status: "delivered", remarks: "Delivered to estate team" },
    { movementType: "outgoing", articleType: "parcel", referenceNo: "LN-POST-1006", sender: "Examination Cell LNMIIT", receiver: "Confidential Printing Services", department: "Examination Cell", subject: "Question Paper Envelopes", recordDate: daysAgo(5), status: "in-transit", remarks: "Track with courier desk" }
  ];
}

router.post("/records/create", async (req, res) => {
  try {
    const { userId, movementType, articleType, referenceNo, sender, receiver, department, subject, recordDate, status, remarks } = req.body;
    if (!userId || !movementType || !articleType || !referenceNo || !sender || !receiver || !department || !subject || !recordDate) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const user = await isValidUser(userId);
    if (!user) return res.status(403).json({ message: "Invalid user" });

    const existing = await PostalRecord.findOne({ referenceNo: referenceNo.trim() });
    if (existing) return res.status(400).json({ message: "Reference number already exists" });

    const record = await PostalRecord.create({ movementType, articleType, referenceNo: referenceNo.trim(), sender: sender.trim(), receiver: receiver.trim(), department: department.trim(), subject: subject.trim(), recordDate: new Date(recordDate), status: status || "received", remarks: remarks ? remarks.trim() : "" });
    res.status(201).json({ message: "Postal record created", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/records/load-demo", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await isValidUser(userId);
    if (!user) return res.status(403).json({ message: "Invalid user" });

    const sample = buildSampleRecords();
    let inserted = 0;
    for (const item of sample) {
      const exists = await PostalRecord.findOne({ referenceNo: item.referenceNo });
      if (!exists) {
        await PostalRecord.create(item);
        inserted += 1;
      }
    }

    res.json({ message: `Demo data loaded. Added ${inserted} records.`, inserted });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/records/all", async (req, res) => {
  try {
    const user = await isValidUser(req.query.userId);
    if (!user) return res.status(403).json({ message: "Invalid user" });
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
    if (!user) return res.status(403).json({ message: "Invalid user" });

    const filter = {};
    if (movementType && movementType !== "all") filter.movementType = movementType;
    if (articleType && articleType !== "all") filter.articleType = articleType;
    if (department && department !== "all") filter.department = department;
    if (status && status !== "all") filter.status = status;

    let records = await PostalRecord.find(filter).sort({ createdAt: -1 });
    if (keyword) {
      const key = keyword.trim().toLowerCase();
      records = records.filter((r) => r.referenceNo.toLowerCase().includes(key) || r.sender.toLowerCase().includes(key) || r.receiver.toLowerCase().includes(key) || r.subject.toLowerCase().includes(key));
    }

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/records/analytics", async (req, res) => {
  try {
    const user = await isValidUser(req.query.userId);
    if (!user) return res.status(403).json({ message: "Invalid user" });

    const records = await PostalRecord.find();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayIncoming = records.filter((r) => r.recordDate >= todayStart && r.movementType === "incoming").length;
    const todayOutgoing = records.filter((r) => r.recordDate >= todayStart && r.movementType === "outgoing").length;
    const pendingDispatch = records.filter((r) => r.status === "received" || r.status === "in-transit").length;
    const delivered = records.filter((r) => r.status === "delivered").length;
    const overdue = records.filter((r) => (r.status === "received" || r.status === "in-transit") && ((now - new Date(r.recordDate)) / 86400000) > 3);

    const flow = {
      received: records.filter((r) => r.status === "received").length,
      inTransit: records.filter((r) => r.status === "in-transit").length,
      dispatched: records.filter((r) => r.status === "dispatched").length,
      delivered: records.filter((r) => r.status === "delivered").length
    };

    const departmentMap = {};
    for (const r of records) {
      if (!departmentMap[r.department]) {
        departmentMap[r.department] = { department: r.department, total: 0, pending: 0 };
      }
      departmentMap[r.department].total += 1;
      if (r.status === "received" || r.status === "in-transit") departmentMap[r.department].pending += 1;
    }

    const departmentSummary = Object.values(departmentMap)
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 8);

    res.json({
      kpis: { todayIncoming, todayOutgoing, pendingDispatch, delivered, overdueCount: overdue.length, total: records.length },
      flow,
      actionCenter: overdue.slice(0, 8),
      departmentSummary
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/records/update", async (req, res) => {
  try {
    const { userId, recordId, status, remarks } = req.body;
    if (!userId || !recordId) return res.status(400).json({ message: "userId and recordId are required" });

    const user = await isValidUser(userId);
    if (!user) return res.status(403).json({ message: "Invalid user" });

    const record = await PostalRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: "Record not found" });

    if (status) record.status = status;
    if (remarks !== undefined) record.remarks = remarks.trim();
    await record.save();

    res.json({ message: "Record updated", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
