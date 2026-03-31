const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["admin", "student"], default: "student" },
    phone: { type: String, trim: true },
    course: { type: String, trim: true },
    feesStatus: { type: String, enum: ["Paid", "Pending"], default: "Pending" },
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", default: null },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    allocationStatus: { type: String, enum: ["pending", "allocated"], default: "pending" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plainTextPassword) {
  return bcrypt.compare(plainTextPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
