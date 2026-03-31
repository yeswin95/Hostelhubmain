const express = require("express");
const { body, param } = require("express-validator");
const { getMenu, upsertMenuByDay } = require("../controllers/menuController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");

const router = express.Router();

router.get("/", protect, getMenu);
router.put(
  "/:day",
  protect,
  authorize("admin"),
  [
    param("day")
      .isIn(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
      .withMessage("Invalid day"),
    body("breakfast").trim().notEmpty().withMessage("Breakfast is required"),
    body("lunch").trim().notEmpty().withMessage("Lunch is required"),
    body("snacks").trim().notEmpty().withMessage("Snacks is required"),
    body("dinner").trim().notEmpty().withMessage("Dinner is required")
  ],
  validate,
  upsertMenuByDay
);

module.exports = router;
