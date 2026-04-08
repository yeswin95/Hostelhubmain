const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const hostelRoutes = require("./routes/hostelRoutes");
const roomRoutes = require("./routes/roomRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const menuRoutes = require("./routes/menuRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();
const frontendPath = path.join(__dirname, "../../");
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:5001", "http://127.0.0.1:5001", ...allowedOrigins],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"]
      }
    }
  })
);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : "*"
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.static(frontendPath));
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "HostelHub API healthy" });
});

// Explicit handler so GET /api is not a 404 (browser or uptime checks often hit this path).
app.get("/api", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "HostelHub API is running. Use /api/health or routes under /api/auth, /api/users, etc."
  });
});

// Serve landing page from static frontend.
app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/leaves", leaveRequestRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
