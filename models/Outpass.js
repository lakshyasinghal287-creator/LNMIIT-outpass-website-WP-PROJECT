const mongoose = require("mongoose");

const outpassSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    outTime: { type: Date, required: true },
    returnTime: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },
    adminComment: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Outpass", outpassSchema);
