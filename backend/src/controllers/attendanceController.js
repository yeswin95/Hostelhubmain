const Attendance = require("../models/Attendance");
const asyncHandler = require("../utils/asyncHandler");

const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, date, status } = req.body;
  const attendance = await Attendance.findOneAndUpdate(
    { student: studentId, date },
    { student: studentId, date, status, markedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({ success: true, attendance });
});

const getStudentAttendance = asyncHandler(async (req, res) => {
  const studentId = req.user.role === "student" ? req.user._id : req.params.studentId;
  const attendance = await Attendance.find({ student: studentId }).sort({ date: -1 });
  res.status(200).json({ success: true, count: attendance.length, attendance });
});

module.exports = { markAttendance, getStudentAttendance };
