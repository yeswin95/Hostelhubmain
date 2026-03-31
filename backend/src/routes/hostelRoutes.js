const express = require("express");
const { body, param } = require("express-validator");
const { createHostel, getHostels, updateHostel, deleteHostel } = require("../controllers/hostelController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/", protect, getHostels);
router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("name").trim().notEmpty().withMessage("Hostel name is required"),
    body("code").trim().notEmpty().withMessage("Hostel code is required"),
    body("address").trim().notEmpty().withMessage("Hostel address is required")
  ],
  validate,
  createHostel
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid hostel id")],
  validate,
  updateHostel
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid hostel id")],
  validate,
  deleteHostel
);

module.exports = router;
