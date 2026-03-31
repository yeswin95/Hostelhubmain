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
  room: user.room,
  hostel: user.hostel,
  allocationStatus: user.allocationStatus
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, course, adminSignupKey } = req.body;

  if (role === "admin" && adminSignupKey !== process.env.ADMIN_SIGNUP_KEY) {
    throw new ApiError(403, "Invalid admin signup key");
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
    room: null,
    allocationStatus: role === "admin" ? "allocated" : "pending"
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
