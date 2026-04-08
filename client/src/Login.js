import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

// University email pattern check
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

export default function Login() {
  const [step, setStep] = useState(1); // 1: email, 2: otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState(null);
  const otpRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const validateEmail = useCallback((value) => {
    if (!value) {
      setEmailError("");
      return false;
    }
    if (!value.includes("@")) {
      setEmailError("");
      return false;
    }
    if (!isUniversityEmail(value)) {
      setEmailError("Please use a valid university email (.edu, .ac.in, etc.)");
      return false;
    }
    setEmailError("");
    return true;
  }, []);

  const sendOtp = async () => {
    if (!validateEmail(email)) {
      if (!email) setEmailError("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setStep(2);
        setCountdown(60);
        showToast("OTP sent to your email ✉️");
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 300);
      } else {
        showToast(data.message || "Error sending OTP", "error");
      }
    } catch (err) {
      showToast("Server error. Please try again.", "error");
    }

    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1]; // Take last char
    if (value && !/^\d$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      verifyOtp();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    
    // Focus last filled or first empty
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const verifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      showToast("Please enter the complete 6-digit OTP", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        showToast("Welcome to Comugle! 🎉");
        setTimeout(() => {
          window.location.href = "/profile";
        }, 500);
      } else {
        showToast("Invalid OTP. Please try again.", "error");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      showToast("Server error. Please try again.", "error");
    }

    setLoading(false);
  };

  const resendOtp = () => {
    if (countdown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    sendOtp();
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="login-card glass-card-strong">
        {/* Logo */}
        <div className="login-logo">
          <img src="/logo.png" alt="Comugle Logo" style={{ width: "64px", height: "64px", borderRadius: "16px", marginBottom: "16px" }} />
          <h1 className="text-gradient">Comugle</h1>
          <p className="tagline">Meet students from your university</p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? "active" : ""}`}></div>
          <div className="step-line"></div>
          <div className={`step-dot ${step >= 2 ? "active" : ""}`}></div>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="login-form animate-fadeIn" key="email-step">
            <div className="input-group">
              <label className="input-label">University Email</label>
              <div className="input-wrapper">
                <input
                  id="email-input"
                  className="input input-with-icon"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value.includes("@")) {
                      validateEmail(e.target.value);
                    } else {
                      setEmailError("");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  autoFocus
                />
                <span className="input-icon">📧</span>
              </div>
            </div>

            {emailError && <p className="email-error">⚠️ {emailError}</p>}
            {!emailError && email && (
              <p className="email-hint">Only university domains are accepted</p>
            )}

            <button
              id="send-otp-btn"
              className="btn btn-primary btn-lg"
              onClick={sendOtp}
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                "Send OTP →"
              )}
            </button>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="login-form animate-fadeIn" key="otp-step">
            <div className="input-group" style={{ alignItems: "center" }}>
              <label className="input-label">Enter Verification Code</label>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Sent to <strong style={{ color: "var(--text-accent)" }}>{email}</strong>
              </p>

              <div className="otp-container" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    ref={(el) => (otpRefs.current[index] = el)}
                    className={`otp-input ${digit ? "filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            <button
              id="verify-otp-btn"
              className="btn btn-primary btn-lg"
              onClick={verifyOtp}
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                "Verify & Continue ✓"
              )}
            </button>

            <div className="resend-section">
              {countdown > 0 ? (
                <span className="timer">Resend OTP in {countdown}s</span>
              ) : (
                <button className="resend-btn" onClick={resendOtp}>
                  Resend OTP
                </button>
              )}
            </div>

            <div className="back-link">
              <button
                onClick={() => {
                  setStep(1);
                  setOtp(["", "", "", "", "", ""]);
                }}
              >
                ← Change email
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
