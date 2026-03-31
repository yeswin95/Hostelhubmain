const Notice = require("../models/Notice");
const asyncHandler = require("../utils/asyncHandler");

const createNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.create({
    title: req.body.title,
    message: req.body.message,
    priority: req.body.priority || "normal",
    publishedBy: req.user._id
  });
  res.status(201).json({ success: true, notice });
});

const getNotices = asyncHandler(async (_req, res) => {
  const notices = await Notice.find({ isPublished: true })
    .populate("publishedBy", "name email")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: notices.length, notices });
});

const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
  res.status(200).json({ success: true, notice });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
  res.status(200).json({ success: true, message: "Notice deleted" });
});

module.exports = { createNotice, getNotices, updateNotice, deleteNotice };
