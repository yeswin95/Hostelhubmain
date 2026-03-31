const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");

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

const getAllComplaints = asyncHandler(async (_req, res) => {
  const complaints = await Complaint.find()
    .populate("student", "name email")
    .populate("room", "roomNo")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: complaints.length, complaints });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, adminRemark: req.body.adminRemark || "" },
    { new: true, runValidators: true }
  );
  if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
  res.status(200).json({ success: true, complaint });
});

module.exports = { createComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus };
