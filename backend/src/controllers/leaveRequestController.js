const mongoose = require("mongoose");
const LeaveRequest = require("../models/LeaveRequest");
const Attendance = require("../models/Attendance");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

const getWardenRoomIds = (user) => (user.assignedRooms || []).map((id) => String(id));

const createLeaveRequest = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid date");
  }
  if (end < start) {
    throw new ApiError(400, "End date must be on or after start date");
  }

  const leave = await LeaveRequest.create({
    student: req.user._id,
    startDate: start,
    endDate: end,
    reason: reason.trim()
  });

  res.status(201).json({ success: true, leaveRequest: leave });
});

const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const leaves = await LeaveRequest.find({ student: req.user._id })
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: leaves.length, leaveRequests: leaves });
});

const getAllLeaveRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
    filter.status = status;
  }
  if (req.user.role === "warden") {
    const scopedStudentIds = await User.find({
      role: "student",
      room: { $in: req.user.assignedRooms || [] }
    }).distinct("_id");
    filter.student = { $in: scopedStudentIds };
  }

  const leaves = await LeaveRequest.find(filter)
    .populate({
      path: "student",
      select: "name phone course room",
      populate: { path: "room", select: "roomNo" }
    })
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  const studentIds = [...new Set(leaves.map((leave) => String(leave.student?._id)).filter(Boolean))];
  let attendanceAgg = [];
  if (studentIds.length) {
    attendanceAgg = await Attendance.aggregate([
      {
        $match: {
          student: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $group: {
          _id: "$student",
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ["$status", "Present"] }, 1, 0]
            }
          }
        }
      }
    ]);
  }

  const attendanceByStudent = {};
  attendanceAgg.forEach((row) => {
    const total = row.total || 0;
    const present = row.present || 0;
    attendanceByStudent[String(row._id)] = {
      total,
      present,
      percentage: total ? Math.round((present / total) * 100) : 0
    };
  });

  const enrichedLeaves = leaves.map((leave) => {
    const sid = String(leave.student?._id || "");
    const roomNo = leave.student?.room?.roomNo || "Not Allocated";
    const attendanceSummary = attendanceByStudent[sid] || { total: 0, present: 0, percentage: 0 };
    return {
      ...leave.toObject(),
      student: leave.student
        ? {
            ...leave.student.toObject(),
            roomNo,
            attendance: attendanceSummary
          }
        : null
    };
  });

  res.status(200).json({ success: true, count: enrichedLeaves.length, leaveRequests: enrichedLeaves });
});

const updateLeaveRequestStatus = asyncHandler(async (req, res) => {
  const { status, adminRemark } = req.body;

  const leave = await LeaveRequest.findById(req.params.id).populate("student", "room");
  if (!leave) {
    throw new ApiError(404, "Leave request not found");
  }
  if (req.user.role === "warden") {
    const roomId = leave.student?.room ? String(leave.student.room) : null;
    if (!roomId || !getWardenRoomIds(req.user).includes(roomId)) {
      throw new ApiError(403, "You are not allowed to review this leave request");
    }
  }
  if (leave.status !== "Pending") {
    throw new ApiError(400, "This leave request has already been processed");
  }

  leave.status = status;
  leave.adminRemark = typeof adminRemark === "string" ? adminRemark.trim() : "";
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();

  const populated = await LeaveRequest.findById(leave._id)
    .populate("student", "name email")
    .populate("reviewedBy", "name email");

  res.status(200).json({ success: true, leaveRequest: populated });
});

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus
};
