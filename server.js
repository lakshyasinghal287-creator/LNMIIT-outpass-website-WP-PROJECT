const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const PostalRecord = require("./models/PostalRecord");
const authRoutes = require("./routes/authRoutes");
const postalRoutes = require("./routes/postalRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/postal_records_db";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(authRoutes);
app.use(postalRoutes);

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

async function seedPostalRecords() {
  const existingCount = await PostalRecord.countDocuments();
  if (existingCount > 0) return;

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const sample = [
    {
      movementType: "incoming",
      articleType: "letter",
      referenceNo: "LN-POST-1001",
      sender: "UGC New Delhi",
      receiver: "Registrar LNMIIT",
      department: "Registrar Office",
      subject: "Accreditation Notice",
      recordDate: daysAgo(0),
      status: "received",
      remarks: "Marked urgent"
    },
    {
      movementType: "outgoing",
      articleType: "official-document",
      referenceNo: "LN-POST-1002",
      sender: "Accounts Section LNMIIT",
      receiver: "Bank of Rajasthan",
      department: "Accounts",
      subject: "Fee Reconciliation File",
      recordDate: daysAgo(1),
      status: "dispatched",
      remarks: "Speed post"
    },
    {
      movementType: "incoming",
      articleType: "parcel",
      referenceNo: "LN-POST-1003",
      sender: "TechBooks India",
      receiver: "Central Library LNMIIT",
      department: "Library",
      subject: "New Semester Book Shipment",
      recordDate: daysAgo(2),
      status: "in-transit",
      remarks: "Arrival expected tomorrow"
    },
    {
      movementType: "outgoing",
      articleType: "letter",
      referenceNo: "LN-POST-1004",
      sender: "Dean Academics LNMIIT",
      receiver: "AICTE Regional Office",
      department: "Dean Office",
      subject: "Annual Academic Compliance",
      recordDate: daysAgo(4),
      status: "received",
      remarks: "Pending dispatch"
    },
    {
      movementType: "incoming",
      articleType: "official-document",
      referenceNo: "LN-POST-1005",
      sender: "Jaipur Municipal Corporation",
      receiver: "Estate Office LNMIIT",
      department: "Estate",
      subject: "Property Tax Communication",
      recordDate: daysAgo(6),
      status: "delivered",
      remarks: "Delivered to estate team"
    },
    {
      movementType: "outgoing",
      articleType: "parcel",
      referenceNo: "LN-POST-1006",
      sender: "Examination Cell LNMIIT",
      receiver: "Confidential Printing Services",
      department: "Examination Cell",
      subject: "Question Paper Envelopes",
      recordDate: daysAgo(5),
      status: "in-transit",
      remarks: "Track with courier desk"
    }
  ];

  await PostalRecord.insertMany(sample);
}

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    await seedUsers();
    await seedPostalRecords();
    console.log("Demo data ready");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
  }
}

startServer();
