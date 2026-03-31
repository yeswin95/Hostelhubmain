const express = require("express");
const { body } = require("express-validator");
const { signup, login, me } = require("../controllers/authController");
const validate = require("../middlewares/validateMiddleware");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 chars"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
    body("role").optional().isIn(["admin", "student"]).withMessage("Invalid role")
  ],
  validate,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role").optional().isIn(["admin", "student"]).withMessage("Invalid role")
  ],
  validate,
  login
);

router.get("/me", protect, me);

module.exports = router;
