const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ===== CONNECT MONGODB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== IN-MEMORY (temporary data only) =====
let otpStore = {}; // email -> otp
let queue = []; // waiting users (socket-based, ephemeral)
let onlineUsers = {}; // socket.id -> { course, stream }

function broadcastStats() {
  const stats = { total: 0, courses: {}, streams: {} };
  stats.total = Object.keys(onlineUsers).length;
  for (const user of Object.values(onlineUsers)) {
    if (user.course) {
      stats.courses[user.course] = (stats.courses[user.course] || 0) + 1;
    }
    if (user.stream) {
      const streamKey = `${user.course}::${user.stream}`;
      stats.streams[streamKey] = (stats.streams[streamKey] || 0) + 1;
    }
  }
  io.emit("live-stats", stats);
}

// ===== REPORT/BAN CONFIG =====
const REPORT_RATIO_THRESHOLD = 0.6; // 60% — if 6 out of 10 people report you, you're blocked
const MIN_CONNECTIONS_FOR_BAN = 5; // need at least 5 connections before ratio can trigger ban
const BAN_DURATION_DAYS = 7; // blocked for 1 week

// ===== UNIVERSITY EMAIL VALIDATION =====
const UNIVERSITY_PATTERNS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2,}$/i,
  /\.ac\.[a-z]{2,}$/i,
  /\.edu\.[a-z]{2,}\.[a-z]{2,}$/i,
  /\.university$/i,
  /\.uni\.[a-z]{2,}$/i,
  /\.ernet\.in$/i,
  /\.nit\.[a-z]{2,}$/i,
  /\.iit\.[a-z]{2,}$/i,
  /\.bits-pilani\.ac\.in$/i,
];

function isUniversityEmail(email) {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return UNIVERSITY_PATTERNS.some((pattern) => pattern.test(domain));
}

// ===== MAIL SETUP =====
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ===== SEND OTP =====
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!isUniversityEmail(email)) {
    return res.json({
      success: false,
      message: "Only university email addresses are accepted (.edu, .ac.in, etc.)",
    });
  }

  // Check if user is blocked
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isBlocked()) {
    const unblockDate = existingUser.blockedUntil.toLocaleDateString();
    return res.json({
      success: false,
      message: `Your account is blocked due to excessive reports. You will be unblocked on ${unblockDate}.`,
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: "ashishchaudhary8a@gmail.com",
      to: email,
      subject: "Comugle - Your Verification Code",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 40px 30px; background: #0a0a1a; border-radius: 16px;">
          <h1 style="color: #f1f5f9; font-size: 24px; margin-bottom: 8px;">Comugle 💬</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">Your verification code</p>
          <div style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <span style="color: white; font-size: 32px; font-weight: 800; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This code expires in 10 minutes. Don't share it with anyone.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Error sending email. Please try again." });
  }
});

// ===== VERIFY OTP =====
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] == otp) {
    delete otpStore[email];

    // Find or create user in MongoDB
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    // Check if blocked
    if (user.isBlocked()) {
      const unblockDate = user.blockedUntil.toLocaleDateString();
      return res.json({
        success: false,
        message: `Account blocked until ${unblockDate} due to reports.`,
      });
    }

    res.json({ success: true, user: user.toObject() });
  } else {
    res.json({ success: false });
  }
});

// ===== SAVE PROFILE =====
app.post("/save-profile", async (req, res) => {
  const { email, ...data } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $set: data },
      { new: true, upsert: true }
    );

    res.json({ success: true, user: user.toObject() });
  } catch (err) {
    console.error("Profile save error:", err);
    res.json({ success: false, message: "Error saving profile" });
  }
});

// ===== REPORT USER =====
app.post("/report-user", async (req, res) => {
  const { reporterEmail, reportedEmail } = req.body;

  if (!reporterEmail || !reportedEmail) {
    return res.json({ success: false, message: "Missing data" });
  }

  if (reporterEmail === reportedEmail) {
    return res.json({ success: false, message: "Cannot report yourself" });
  }

  try {
    // Increment the reported user's report count
    const reportedUser = await User.findOneAndUpdate(
      { email: reportedEmail },
      { $inc: { totalReports: 1 } },
      { new: true }
    );

    if (!reportedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    const ratio = reportedUser.getReportRatio();
    console.log(
      `📊 User ${reportedEmail}: ${reportedUser.totalReports}/${reportedUser.totalConnections} reports (${(ratio * 100).toFixed(1)}%)`
    );

    // Check if the ratio crosses the BAN threshold (60%)
    if (
      reportedUser.totalConnections >= MIN_CONNECTIONS_FOR_BAN &&
      ratio >= REPORT_RATIO_THRESHOLD
    ) {
      // Block the user for a week
      const blockedUntil = new Date();
      blockedUntil.setDate(blockedUntil.getDate() + BAN_DURATION_DAYS);

      await User.findOneAndUpdate(
        { email: reportedEmail },
        { $set: { blockedUntil } }
      );

      console.log(`🚫 User ${reportedEmail} BLOCKED until ${blockedUntil.toLocaleDateString()}`);

      // Disconnect and notify the blocked user if online
      const sockets = await io.fetchSockets();
      for (const s of sockets) {
        if (s.email === reportedEmail) {
          s.emit("account-blocked", {
            message: `Your account has been suspended for ${BAN_DURATION_DAYS} days due to multiple reports from other users.`,
            blockedUntil: blockedUntil.toISOString(),
            banDays: BAN_DURATION_DAYS,
          });
          s.disconnect(true);
        }
      }

      return res.json({
        success: true,
        message: "Report submitted successfully. The user has been suspended.",
      });
    }

    // WARNING: if ratio is above 40% but below 60%, warn the reported user
    const WARNING_THRESHOLD = 0.4;
    if (
      reportedUser.totalConnections >= MIN_CONNECTIONS_FOR_BAN &&
      ratio >= WARNING_THRESHOLD
    ) {
      const sockets = await io.fetchSockets();
      for (const s of sockets) {
        if (s.email === reportedEmail) {
          s.emit("report-warning", {
            message: "⚠️ We've received several reports about your behavior. Please be respectful to other users or your account may be suspended.",
            reportCount: reportedUser.totalReports,
            connectionCount: reportedUser.totalConnections,
          });
        }
      }
    }

    res.json({
      success: true,
      message: "Report submitted successfully. Thank you for helping keep Comugle safe.",
    });
  } catch (err) {
    console.error("Report error:", err);
    res.json({ success: false, message: "Error reporting user" });
  }
});

// ===== SOCKET.IO =====
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.partner = null;

  socket.on("user-online", (data) => {
    onlineUsers[socket.id] = data;
    broadcastStats();
  });

  // ===== FIND MATCH =====
  socket.on("find-match", async ({ email, filter }) => {
    socket.email = email;
    socket.filter = filter;

    // Check if user is blocked before allowing match
    const user = await User.findOne({ email });
    if (user && user.isBlocked()) {
      socket.emit("account-blocked", {
        message: "Your account is blocked due to excessive reports.",
        blockedUntil: user.blockedUntil.toISOString(),
      });
      return;
    }

    let matchIndex = queue.findIndex(
      (u) =>
        u.socket !== socket &&
        (u.filter === filter || filter === "random" || u.filter === "random")
    );

    if (matchIndex !== -1) {
      const matchUser = queue.splice(matchIndex, 1)[0];

      socket.partner = matchUser.socket;
      matchUser.socket.partner = socket;

      // Increment totalConnections for both users
      const userA = await User.findOneAndUpdate(
        { email: socket.email },
        { $inc: { totalConnections: 1 } },
        { new: true }
      );
      const userB = await User.findOneAndUpdate(
        { email: matchUser.socket.email },
        { $inc: { totalConnections: 1 } },
        { new: true }
      );

      const profileA = {
        username: userA?.username, college: userA?.college, country: userA?.country,
        year: userA?.year, avatar: userA?.avatar, course: userA?.course, stream: userA?.stream
      };
      const profileB = {
        username: userB?.username, college: userB?.college, country: userB?.country,
        year: userB?.year, avatar: userB?.avatar, course: userB?.course, stream: userB?.stream
      };

      socket.emit("matched", { partnerEmail: matchUser.socket.email, initiator: true, partnerProfile: profileB });
      matchUser.socket.emit("matched", { partnerEmail: socket.email, initiator: false, partnerProfile: profileA });
    } else {
      queue.push({ socket, filter });
      socket.emit("waiting");
    }
  });

  // ===== CHAT =====
  socket.on("send-message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("receive-message", msg);
    }
  });

  // ===== LEAVE =====
  socket.on("leave", () => {
    if (socket.partner) {
      const partner = socket.partner;
      partner.partner = null;

      partner.emit("partner-left-requeue");

      const partnerFilter = partner.filter || "random";
      queue = queue.filter((u) => u.socket !== partner);
      queue.push({ socket: partner, filter: partnerFilter });
      partner.emit("waiting");
    }

    socket.partner = null;
    queue = queue.filter((u) => u.socket !== socket);
  });

  // ===== WEBRTC SIGNALING =====
  socket.on("offer", (offer) => {
    if (socket.partner) {
      socket.partner.emit("offer", offer);
    }
  });

  socket.on("answer", (answer) => {
    if (socket.partner) {
      socket.partner.emit("answer", answer);
    }
  });

  socket.on("ice-candidate", (candidate) => {
    if (socket.partner) {
      socket.partner.emit("ice-candidate", candidate);
    }
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }

    queue = queue.filter((u) => u.socket !== socket);
    delete onlineUsers[socket.id];
    broadcastStats();
    console.log("User disconnected:", socket.id);
  });
});

// ===== START SERVER =====
server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
