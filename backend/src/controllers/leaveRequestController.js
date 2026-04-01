const LeaveRequest = require("../models/LeaveRequest");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

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

  const leaves = await LeaveRequest.find(filter)
    .populate("student", "name email phone course")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: leaves.length, leaveRequests: leaves });
});

const updateLeaveRequestStatus = asyncHandler(async (req, res) => {
  const { status, adminRemark } = req.body;

  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    throw new ApiError(404, "Leave request not found");
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
