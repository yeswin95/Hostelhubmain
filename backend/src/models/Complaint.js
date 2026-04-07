const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    category: {
      type: String,
      enum: ["Electrical", "Plumbing", "Internet", "Cleaning", "Security", "Other"],
      required: true
    },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    status: { type: String, enum: ["Pending", "In Progress", "Resolved"], default: "Pending" },
    adminRemark: { type: String, trim: true, maxlength: 300 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
