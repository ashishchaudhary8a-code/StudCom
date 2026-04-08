import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "./App.css";

const socket = io("http://localhost:5000", { autoConnect: false });

// ===== SAME COURSE DATA AS PROFILE =====
const COURSE_DATA = {
  Engineering: {
    icon: "⚙️",
    streams: [
      "Computer Science (CSE)", "Information Technology (IT)", "Mechanical Engineering",
      "Civil Engineering", "Electrical Engineering", "Electronics & Communication (ECE)",
      "Electronics & Electrical (EEE)", "Chemical Engineering", "Aerospace Engineering",
      "Biotechnology", "Automobile Engineering", "Instrumentation Engineering",
      "Mining Engineering", "Metallurgical Engineering", "Petroleum Engineering",
      "Agricultural Engineering", "Marine Engineering", "Textile Engineering",
      "Industrial Engineering", "Environmental Engineering", "Biomedical Engineering",
      "Robotics & AI", "Data Science", "Cyber Security", "Other"
    ]
  },
  Medical: {
    icon: "🩺",
    streams: [
      "MBBS", "BDS (Dental)", "BAMS (Ayurveda)", "BHMS (Homeopathy)",
      "BUMS (Unani)", "B.Sc Nursing", "B.Pharmacy", "D.Pharmacy",
      "Physiotherapy (BPT)", "Veterinary Science (BVSc)",
      "Occupational Therapy", "Optometry", "Radiology",
      "Medical Lab Technology", "Paramedical Sciences", "Other"
    ]
  },
  Law: {
    icon: "⚖️",
    streams: [
      "BA LLB", "BBA LLB", "B.Com LLB", "B.Sc LLB", "LLB (3 Year)",
      "LLM", "Corporate Law", "Criminal Law", "Constitutional Law",
      "International Law", "Intellectual Property Law", "Cyber Law",
      "Environmental Law", "Tax Law", "Human Rights Law", "Family Law", "Other"
    ]
  },
  Commerce: {
    icon: "📊",
    streams: [
      "B.Com (General)", "B.Com (Honours)", "BBA / BMS", "BCA",
      "CA (Chartered Accountancy)", "CS (Company Secretary)",
      "CMA (Cost Management)", "B.Com (Banking & Insurance)",
      "B.Com (Accounting & Finance)", "B.Com (Financial Markets)",
      "B.Com (Taxation)", "BBE (Economics)", "BBI", "Other"
    ]
  },
  "Arts & Humanities": {
    icon: "🎨",
    streams: [
      "BA English", "BA History", "BA Political Science", "BA Psychology",
      "BA Sociology", "BA Economics", "BA Philosophy", "BA Geography",
      "BA Hindi / Regional Language", "BA Journalism & Mass Communication",
      "BA Social Work", "BA Fine Arts", "BA Music", "BA Theatre / Drama",
      "BA Public Administration", "BA Anthropology", "BA Archaeology",
      "BA Education", "BA Liberal Arts", "BA Foreign Languages", "Other"
    ]
  },
  Science: {
    icon: "🔬",
    streams: [
      "B.Sc Physics", "B.Sc Chemistry", "B.Sc Mathematics", "B.Sc Biology",
      "B.Sc Zoology", "B.Sc Botany", "B.Sc Biochemistry",
      "B.Sc Microbiology", "B.Sc Biotechnology", "B.Sc Computer Science",
      "B.Sc IT", "B.Sc Electronics", "B.Sc Statistics",
      "B.Sc Environmental Science", "B.Sc Geology", "B.Sc Food Technology",
      "B.Sc Forensic Science", "B.Sc Genetics", "B.Sc Nutrition",
      "B.Sc Agriculture", "B.Sc Horticulture", "B.Sc Fisheries", "Other"
    ]
  },
  Architecture: {
    icon: "🏛️",
    streams: [
      "B.Arch", "B.Planning", "M.Arch", "Interior Design",
      "Landscape Architecture", "Urban Design", "Town Planning",
      "Sustainable Architecture", "Other"
    ]
  },
  Design: {
    icon: "✏️",
    streams: [
      "B.Des (Fashion Design)", "B.Des (Product Design)", "B.Des (Graphic Design)",
      "B.Des (Communication Design)", "B.Des (UI/UX Design)",
      "B.Des (Interior Design)", "B.Des (Textile Design)",
      "B.Des (Animation & Multimedia)", "B.Des (Game Design)",
      "B.Des (Industrial Design)", "B.Des (Jewellery Design)",
      "B.Des (Accessory Design)", "Other"
    ]
  },
  Management: {
    icon: "📈",
    streams: [
      "BBA", "BMS", "MBA (General)", "MBA (Finance)", "MBA (Marketing)",
      "MBA (HR)", "MBA (Operations)", "MBA (IT)", "MBA (International Business)",
      "MBA (Healthcare)", "MBA (Agribusiness)", "PGDM",
      "BHM (Hotel Management)", "Event Management",
      "Sports Management", "Other"
    ]
  },
  Education: {
    icon: "📚",
    streams: [
      "B.Ed", "B.El.Ed", "M.Ed", "BA B.Ed (Integrated)",
      "B.Sc B.Ed (Integrated)", "D.El.Ed", "B.P.Ed (Physical Education)",
      "Special Education", "Early Childhood Education", "Other"
    ]
  },
  "Media & Journalism": {
    icon: "📰",
    streams: [
      "BJMC (Journalism & Mass Communication)", "BA Journalism",
      "B.Sc (Film & Television)", "BA (Media Studies)",
      "BA (Advertising & PR)", "B.Sc (Animation)",
      "BA (Digital Media)", "Photojournalism", "Other"
    ]
  },
  Agriculture: {
    icon: "🌾",
    streams: [
      "B.Sc Agriculture", "B.Sc Horticulture", "B.Sc Forestry",
      "B.Tech Agricultural Engineering", "B.Sc Dairy Technology",
      "B.Sc Food Science & Technology", "B.Sc Fisheries",
      "B.Sc Sericulture", "BVSc (Veterinary)", "Other"
    ]
  },
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [status, setStatus] = useState("idle"); // idle, waiting, connected, disconnected
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [toast, setToast] = useState(null);
  const [partnerEmail, setPartnerEmail] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [hasReported, setHasReported] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [liveStats, setLiveStats] = useState({ total: 0, courses: {}, streams: {} });

  // Filter state — cascading
  const [filterCourse, setFilterCourse] = useState(""); // "" means random/all
  const [filterStream, setFilterStream] = useState(""); // "" means all streams in that course
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const chatEndRef = useRef(null);
  const iceQueue = useRef([]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

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

  useEffect(() => {
    const storedData = localStorage.getItem("user");
    let stored = null;

    try {
      stored = storedData ? JSON.parse(storedData) : null;
    } catch {
      localStorage.removeItem("user");
    }

    if (!stored) {
      navigate("/");
      return;
    }

    if (!stored.username || !stored.college || !stored.course) {
      navigate("/profile");
      return;
    }

    setUser(stored);
    socket.connect();
    
    // We emit `user-online` to be counted in live stats
    socket.emit("user-online", { course: stored.course, stream: stored.stream });

    socket.on("live-stats", (stats) => {
      setLiveStats(stats);
    });

    socket.on("waiting", () => {
      setStatus("waiting");
    });

    socket.on("matched", async (data) => {
      setStatus("connected");
      setPartnerEmail(data?.partnerEmail || null);
      setPartnerProfile(data?.partnerProfile || null);
      setHasReported(false);
      setChat((prev) => [
        ...prev,
        { sender: "system", text: "You're connected with a stranger! Say hi 👋" },
      ]);

      // Only the initiator creates the offer
      if (data?.initiator) {
        await startVideo(true);
      }
      // Non-initiator will wait for the offer to set up media to avoid race conditions.
    });

    // Account blocked by server
    socket.on("account-blocked", (data) => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.blockedUntil = data.blockedUntil;
      localStorage.setItem("user", JSON.stringify(storedUser));
      window.location.href = "/blocked";
    });

    // Warning: reports piling up
    socket.on("report-warning", (data) => {
      setChat((prev) => [
        ...prev,
        { sender: "system", text: data.message },
      ]);
      setToast({ message: data.message, type: "warning" });
    });

    socket.on("partner-left", () => {
      setStatus("disconnected");
      setPartnerProfile(null);
      setChat((prev) => [
        ...prev,
        { sender: "system", text: "Stranger has disconnected." },
      ]);
      endCall();
    });

    // When partner leaves, we get auto-requeued by the server
    socket.on("partner-left-requeue", () => {
      endCall();
      setPartnerProfile(null);
      setChat((prev) => [
        ...prev,
        { sender: "system", text: "Stranger left. Finding you someone new..." },
      ]);
      setStatus("waiting");
    });

    socket.on("receive-message", (msg) => {
      setChat((prev) => [...prev, { sender: "other", text: msg }]);
    });

    // WebRTC signaling
    socket.on("offer", async (offer) => {
      try {
        if (!peerRef.current || peerRef.current.signalingState === "closed") {
          createPeer();
        }

        // Get local media if not already available
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (localVideo.current) localVideo.current.srcObject = stream;
          streamRef.current = stream;
          stream.getTracks().forEach((track) => {
            peerRef.current.addTrack(track, stream);
          });
        }

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("answer", answer);

        // Process any queued ICE candidates
        while (iceQueue.current.length > 0) {
          await peerRef.current.addIceCandidate(iceQueue.current.shift());
        }
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    socket.on("answer", async (answer) => {
      try {
        if (peerRef.current && peerRef.current.signalingState === "have-local-offer") {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          
          while (iceQueue.current.length > 0) {
            await peerRef.current.addIceCandidate(iceQueue.current.shift());
          }
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        if (peerRef.current && peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceQueue.current.push(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      socket.off("waiting");
      socket.off("matched");
      socket.off("account-blocked");
      socket.off("report-warning");
      socket.off("partner-left");
      socket.off("partner-left-requeue");
      socket.off("receive-message");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("live-stats");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // startVideo: if isInitiator, create offer. Otherwise just get media ready.
  const startVideo = async (isInitiator) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = stream;
      }
      streamRef.current = stream;

      createPeer();

      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });

      // Only the initiator creates and sends the offer
      if (isInitiator) {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("offer", offer);
      }
    } catch (err) {
      console.error("Video error:", err);
      showToast("Camera access denied", "error");
    }
  };

  const createPeer = () => {
    // Close existing peer if any
    if (peerRef.current) {
      try { peerRef.current.close(); } catch (e) { /* ignore */ }
    }

    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerRef.current.ontrack = (event) => {
      if (remoteVideo.current && remoteVideo.current.srcObject !== event.streams[0]) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    iceQueue.current = [];
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  // Build the filter string for matching
  const getFilterString = () => {
    if (!filterCourse) return "random";
    if (!filterStream) return filterCourse; // match anyone in that course
    return `${filterCourse}::${filterStream}`; // match specific stream
  };

  const getFilterLabel = () => {
    if (!filterCourse) return "🎲 Random (Anyone)";
    const courseData = COURSE_DATA[filterCourse];
    if (!filterStream) return `${courseData?.icon || ""} All ${filterCourse}`;
    return `${courseData?.icon || ""} ${filterStream}`;
  };

  const startSearch = () => {
    if (status === "connected") {
      socket.emit("leave");
      endCall();
      setChat([]);
    }
    setPartnerProfile(null);
    setIsMicOn(true);
    setIsVideoOn(true);
    setStatus("waiting");
    setChat([{ sender: "system", text: `Looking for someone (${getFilterLabel()})...` }]);
    socket.emit("find-match", { email: user.email, filter: getFilterString() });
  };

  const stopChat = () => {
    socket.emit("leave");
    setChat((prev) => [
      ...prev,
      { sender: "system", text: "You disconnected." },
    ]);
    setStatus("disconnected");
    setPartnerEmail(null);
    setPartnerProfile(null);
    endCall();
  };

  // Report the current stranger
  const reportUser = async () => {
    if (!partnerEmail || hasReported) return;

    try {
      const res = await fetch("http://localhost:5000/report-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterEmail: user.email,
          reportedEmail: partnerEmail,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setHasReported(true);
        showToast("User reported. Thank you.");
        setChat((prev) => [
          ...prev,
          { sender: "system", text: "You reported this user." },
        ]);
      } else {
        showToast(data.message || "Error reporting user", "error");
      }
    } catch (err) {
      showToast("Error reporting user", "error");
    }
  };

  const sendMessage = () => {
    if (!input.trim() || status !== "connected") return;
    socket.emit("send-message", input);
    setChat((prev) => [...prev, { sender: "me", text: input }]);
    setInput("");
  };

  const logout = () => {
    localStorage.removeItem("user");
    socket.disconnect();
    navigate("/");
  };

  const getStatusText = () => {
    switch (status) {
      case "waiting":
        return (
          <>
            Searching for a stranger
            <span className="loading-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </span>
          </>
        );
      case "connected":
        return "🎉 Connected with a stranger!";
      case "disconnected":
        return "Stranger disconnected. Click Start or Next to find someone new.";
      default:
        return null;
    }
  };

  const getStatusClass = () => {
    if (status === "connected") return "status-banner connected";
    if (status === "disconnected") return "status-banner disconnected";
    return "status-banner";
  };

  // ===== FILTER PANEL COMPONENT =====
  const FilterPanel = ({ onClose, compact }) => (
    <div className={`filter-panel ${compact ? "filter-panel-compact" : ""}`}>
      <div className="filter-panel-header">
        <h3>🎯 Who do you want to chat with?</h3>
        {onClose && (
          <button className="filter-close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      {/* Random option */}
      <button
        className={`filter-random-btn ${!filterCourse ? "selected" : ""}`}
        onClick={() => {
          setFilterCourse("");
          setFilterStream("");
          if (compact) onClose?.();
        }}
      >
        <span>🎲</span>
        <span>Random — Chat with anyone</span>
      </button>

      {/* Course selection */}
      <p className="filter-section-label">Or pick a course:</p>
      <div className="filter-course-grid">
        {Object.entries(COURSE_DATA).map(([name, data]) => {
          const count = liveStats.courses[name] || 0;
          return (
            <button
              key={name}
              className={`filter-course-chip ${filterCourse === name ? "selected" : ""}`}
              onClick={() => {
                setFilterCourse(name);
                setFilterStream("");
              }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              <div>
                <span className="chip-icon">{data.icon}</span>
                <span className="chip-label">{name}</span>
              </div>
              {count > 0 && <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "bold" }}>🟢 {count} live</span>}
            </button>
          )
        })}
      </div>

      {/* Stream selection — shows when a course is picked */}
      {filterCourse && COURSE_DATA[filterCourse] && (
        <div className="filter-stream-section animate-fadeIn">
          <p className="filter-section-label">
            Pick a stream in {COURSE_DATA[filterCourse]?.icon} {filterCourse}:
          </p>

          {/* "All streams" option */}
          <button
            className={`filter-stream-chip all-streams ${!filterStream ? "selected" : ""}`}
            onClick={() => {
              setFilterStream("");
              if (compact) onClose?.();
            }}
          >
            All {filterCourse} students
          </button>

          <div className="filter-stream-grid">
            {COURSE_DATA[filterCourse].streams.map((stream) => {
              const streamKey = `${filterCourse}::${stream}`;
              const count = liveStats.streams[streamKey] || 0;
              return (
                <button
                  key={stream}
                  className={`filter-stream-chip ${filterStream === stream ? "selected" : ""}`}
                  onClick={() => {
                    setFilterStream(stream);
                    if (compact) onClose?.();
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}
                >
                  <span>{stream}</span>
                  {count > 0 && <span style={{ fontSize: "0.7rem", color: "#10b981", whiteSpace: "nowrap" }}>🟢 {count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-logo">
          <img src="/logo.png" alt="StudCom" style={{ width: "36px", height: "36px", borderRadius: "8px" }} />
          <span className="nav-logo-text text-gradient">StudCom</span>
        </div>

        <div className="nav-status">
          <span className="status-dot"></span>
          <span>Online</span>
        </div>

        <div className="nav-actions">
          <button
            className="btn btn-secondary"
            style={{ padding: "8px 14px", fontSize: "0.78rem" }}
            onClick={() => navigate("/profile")}
          >
            {user?.avatar || "👤"} Profile
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: "8px 14px", fontSize: "0.78rem" }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Status banner */}
      {status !== "idle" && (
        <div className={getStatusClass()}>
          {getStatusText()}
        </div>
      )}

      {/* Main content */}
      <div className="home-content">
        {/* Video section */}
        <div className="video-section">
          {status === "idle" ? (
            /* Idle state — show filter panel directly */
            <div className="idle-overlay">
              <div className="idle-icon">🎥</div>
              <h2 className="text-gradient">Ready to meet someone?</h2>
              <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "6px 16px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: "bold", margin: "-10px 0 15px 0" }}>
                <span className="status-dot" style={{ position: "relative", top: 0, width: "10px", height: "10px" }}></span>
                {liveStats.total} users online right now
              </div>
              <p>
                Connect with students from universities worldwide.
                Pick who you want to talk to, or go random!
              </p>

              <FilterPanel compact={false} />

              <div className="idle-start-section">
                <div className="filter-active-badge">
                  {getFilterLabel()}
                </div>
                <button className="btn btn-primary btn-lg" onClick={startSearch}>
                  Start Chatting 🚀
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="video-area">
                {/* Remote video (stranger) — fullscreen */}
                <div className="video-remote">
                  <video ref={remoteVideo} autoPlay playsInline />
                  {status === "connected" ? (
                    <>
                      {partnerProfile ? (
                        <div className="partner-info-overlay animate-fadeIn">
                           <div className="partner-info-header">
                             <span className="partner-avatar">{partnerProfile.avatar || "👤"}</span>
                             <span className="partner-username">{partnerProfile.username || "Stranger"}</span>
                             {partnerProfile.country && <span className="partner-country">{partnerProfile.country}</span>}
                           </div>
                           <div className="partner-info-details">
                             {partnerProfile.college && <span>🎓 {partnerProfile.college}</span>}
                             {partnerProfile.year && <span>📅 {partnerProfile.year}</span>}
                             {partnerProfile.course && <span>📚 {partnerProfile.course} {partnerProfile.stream ? `- ${partnerProfile.stream}` : ''}</span>}
                           </div>
                        </div>
                      ) : (
                        <span className="video-label">Stranger</span>
                      )}
                    </>
                  ) : (
                    <div className="video-placeholder">
                      <span className="placeholder-icon">👤</span>
                      <span className="placeholder-text">
                        {status === "waiting"
                          ? "Finding someone..."
                          : "No one connected"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Local video (you) — small PiP bottom-right */}
                <div className="video-pip">
                  <video ref={localVideo} autoPlay muted playsInline style={{ display: isVideoOn ? "block" : "none" }} />
                  {!isVideoOn && (
                    <div style={{ background: "var(--bg-secondary)", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {user?.photo ? (
                        <img src={user.photo} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "5rem" }}>{user?.avatar || "👤"}</span>
                      )}
                    </div>
                  )}
                  <span className="pip-label">You {!isVideoOn ? " (Camera Off)" : ""}</span>
                </div>
              </div>

              {/* Control bar */}
              <div className="control-bar">
                <div className="control-group">
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "0.78rem", padding: "10px 14px" }}
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                  >
                    🎯 {getFilterLabel()}
                  </button>
                </div>

                <div className="divider"></div>

                <div className="control-group">
                  {status !== "connected" ? (
                    <button className="btn btn-success" onClick={startSearch}>
                      ▶ {status === "waiting" ? "Searching..." : "Start"}
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={startSearch}>
                      ⏭ Next
                    </button>
                  )}

                  {(status === "connected" || status === "waiting") && (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: "1rem", padding: "10px 14px" }} 
                        onClick={toggleMic} 
                        title={isMicOn ? "Mute Mic" : "Unmute Mic"}
                      >
                        {isMicOn ? "🎙️" : "🔇"}
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: "1rem", padding: "10px 14px" }} 
                        onClick={toggleVideo} 
                        title={isVideoOn ? "Turn Off Video" : "Turn On Video"}
                      >
                        {isVideoOn ? "📹" : "🚫"}
                      </button>
                      <button className="btn btn-danger" onClick={stopChat}>
                        ⏹ Stop
                      </button>
                    </>
                  )}

                  {status === "connected" && !hasReported && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "0.78rem", padding: "10px 14px", color: "#b91c1c", border: "1px solid #b91c1c" }}
                      onClick={reportUser}
                    >
                      ⚠ Report
                    </button>
                  )}
                  {hasReported && status === "connected" && (
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "0 8px" }}>
                      ✓ Reported
                    </span>
                  )}
                </div>
              </div>

              {/* Filter panel popup */}
              {showFilterPanel && (
                <div className="filter-panel-overlay">
                  <FilterPanel
                    compact={true}
                    onClose={() => setShowFilterPanel(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat section */}
        {status !== "idle" && (
          <div className="chat-section">
          <div className="chat-header">
            <h3>💬 Text Chat</h3>
            <span className="chat-status">
              {status === "connected"
                ? "🟢 Connected"
                : status === "waiting"
                ? "🟡 Searching"
                : "⚫ Idle"}
            </span>
          </div>

          {chat.length === 0 ? (
            <div className="chat-empty">
              <span className="empty-icon">💬</span>
              <span className="empty-text">
                No messages yet. Start a chat to begin!
              </span>
            </div>
          ) : (
            <div className="chat-messages">
              {chat.map((c, i) => (
                <div key={i} className={`chat-message ${c.sender}`}>
                  {c.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          <div className="chat-input-area">
            <input
              id="chat-input"
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                status === "connected"
                  ? "Type a message..."
                  : "Connect to start chatting"
              }
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={status !== "connected"}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={status !== "connected" || !input.trim()}
            >
              ➤
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
