const express = require("express");
const { param, body } = require("express-validator");
const {
  getStudents,
  getUnallocatedStudents,
  deleteStudent,
  updateFeesStatus,
  getMyProfile
} = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/students", protect, authorize("admin"), getStudents);
router.get("/students/unallocated", protect, authorize("admin"), getUnallocatedStudents);
router.get("/me", protect, getMyProfile);
router.delete(
  "/students/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid student id")],
  validate,
  deleteStudent
);
router.patch(
  "/students/:id/fees",
  protect,
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid student id"),
    body("feesStatus").isIn(["Paid", "Pending"]).withMessage("Invalid fees status")
  ],
  validate,
  updateFeesStatus
);

module.exports = router;
