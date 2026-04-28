const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["student", "admin"], required: true },
  hostelRoom: { type: String, default: "" },
  phone: { type: String, default: "" },
  password: { type: String, required: true }
});

module.exports = mongoose.model("User", userSchema);
