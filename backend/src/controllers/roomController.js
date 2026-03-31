const mongoose = require("mongoose");
const Room = require("../models/Room");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  res.status(201).json({ success: true, room });
});

const getRooms = asyncHandler(async (req, res) => {
  const { availableOnly } = req.query;
  const rooms = await Room.find()
    .populate("hostel", "name code")
    .populate("occupants", "name email")
    .sort({ createdAt: -1 });

  const filteredRooms =
    availableOnly === "true"
      ? rooms.filter((room) => room.occupants.length < room.capacity)
      : rooms;

  res.status(200).json({ success: true, count: filteredRooms.length, rooms: filteredRooms });
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!room) return res.status(404).json({ success: false, message: "Room not found" });
  res.status(200).json({ success: true, room });
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: "Room not found" });
  if (room.occupants.length > 0) {
    throw new ApiError(400, "Cannot delete room with allocated students");
  }
  await room.deleteOne();
  res.status(200).json({ success: true, message: "Room deleted" });
});

const allocateRoom = asyncHandler(async (req, res) => {
  const { studentId, roomId } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await User.findOne({ _id: studentId, role: "student" }).session(session);
    if (!student) throw new ApiError(404, "Student not found");
    if (student.room) throw new ApiError(400, "Student already allocated");

    const room = await Room.findById(roomId).session(session);
    if (!room) throw new ApiError(404, "Room not found");
    if (room.occupants.length >= room.capacity) {
      throw new ApiError(400, "Room is full");
    }

    student.room = room._id;
    student.hostel = room.hostel;
    student.allocationStatus = "allocated";
    await student.save({ session });

    room.occupants.push(student._id);
    await room.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Room allocated successfully",
      data: { studentId, roomId }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const deallocateRoom = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const student = await User.findOne({ _id: studentId, role: "student" }).session(session);
    if (!student) throw new ApiError(404, "Student not found");
    if (!student.room) throw new ApiError(400, "Student has no allocated room");

    const room = await Room.findById(student.room).session(session);
    if (room) {
      room.occupants = room.occupants.filter((id) => id.toString() !== student._id.toString());
      await room.save({ session });
    }

    student.room = null;
    student.allocationStatus = "pending";
    await student.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ success: true, message: "Room deallocated successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

module.exports = { createRoom, getRooms, updateRoom, deleteRoom, allocateRoom, deallocateRoom };
