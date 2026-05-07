const mongoose = require("mongoose");

const postalRecordSchema = new mongoose.Schema(
  {
    movementType: { type: String, enum: ["incoming", "outgoing"], required: true },
    articleType: { type: String, enum: ["letter", "parcel", "official-document"], required: true },
    referenceNo: { type: String, required: true, unique: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    department: { type: String, required: true },
    subject: { type: String, required: true },
    recordDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["received", "in-transit", "dispatched", "delivered"],
      default: "received"
    },
    remarks: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostalRecord", postalRecordSchema);
