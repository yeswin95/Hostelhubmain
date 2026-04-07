const mongoose = require("mongoose");
const User = require("../models/User");
const Room = require("../models/Room");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const getWardenRoomIds = (user) => (user.assignedRooms || []).map((id) => String(id));

const assertWardenStudentScope = (user, student) => {
  if (user.role !== "warden") return;
  const roomId = student.room ? String(student.room) : null;
  const assignedRoomIds = getWardenRoomIds(user);
  if (!roomId || !assignedRoomIds.includes(roomId)) {
    throw new ApiError(403, "You are not allowed to access this student");
  }
};

const getStudents = asyncHandler(async (req, res) => {
  const { allocationStatus } = req.query;
  const filter = { role: "student" };
  if (allocationStatus) filter.allocationStatus = allocationStatus;
  if (req.user.role === "warden") {
    filter.room = { $in: req.user.assignedRooms || [] };
  }

  const students = await User.find(filter)
    .select("-password")
    .populate("room", "roomNo capacity")
    .populate("hostel", "name code")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: students.length, students });
});

const getUnallocatedStudents = asyncHandler(async (_req, res) => {
  if (_req.user.role === "warden") {
    return res.status(200).json({ success: true, count: 0, students: [] });
  }
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
    assertWardenStudentScope(req.user, student);

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
  const student = await User.findOne({ _id: req.params.id, role: "student" });
  if (!student) throw new ApiError(404, "Student not found");
  assertWardenStudentScope(req.user, student);

  student.feesStatus = req.body.feesStatus;
  await student.save();

  const safeStudent = await User.findById(student._id).select("-password");
  res.status(200).json({ success: true, student: safeStudent });
});

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("room", "roomNo capacity roomType")
    .populate("hostel", "name code")
    .populate("assignedRooms", "roomNo");
  res.status(200).json({ success: true, user });
});

const updateStudent = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "email", "phone", "course", "gender", "feesStatus"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  });

  const student = await User.findOne({ _id: req.params.id, role: "student" });
  if (!student) throw new ApiError(404, "Student not found");
  assertWardenStudentScope(req.user, student);

  Object.assign(student, updates);
  await student.save();

  const updated = await User.findById(student._id)
    .select("-password")
    .populate("room", "roomNo capacity")
    .populate("hostel", "name code");

  res.status(200).json({ success: true, student: updated });
});

const getWardens = asyncHandler(async (_req, res) => {
  const wardens = await User.find({ role: "warden" })
    .select("-password")
    .populate("assignedRooms", "roomNo")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: wardens.length, wardens });
});

const createWarden = asyncHandler(async (req, res) => {
  const { name, email, password, phone, gender } = req.body;
  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) throw new ApiError(409, "Email already registered");

  const user = await User.create({
    name,
    email,
    password,
    role: "warden",
    phone,
    gender,
    allocationStatus: "allocated"
  });

  const safe = await User.findById(user._id).select("-password");
  res.status(201).json({ success: true, warden: safe });
});

const updateWarden = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "email", "phone", "gender", "isActive"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) updates[field] = req.body[field];
  });

  const warden = await User.findOne({ _id: req.params.id, role: "warden" });
  if (!warden) throw new ApiError(404, "Warden not found");
  Object.assign(warden, updates);
  await warden.save();

  const updated = await User.findById(warden._id).select("-password").populate("assignedRooms", "roomNo");
  res.status(200).json({ success: true, warden: updated });
});

const deleteWarden = asyncHandler(async (req, res) => {
  const warden = await User.findOne({ _id: req.params.id, role: "warden" });
  if (!warden) throw new ApiError(404, "Warden not found");

  await Room.updateMany(
    { assignedWardens: warden._id },
    { $pull: { assignedWardens: warden._id } }
  );
  await User.deleteOne({ _id: warden._id });
  res.status(200).json({ success: true, message: "Warden deleted" });
});

module.exports = {
  getStudents,
  getUnallocatedStudents,
  deleteStudent,
  updateFeesStatus,
  getMyProfile,
  updateStudent,
  getWardens,
  createWarden,
  updateWarden,
  deleteWarden
};
