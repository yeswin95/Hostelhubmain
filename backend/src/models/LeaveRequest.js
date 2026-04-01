const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },
    adminRemark: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

leaveRequestSchema.index({ student: 1, createdAt: -1 });
leaveRequestSchema.index({ status: 1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
