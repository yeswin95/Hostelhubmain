const express = require("express");
const { body, param } = require("express-validator");
const {
  createRoom,
  getRooms,
  updateRoom,
  deleteRoom,
  allocateRoom,
  deallocateRoom,
  reallocateStudent
} = require("../controllers/roomController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/", protect, getRooms);
router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("roomNo").trim().notEmpty().withMessage("Room number is required"),
    body("hostel").isMongoId().withMessage("Valid hostel id is required"),
    body("capacity").isInt({ min: 1 }).withMessage("Capacity must be at least 1")
  ],
  validate,
  createRoom
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid room id")],
  validate,
  updateRoom
);
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid room id")],
  validate,
  deleteRoom
);
router.post(
  "/allocate",
  protect,
  authorize("admin"),
  [
    body("studentId").isMongoId().withMessage("Valid student id is required"),
    body("roomId").isMongoId().withMessage("Valid room id is required")
  ],
  validate,
  allocateRoom
);
router.post(
  "/deallocate",
  protect,
  authorize("admin"),
  [body("studentId").isMongoId().withMessage("Valid student id is required")],
  validate,
  deallocateRoom
);
router.post(
  "/reallocate",
  protect,
  authorize("admin"),
  [
    body("studentId").isMongoId().withMessage("Valid student id is required"),
    body("newRoomId").isMongoId().withMessage("Valid target room id is required")
  ],
  validate,
  reallocateStudent
);

module.exports = router;
