const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.create({
    student: req.user._id,
    room: req.user.room || null,
    category: req.body.category,
    message: req.body.message
  });
  res.status(201).json({ success: true, complaint });
});

const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ student: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: complaints.length, complaints });
});

const getAllComplaints = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "warden") {
    filter.room = { $in: req.user.assignedRooms || [] };
  }
  const complaints = await Complaint.find(filter)
    .populate("student", "name email")
    .populate("room", "roomNo")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: complaints.length, complaints });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
  if (req.user.role === "warden") {
    const complaintRoomId = complaint.room ? String(complaint.room) : null;
    const assignedRoomIds = (req.user.assignedRooms || []).map((id) => String(id));
    if (!complaintRoomId || !assignedRoomIds.includes(complaintRoomId)) {
      throw new ApiError(403, "You are not allowed to update this complaint");
    }
  }

  complaint.status = req.body.status;
  complaint.adminRemark = req.body.adminRemark || "";
  await complaint.save();

  res.status(200).json({ success: true, complaint });
});

module.exports = { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus };
