const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomNo: { type: String, required: true, trim: true },
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    roomType: { type: String, enum: ["AC", "Non-AC"], default: "Non-AC" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

roomSchema.index({ roomNo: 1, hostel: 1 }, { unique: true });

roomSchema.virtual("occupiedCount").get(function occupiedCount() {
  return this.occupants.length;
});

module.exports = mongoose.model("Room", roomSchema);
