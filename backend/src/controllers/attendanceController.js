const Attendance = require("../models/Attendance");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const getWardenRoomIds = (user) => (user.assignedRooms || []).map((id) => String(id));

const getScopedStudent = async (actor, studentId) => {
  const student = await User.findOne({ _id: studentId, role: "student" }).select("_id room name");
  if (!student) throw new ApiError(404, "Student not found");
  if (actor.role === "warden") {
    const roomId = student.room ? String(student.room) : null;
    if (!roomId || !getWardenRoomIds(actor).includes(roomId)) {
      throw new ApiError(403, "You are not allowed to access this student's attendance");
    }
  }
  return student;
};

const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, date, status } = req.body;
  await getScopedStudent(req.user, studentId);
  const attendance = await Attendance.findOneAndUpdate(
    { student: studentId, date },
    { student: studentId, date, status, markedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({ success: true, attendance });
});

const getStudentAttendance = asyncHandler(async (req, res) => {
  const studentId = req.user.role === "student" ? req.user._id : req.params.studentId;
  if (req.user.role !== "student") {
    await getScopedStudent(req.user, studentId);
  }
  const attendance = await Attendance.find({ student: studentId }).sort({ date: -1 });
  res.status(200).json({ success: true, count: attendance.length, attendance });
});

const getAttendanceRecords = asyncHandler(async (req, res) => {
  const { studentId } = req.query;
  let studentFilter = {};

  if (req.user.role === "warden") {
    const roomStudentIds = await User.find({
      role: "student",
      room: { $in: req.user.assignedRooms || [] }
    }).distinct("_id");
    studentFilter.student = { $in: roomStudentIds };
  }

  if (studentId) {
    await getScopedStudent(req.user, studentId);
    studentFilter.student = studentId;
  }

  const attendance = await Attendance.find(studentFilter)
    .populate("student", "name email room")
    .populate("markedBy", "name role")
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({ success: true, count: attendance.length, attendance });
});

module.exports = { markAttendance, getStudentAttendance, getAttendanceRecords };
