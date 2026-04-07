const express = require("express");
const { body, param } = require("express-validator");
const {
  markAttendance,
  getStudentAttendance,
  getAttendanceRecords
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("studentId").isMongoId().withMessage("Valid student id required"),
    body("date").isISO8601().withMessage("Valid ISO date required"),
    body("status").isIn(["Present", "Absent"]).withMessage("Invalid attendance status")
  ],
  validate,
  markAttendance
);
router.get("/", protect, authorize("admin", "warden"), getAttendanceRecords);
router.get("/me", protect, authorize("student"), getStudentAttendance);
router.get(
  "/student/:studentId",
  protect,
  authorize("admin", "warden"),
  [param("studentId").isMongoId().withMessage("Invalid student id")],
  validate,
  getStudentAttendance
);

module.exports = router;
