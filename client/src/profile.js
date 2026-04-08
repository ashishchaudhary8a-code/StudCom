import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

// ===== COURSE & STREAM DATA =====
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

const YEAR_OPTIONS = [
  "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year",
  "Post Graduate (PG)", "PhD / Doctorate", "Alumni"
];

const AVATAR_OPTIONS = [
  "😎", "🤓", "🧑‍💻", "👨‍🎓", "👩‍🎓", "🦊", "🐱", "🐶",
  "🦁", "🐼", "🐨", "🦄", "🐲", "🦅", "🐺", "🐯",
  "🌟", "⚡", "🔥", "💎", "🎯", "🎭", "👾", "🤖"
];

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "South Korea", "China", "Singapore",
  "UAE", "Netherlands", "Sweden", "Switzerland", "New Zealand",
  "Ireland", "Italy", "Spain", "Brazil", "Mexico", "Russia",
  "South Africa", "Kenya", "Nigeria", "Egypt", "Malaysia",
  "Thailand", "Philippines", "Indonesia", "Vietnam", "Bangladesh",
  "Pakistan", "Sri Lanka", "Nepal", "Other"
];

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [form, setForm] = useState({
    username: "",
    avatar: "😎",
    photo: "",
    college: "",
    country: "",
    year: "",
    course: "",
    stream: "",
  });

  const isNewUser = !form.username && !form.college;

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

    setUser(stored);
    setForm((prev) => ({ ...prev, ...stored }));
    if (stored.photo) {
      setPhotoPreview(stored.photo);
    }
  }, [navigate]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset stream when course changes
      if (name === "course") {
        updated.stream = "";
      }
      return updated;
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo must be under 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setForm((prev) => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const selectAvatar = (avatar) => {
    setForm((prev) => ({ ...prev, avatar, photo: "" }));
    setPhotoPreview(null);
    setShowAvatarPicker(false);
  };

  const save = async () => {
    // Validate required fields
    if (!form.username.trim()) {
      showToast("Please enter a username", "error");
      return;
    }
    if (!form.college.trim()) {
      showToast("Please enter your college name", "error");
      return;
    }
    if (!form.country) {
      showToast("Please select your country", "error");
      return;
    }
    if (!form.year) {
      showToast("Please select your year", "error");
      return;
    }
    if (!form.course) {
      showToast("Please select your course", "error");
      return;
    }
    if (!form.stream) {
      showToast("Please select your stream/branch", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: user.email }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        showToast("Profile saved! Let's go 🚀");
        setTimeout(() => navigate("/home"), 800);
      } else {
        showToast("Error saving profile", "error");
      }
    } catch (err) {
      showToast("Server error. Please try again.", "error");
    }

    setLoading(false);
  };

  const availableStreams = form.course ? COURSE_DATA[form.course]?.streams || [] : [];

  return (
    <div className="profile-page">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="profile-card glass-card-strong">
        {/* Header */}
        <div className="profile-header">
          <div>
            <h2 className="text-gradient">
              {isNewUser ? "Create Your Profile" : "Edit Profile"}
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              {isNewUser ? "Set up your profile to start chatting" : user?.email}
            </p>
          </div>
          {!isNewUser && (
            <button className="btn btn-secondary" onClick={() => navigate("/home")} style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
              ← Back
            </button>
          )}
        </div>

        {/* Avatar / Photo */}
        <div className="profile-avatar-section">
          <div
            className="profile-avatar-main"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="avatar-photo" />
            ) : (
              <span className="avatar-emoji">{form.avatar}</span>
            )}
            <div className="avatar-edit-badge">✏️</div>
          </div>

          <div className="avatar-actions">
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.78rem", padding: "8px 14px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Upload Photo
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.78rem", padding: "8px 14px" }}
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            >
              😎 Choose Avatar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Avatar Picker */}
        {showAvatarPicker && (
          <div className="avatar-picker animate-fadeIn">
            <p className="input-label" style={{ marginBottom: "10px" }}>Pick an Avatar</p>
            <div className="avatar-grid">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  className={`avatar-option ${form.avatar === av && !photoPreview ? "selected" : ""}`}
                  onClick={() => selectAvatar(av)}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="profile-form">
          {/* Username */}
          <div className="input-group">
            <label className="input-label">Username *</label>
            <input
              id="username-input"
              className="input"
              name="username"
              placeholder="Choose a cool username"
              value={form.username}
              onChange={handleChange}
              maxLength={20}
            />
          </div>

          {/* College */}
          <div className="input-group">
            <label className="input-label">College / University *</label>
            <input
              id="college-input"
              className="input"
              name="college"
              placeholder="e.g. IIT Delhi, MIT, Oxford"
              value={form.college}
              onChange={handleChange}
            />
          </div>

          {/* Country & Year */}
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Country *</label>
              <select
                id="country-select"
                className="select"
                name="country"
                value={form.country}
                onChange={handleChange}
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Year *</label>
              <select
                id="year-select"
                className="select"
                name="year"
                value={form.year}
                onChange={handleChange}
              >
                <option value="">Select Year</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Course */}
          <div className="input-group">
            <label className="input-label">Course *</label>
            <div className="course-grid">
              {Object.entries(COURSE_DATA).map(([name, data]) => (
                <button
                  key={name}
                  className={`course-chip ${form.course === name ? "selected" : ""}`}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      course: name,
                      stream: "",
                    }));
                  }}
                >
                  <span className="chip-icon">{data.icon}</span>
                  <span className="chip-label">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stream / Branch — cascading based on course */}
          {form.course && (
            <div className="input-group animate-fadeIn">
              <label className="input-label">
                Stream / Branch * {COURSE_DATA[form.course]?.icon}
              </label>
              <select
                id="stream-select"
                className="select"
                name="stream"
                value={form.stream}
                onChange={handleChange}
              >
                <option value="">Select your stream</option>
                {availableStreams.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Save Button */}
          <div className="profile-actions" style={{ marginTop: "12px" }}>
            <button
              id="save-profile-btn"
              className="btn btn-primary btn-lg"
              onClick={save}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : isNewUser ? (
                "Complete Setup & Start Chatting 🚀"
              ) : (
                "Save Changes ✓"
              )}
            </button>
          </div>
        </div>
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