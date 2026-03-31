const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      unique: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    },
    breakfast: { type: String, required: true, trim: true },
    lunch: { type: String, required: true, trim: true },
    snacks: { type: String, required: true, trim: true },
    dinner: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);
