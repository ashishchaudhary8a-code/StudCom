const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "😎",
    },
    photo: {
      type: String,
      default: "",
    },
    college: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    year: {
      type: String,
      default: "",
    },
    course: {
      type: String,
      default: "",
    },
    stream: {
      type: String,
      default: "",
    },

    // ===== REPORT / BAN SYSTEM =====
    totalConnections: {
      type: Number,
      default: 0,
    },
    totalReports: {
      type: Number,
      default: 0,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Check if user is currently blocked
userSchema.methods.isBlocked = function () {
  if (!this.blockedUntil) return false;
  return new Date() < this.blockedUntil;
};

// Get report ratio (returns 0 if no connections yet)
userSchema.methods.getReportRatio = function () {
  if (this.totalConnections < 5) return 0; // need at least 5 connections before ratio kicks in
  return this.totalReports / this.totalConnections;
};

module.exports = mongoose.model("User", userSchema);
