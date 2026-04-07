const express = require("express");
const { param, body } = require("express-validator");
const {
  getStudents,
  getUnallocatedStudents,
  deleteStudent,
  updateFeesStatus,
  getMyProfile,
  updateStudent,
  getWardens,
  createWarden,
  updateWarden,
  deleteWarden
} = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/students", protect, authorize("admin", "warden"), getStudents);
router.get("/students/unallocated", protect, authorize("admin", "warden"), getUnallocatedStudents);
router.get("/me", protect, getMyProfile);
router.delete(
  "/students/:id",
  protect,
  authorize("admin", "warden"),
  [param("id").isMongoId().withMessage("Invalid student id")],
  validate,
  deleteStudent
);
router.patch(
  "/students/:id/fees",
  protect,
  authorize("admin", "warden"),
  [
    param("id").isMongoId().withMessage("Invalid student id"),
    body("feesStatus").isIn(["Paid", "Pending"]).withMessage("Invalid fees status")
  ],
  validate,
  updateFeesStatus
);
router.patch(
  "/students/:id",
  protect,
  authorize("admin", "warden"),
  [
    param("id").isMongoId().withMessage("Invalid student id"),
    body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 chars"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("phone").optional().isString().withMessage("Phone must be a string"),
    body("course").optional().isString().withMessage("Course must be a string"),
    body("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),
    body("feesStatus").optional().isIn(["Paid", "Pending"]).withMessage("Invalid fees status")
  ],
  validate,
  updateStudent
);
router.get("/wardens", protect, authorize("admin"), getWardens);
router.post(
  "/wardens",
  protect,
  authorize("admin"),
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 chars"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
    body("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Invalid gender")
  ],
  validate,
  createWarden
);
router.patch(
  "/wardens/:id",
  protect,
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid warden id"),
    body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 chars"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("gender").optional().isIn(["Male", "Female", "Other"]).withMessage("Invalid gender"),
    body("isActive").optional().isBoolean().withMessage("isActive must be boolean")
  ],
  validate,
  updateWarden
);
router.delete(
  "/wardens/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid warden id")],
  validate,
  deleteWarden
);

module.exports = router;
