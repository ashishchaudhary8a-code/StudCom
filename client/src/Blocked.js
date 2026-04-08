import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Blocked() {
  const navigate = useNavigate();
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const storedData = localStorage.getItem("user");
    let stored = null;

    try {
      stored = storedData ? JSON.parse(storedData) : null;
    } catch {
      localStorage.removeItem("user");
    }

    if (!stored || !stored.blockedUntil) {
      navigate("/");
      return;
    }

    setBlockedUntil(new Date(stored.blockedUntil));
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (!blockedUntil) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = blockedUntil.getTime() - now.getTime();

      if (diff <= 0) {
        // Unblocked!
        const storedData = localStorage.getItem("user");
        if (storedData) {
          const user = JSON.parse(storedData);
          delete user.blockedUntil;
          localStorage.setItem("user", JSON.stringify(user));
        }
        navigate("/");
        return;
      }

      const totalBanMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      const elapsed = totalBanMs - diff;
      const pct = Math.min((elapsed / totalBanMs) * 100, 100);
      setProgress(pct);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil, navigate]);

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="blocked-page">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb orb-1" style={{ background: "radial-gradient(circle, rgba(239, 68, 68, 0.3), transparent 70%)" }}></div>
        <div className="orb orb-2" style={{ background: "radial-gradient(circle, rgba(239, 68, 68, 0.2), transparent 70%)" }}></div>
        <div className="orb orb-3" style={{ background: "radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent 70%)" }}></div>
      </div>

      <div className="blocked-card glass-card-strong">
        {/* Block icon */}
        <div className="blocked-icon">🚫</div>

        <h1 className="blocked-title">Account Suspended</h1>
        <p className="blocked-subtitle">
          Your account has been temporarily suspended due to multiple reports
          from other users about your behavior.
        </p>

        {/* Countdown timer boxes */}
        <div className="countdown-grid">
          <div className="countdown-box">
            <span className="countdown-value">{timeLeft.days ?? 0}</span>
            <span className="countdown-label">Days</span>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-box">
            <span className="countdown-value">{timeLeft.hours ?? 0}</span>
            <span className="countdown-label">Hours</span>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-box">
            <span className="countdown-value">{timeLeft.minutes ?? 0}</span>
            <span className="countdown-label">Minutes</span>
          </div>
          <div className="countdown-separator">:</div>
          <div className="countdown-box">
            <span className="countdown-value">{timeLeft.seconds ?? 0}</span>
            <span className="countdown-label">Seconds</span>
          </div>
        </div>

        {/* Progress bar timeline */}
        <div className="ban-timeline">
          <div className="timeline-header">
            <span className="timeline-label">Ban Progress</span>
            <span className="timeline-pct">{progress.toFixed(1)}%</span>
          </div>
          <div className="timeline-bar">
            <div
              className="timeline-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="timeline-dates">
            <span>Banned</span>
            <span>Unblocked</span>
          </div>
        </div>

        {/* Unblock date */}
        <div className="unblock-info">
          <p className="unblock-label">You will be unblocked on:</p>
          <p className="unblock-date">{formatDate(blockedUntil)}</p>
        </div>

        {/* Info section */}
        <div className="blocked-info">
          <h3>Why was I blocked?</h3>
          <p>
            More than 60% of the users you connected with reported your behavior.
            We take user safety seriously and temporarily restrict accounts that
            receive excessive reports.
          </p>
          <h3>What can I do?</h3>
          <ul>
            <li>Wait for the suspension period to end</li>
            <li>Reflect on your interactions and be respectful</li>
            <li>Future violations may result in longer or permanent bans</li>
          </ul>
        </div>

        <button
          className="btn btn-secondary"
          style={{ width: "100%", marginTop: "12px" }}
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/");
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
