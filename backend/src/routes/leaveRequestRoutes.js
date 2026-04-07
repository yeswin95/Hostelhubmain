const express = require("express");
const { body, param, query } = require("express-validator");
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveRequestStatus
} = require("../controllers/leaveRequestController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/me", protect, authorize("student"), getMyLeaveRequests);

router.post(
  "/",
  protect,
  authorize("student"),
  [
    body("startDate").isISO8601({ strict: false }).withMessage("Valid start date is required"),
    body("endDate").isISO8601({ strict: false }).withMessage("Valid end date is required"),
    body("reason").trim().isLength({ min: 10, max: 1000 }).withMessage("Reason must be 10–1000 characters")
  ],
  validate,
  createLeaveRequest
);

router.get(
  "/",
  protect,
  authorize("admin", "warden"),
  [query("status").optional().isIn(["Pending", "Approved", "Rejected"]).withMessage("Invalid status filter")],
  validate,
  getAllLeaveRequests
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin", "warden"),
  [
    param("id").isMongoId().withMessage("Invalid leave request id"),
    body("status").isIn(["Approved", "Rejected"]).withMessage("Status must be Approved or Rejected"),
    body("adminRemark").optional().trim().isLength({ max: 500 }).withMessage("Remark too long")
  ],
  validate,
  updateLeaveRequestStatus
);

module.exports = router;
