const fs = require('fs');

// --- MainLayout.jsx ---
let mlContent = fs.readFileSync('frontend/src/layouts/MainLayout.jsx', 'utf8');

// The mobile logo
mlContent = mlContent.replace(
  /<div className="flex items-center gap-2">[\s\S]*?<Activity className="w-5 h-5 text-[^"]+" \/>[\s\S]*?<span className="font-semibold text-white text-base tracking-tight">[\s\S]*?Forex Notes[\s\S]*?<\/span>[\s\S]*?<\/div>/,
  `<div className="flex items-center gap-2"><img src="/logo3d.png" alt="ForexNotes" className="h-8 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" /></div>`
);

// The desktop logo
mlContent = mlContent.replace(
  /<div className="flex items-center gap-2.5">[\s\S]*?<Activity className="w-5 h-5 text-[^"]+" \/>[\s\S]*?<span className="font-semibold text-gray-100 text-\[15px\] tracking-tight">[\s\S]*?Forex Notes[\s\S]*?<\/span>[\s\S]*?<\/div>/,
  `<div className="flex items-center gap-2"><img src="/logo3d.png" alt="ForexNotes" className="h-10 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" /></div>`
);

// Replace Theme Colors (Cyan -> Emerald)
mlContent = mlContent.replace(/text-cyan-400/g, 'text-emerald-400');
mlContent = mlContent.replace(/bg-cyan-500\/10/g, 'bg-emerald-500/10');
mlContent = mlContent.replace(/border-cyan-500\/20/g, 'border-emerald-500/20');
mlContent = mlContent.replace(/text-blue-400/g, 'text-emerald-400');
mlContent = mlContent.replace(/bg-blue-500\/10/g, 'bg-emerald-500/10');
mlContent = mlContent.replace(/shadow-sm/g, 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'); // Glossy

fs.writeFileSync('frontend/src/layouts/MainLayout.jsx', mlContent);


// --- LandingPage.jsx ---
let lpContent = fs.readFileSync('frontend/src/pages/LandingPage.jsx', 'utf8');

// The Logo in Header
const headerLogoRegex = /<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>[\s\S]*?<\/div>\s*<span style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "-0.03em", color: "white" }}>\s*Forex Notes\s*<\/span>\s*<\/div>/;
const newHeaderLogo = '<Link to="/" style={{ display: "flex", alignItems: "center" }}><img src="/logo3d.png" alt="ForexNotes" style={{ height: "48px", objectFit: "contain", filter: "drop-shadow(0 0 16px rgba(16,185,129,0.6))" }} /></Link>';
lpContent = lpContent.replace(headerLogoRegex, newHeaderLogo);

// The Logo in Footer
const footerLogoRegex = /<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>\s*<Activity size={16} color="[^"]*" \/>\s*<span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>Forex Notes<\/span>/;
const newFooterLogo = '<div style={{ display: "flex", alignItems: "center", gap: "12px" }}><img src="/logo3d.png" alt="ForexNotes" style={{ height: "32px", objectFit: "contain" }} />';
lpContent = lpContent.replace(footerLogoRegex, newFooterLogo);

lpContent = lpContent.replace(/rgba\(47,141,244/g, 'rgba(16,185,129');

fs.writeFileSync('frontend/src/pages/LandingPage.jsx', lpContent);


// --- Login.jsx ---
let loginContent = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');

loginContent = loginContent.replace(
  /<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-6 shadow-\[0_0_30px_rgba\(34,211,238,0.3\)\] border border-white\/10">[\s\S]*?<\/div>\s*<h2 className="text-3xl font-black text-white tracking-tight mb-2">/,
  `<div className="mb-6 flex justify-center"><img src="/logo3d.png" alt="ForexNotes" className="h-20 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" /></div>\n        <h2 className="text-3xl font-black text-white tracking-tight mb-2">`
);

loginContent = loginContent.replace(/cyan-500/g, 'emerald-500');
loginContent = loginContent.replace(/cyan-400/g, 'emerald-500');
loginContent = loginContent.replace(/blue-600/g, 'emerald-700');
loginContent = loginContent.replace(/rgba\(34,211,238/g, 'rgba(16,185,129');
loginContent = loginContent.replace(/rgba\(56,189,248/g, 'rgba(16,185,129');
loginContent = loginContent.replace(/bg-\[\#0d0f11\]/g, 'bg-[#050505]');

fs.writeFileSync('frontend/src/pages/Login.jsx', loginContent);
