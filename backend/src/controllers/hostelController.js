const Hostel = require("../models/Hostel");
const asyncHandler = require("../utils/asyncHandler");

const createHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.create(req.body);
  res.status(201).json({ success: true, hostel });
});

const getHostels = asyncHandler(async (_req, res) => {
  const hostels = await Hostel.find({ isActive: true }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: hostels.length, hostels });
});

const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });
  res.status(200).json({ success: true, hostel });
});

const deleteHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findByIdAndDelete(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });
  res.status(200).json({ success: true, message: "Hostel deleted" });
});

module.exports = { createHostel, getHostels, updateHostel, deleteHostel };
