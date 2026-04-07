const Notice = require("../models/Notice");
const asyncHandler = require("../utils/asyncHandler");

const createNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.create({
    title: req.body.title,
    message: req.body.message,
    priority: req.body.priority || "normal",
    publishedBy: req.user._id,
    targetRooms: []
  });
  res.status(201).json({ success: true, notice });
});

const getNotices = asyncHandler(async (req, res) => {
  const filter = { isPublished: true };
  if (req.user.role === "student") {
    const roomId = req.user.room;
    filter.$or = [{ targetRooms: { $size: 0 } }];
    if (roomId) {
      filter.$or.push({ targetRooms: roomId });
    }
  }

  const notices = await Notice.find(filter)
    .populate("publishedBy", "name email")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: notices.length, notices });
});

const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

  notice.title = req.body.title ?? notice.title;
  notice.message = req.body.message ?? notice.message;
  notice.priority = req.body.priority ?? notice.priority;
  notice.isPublished =
    typeof req.body.isPublished === "boolean" ? req.body.isPublished : notice.isPublished;
  await notice.save();

  res.status(200).json({ success: true, notice });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
  await notice.deleteOne();
  res.status(200).json({ success: true, message: "Notice deleted" });
});

module.exports = { createNotice, getNotices, updateNotice, deleteNotice };
