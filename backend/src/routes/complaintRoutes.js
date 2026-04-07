const express = require("express");
const { body, param } = require("express-validator");
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/me", protect, authorize("student"), getMyComplaints);
router.get("/", protect, authorize("admin", "warden"), getAllComplaints);
router.post(
  "/",
  protect,
  authorize("student"),
  [
    body("category")
      .isIn(["Electrical", "Plumbing", "Internet", "Cleaning", "Security", "Other"])
      .withMessage("Invalid complaint category"),
    body("message").trim().isLength({ min: 10 }).withMessage("Message must be at least 10 chars")
  ],
  validate,
  createComplaint
);
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "warden"),
  [
    param("id").isMongoId().withMessage("Invalid complaint id"),
    body("status").isIn(["Pending", "In Progress", "Resolved"]).withMessage("Invalid status"),
    body("adminRemark").optional().isLength({ max: 300 }).withMessage("Remark too long")
  ],
  validate,
  updateComplaintStatus
);

module.exports = router;
