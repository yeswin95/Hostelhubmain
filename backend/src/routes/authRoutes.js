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
    body("role").optional().isIn(["warden", "student"]).withMessage("Invalid role"),
    body("gender")
      .if(body("role").isIn(["student", "warden"]))
      .isIn(["Male", "Female", "Other"])
      .withMessage("Gender is required for student/warden signup"),
    body("phone")
      .if(body("role").equals("warden"))
      .trim()
      .notEmpty()
      .withMessage("Phone is required for warden signup"),
    body("wardenSignupKey")
      .if(body("role").equals("warden"))
      .notEmpty()
      .withMessage("Warden registration key is required")
  ],
  validate,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("role").optional().isIn(["admin", "warden", "student"]).withMessage("Invalid role")
  ],
  validate,
  login
);

router.get("/me", protect, me);

module.exports = router;
