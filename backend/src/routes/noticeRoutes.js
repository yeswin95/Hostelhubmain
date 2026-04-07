const express = require("express");
const { body, param } = require("express-validator");
const { createNotice, getNotices, updateNotice, deleteNotice } = require("../controllers/noticeController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/", protect, getNotices);
router.post(
  "/",
  protect,
  authorize("admin", "warden"),
  [
    body("title").trim().isLength({ min: 3 }).withMessage("Title must be at least 3 chars"),
    body("message").trim().isLength({ min: 5 }).withMessage("Message must be at least 5 chars"),
    body("priority").optional().isIn(["normal", "urgent"]).withMessage("Invalid priority")
  ],
  validate,
  createNotice
);
router.put(
  "/:id",
  protect,
  authorize("admin", "warden"),
  [param("id").isMongoId().withMessage("Invalid notice id")],
  validate,
  updateNotice
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "warden"),
  [param("id").isMongoId().withMessage("Invalid notice id")],
  validate,
  deleteNotice
);

module.exports = router;
