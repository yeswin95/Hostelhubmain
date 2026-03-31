const mongoose = require("mongoose");
const User = require("../models/User");
const Room = require("../models/Room");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const getStudents = asyncHandler(async (req, res) => {
  const { allocationStatus } = req.query;
  const filter = { role: "student" };
  if (allocationStatus) filter.allocationStatus = allocationStatus;

  const students = await User.find(filter)
    .select("-password")
    .populate("room", "roomNo capacity")
    .populate("hostel", "name code")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: students.length, students });
});

const getUnallocatedStudents = asyncHandler(async (_req, res) => {
  const students = await User.find({ role: "student", allocationStatus: "pending", room: null })
    .select("-password")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: students.length, students });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" }).session(session);
    if (!student) throw new ApiError(404, "Student not found");

    if (student.room) {
      const room = await Room.findById(student.room).session(session);
      if (room) {
        room.occupants = room.occupants.filter((id) => id.toString() !== student._id.toString());
        await room.save({ session });
      }
    }

    await User.deleteOne({ _id: student._id }).session(session);
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Student deleted" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const updateFeesStatus = asyncHandler(async (req, res) => {
  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: "student" },
    { feesStatus: req.body.feesStatus },
    { new: true, runValidators: true }
  ).select("-password");

  if (!student) throw new ApiError(404, "Student not found");
  res.status(200).json({ success: true, student });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("room", "roomNo capacity roomType")
    .populate("hostel", "name code");
  res.status(200).json({ success: true, user });
});

module.exports = {
  getStudents,
  getUnallocatedStudents,
  deleteStudent,
  updateFeesStatus,
  getMyProfile
};
