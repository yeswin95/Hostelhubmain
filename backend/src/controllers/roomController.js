const mongoose = require("mongoose");
const Room = require("../models/Room");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const canWardenManageRoom = (user, room) => {
  if (!user || user.role !== "warden") return false;
  const assigned = room.assignedWardens || [];
  return assigned.some((wid) => String(wid) === String(user._id));
};

const assertRoomAccess = (user, room) => {
  if (user.role === "admin") return;
  if (user.role === "warden" && canWardenManageRoom(user, room)) return;
  throw new ApiError(403, "You are not allowed to manage this room");
};

const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  res.status(201).json({ success: true, room });
});

const getRooms = asyncHandler(async (req, res) => {
  const { availableOnly } = req.query;
  let query = Room.find();
  if (req.user.role === "warden") {
    query = query.find({ assignedWardens: req.user._id });
  }
  const rooms = await query
    .populate("hostel", "name code")
    .populate("occupants", "name email")
    .populate("assignedWardens", "name email phone")
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
    assertRoomAccess(req.user, room);
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
      assertRoomAccess(req.user, room);
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

const reallocateStudent = asyncHandler(async (req, res) => {
  const { studentId, newRoomId } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await User.findOne({ _id: studentId, role: "student" }).session(session);
    if (!student) throw new ApiError(404, "Student not found");
    if (!student.room) throw new ApiError(400, "Student has no room assigned");

    const oldRoom = await Room.findById(student.room).session(session);
    const newRoom = await Room.findById(newRoomId).session(session);
    if (!newRoom) throw new ApiError(404, "Target room not found");
    assertRoomAccess(req.user, newRoom);
    if (oldRoom) assertRoomAccess(req.user, oldRoom);
    if (newRoom._id.equals(student.room)) {
      throw new ApiError(400, "Student is already in this room");
    }
    if (newRoom.occupants.length >= newRoom.capacity) {
      throw new ApiError(400, "Target room is full");
    }

    if (oldRoom) {
      oldRoom.occupants = oldRoom.occupants.filter((id) => id.toString() !== student._id.toString());
      await oldRoom.save({ session });
    }

    newRoom.occupants.push(student._id);
    await newRoom.save({ session });

    student.room = newRoom._id;
    student.hostel = newRoom.hostel;
    student.allocationStatus = "allocated";
    await student.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Student moved to the new room"
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

const assignWardensToRoom = asyncHandler(async (req, res) => {
  const { roomId, wardenIds } = req.body;
  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, "Room not found");

  const uniqueWardenIds = [...new Set((wardenIds || []).map((id) => String(id)))];
  const wardens = await User.find({ _id: { $in: uniqueWardenIds }, role: "warden" }).select("_id");
  if (wardens.length !== uniqueWardenIds.length) {
    throw new ApiError(400, "One or more wardens are invalid");
  }

  const allWardens = await User.find({ role: "warden" }).select("_id assignedRooms");
  for (const warden of allWardens) {
    const hasRoom = uniqueWardenIds.some((wid) => String(wid) === String(warden._id));
    if (hasRoom) {
      if (!warden.assignedRooms.some((rid) => String(rid) === String(room._id))) {
        warden.assignedRooms.push(room._id);
      }
    } else {
      warden.assignedRooms = warden.assignedRooms.filter((rid) => String(rid) !== String(room._id));
    }
    await warden.save();
  }

  room.assignedWardens = uniqueWardenIds;
  await room.save();

  const populated = await Room.findById(room._id)
    .populate("hostel", "name code")
    .populate("assignedWardens", "name email");

  res.status(200).json({ success: true, room: populated });
});

module.exports = {
  createRoom,
  getRooms,
  updateRoom,
  deleteRoom,
  allocateRoom,
  deallocateRoom,
  reallocateStudent,
  assignWardensToRoom
};
