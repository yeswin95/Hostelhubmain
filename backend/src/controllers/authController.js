const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  course: user.course,
  gender: user.gender,
  room: user.room,
  hostel: user.hostel,
  allocationStatus: user.allocationStatus
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, course, gender, wardenSignupKey } = req.body;

  if (role === "admin") {
    throw new ApiError(403, "Admin registration is disabled");
  }

  if (role === "warden") {
    const plainKey = process.env.WARDEN_SIGNUP_KEY || "";
    if (!plainKey || String(wardenSignupKey || "") !== plainKey) {
      throw new ApiError(403, "Invalid warden registration key");
    }
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
    phone,
    course,
    gender,
    room: null,
    allocationStatus: role === "student" ? "pending" : "allocated"
  });

  const token = generateToken(user);
  res.status(201).json({
    success: true,
    message: "Signup successful",
    token,
    user: sanitizeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (role && role !== user.role) {
    throw new ApiError(401, "Invalid role for this account");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateToken(user);
  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: sanitizeUser(user)
  });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

module.exports = { signup, login, me };
