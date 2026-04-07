const fs = require("fs");
const path = require("path");

const replaces = [
  // Hex colors
  { from: /#0a0a1a/gi, to: "#ffffff" },
  { from: /#111128/gi, to: "#fef9f0" },
  { from: /#8b5cf6/gi, to: "#f59e0b" },
  { from: /#06b6d4/gi, to: "#f97316" },
  { from: /#a855f7/gi, to: "#fbbf24" },
  { from: /#ec4899/gi, to: "#ea580c" },
  { from: /#1a0a2e/gi, to: "#fffbeb" },
  { from: /#0a1628/gi, to: "#fff7ed" },
  { from: /#f1f5f9/gi, to: "#1f2937" },
  { from: /#94a3b8/gi, to: "#4b5563" },
  { from: /#475569/gi, to: "#9ca3af" },
  { from: /#a78bfa/gi, to: "#d97706" },
  { from: /#1a1a2e/gi, to: "#ffffff" },
  { from: /#7c3aed/gi, to: "#f97316" }, // --bubble-me
  
  // RGB values used in rgba()
  { from: /139,\s*92,\s*246/g, to: "245, 158, 11" },
  { from: /6,\s*182,\s*212/g, to: "249, 115, 22" },
  { from: /168,\s*85,\s*247/g, to: "251, 191, 36" },
  { from: /10,\s*10,\s*26/g, to: "255, 255, 255" }, // Navbar and chat backgrounds
  
  // Special backgrounds
  { from: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/g, to: "background: rgba(245, 158, 11, 0.05)" },
  { from: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)/g, to: "background: rgba(245, 158, 11, 0.05)" },
  { from: /background:\s*rgba\(255,\s*255,\s*255,\s*0\.04\)/g, to: "background: rgba(245, 158, 11, 0.06)" },
  
  // Other text/colors from white to dark if hardcoded
  { from: /color:\s*white;/g, to: "color: white;" }, // Leave buttons white if they are on orange! Wait, .btn-primary is orange, text should be white.
  // Wait, .btn-secondary uses color: var(--text-primary). .video-label uses color: white (on rgba 0,0,0,0.6 which is dark). So white is fine.
  
  // Need to fix :root text primary replacement because "white" text on white bg won't work.
  // Actually #f1f5f9 is replaced with #1f2937 globally which is good.
];

["index.css", "App.css"].forEach(cssFile => {
  const filePath = path.join(__dirname, "client", "src", cssFile);
  let content = fs.readFileSync(filePath, "utf8");
  
  replaces.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${cssFile}`);
});
