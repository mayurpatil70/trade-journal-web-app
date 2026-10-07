const fs = require('fs');

// 1. LandingPage.jsx
let landing = fs.readFileSync('frontend/src/pages/LandingPage.jsx', 'utf8');

// Fix Header Logo (make it larger, since it includes text now)
landing = landing.replace(
  /<img src="\/logo3d\.png" alt="Logo" style={{ width: "44px", height: "44px", objectFit: "contain"/g,
  '<img src="/logo3d.png" alt="Logo" style={{ height: "60px", width: "auto", objectFit: "contain"'
);

// Fix Footer Logo
landing = landing.replace(
  /<Activity size=\{16\} color="#10b981" \/>\s*<span style=\{\{ fontSize: "14px", fontWeight: 800, color: "white" \}\}>Forex Notes<\/span>/g,
  '<img src="/logo3d.png" alt="Forex Notes" style={{ height: "48px", width: "auto", objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(16,185,129,0.4))" }} />'
);

// Any other stray Activity in footer
landing = landing.replace(
  /<Activity size=\{16\} color="#10b981" \/>/g,
  ''
);

fs.writeFileSync('frontend/src/pages/LandingPage.jsx', landing);

// 2. MainLayout.jsx
let mainLayout = fs.readFileSync('frontend/src/layouts/MainLayout.jsx', 'utf8');

// Sidebar Desktop Logo
mainLayout = mainLayout.replace(
  /className="h-8 object-contain drop-shadow-\[0_0_12px_rgba\(16,185,129,0\.5\)\]"/g,
  'className="h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"'
);

// Sidebar Mobile Logo
mainLayout = mainLayout.replace(
  /className="h-10 object-contain drop-shadow-\[0_0_12px_rgba\(16,185,129,0\.5\)\]"/g,
  'className="h-16 w-auto object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"'
);
fs.writeFileSync('frontend/src/layouts/MainLayout.jsx', mainLayout);

// 3. Login.jsx
let login = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');
// It currently has:
// <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
//   <Activity className="w-7 h-7 text-white" />
// </div>
// <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
//   Welcome back to <br />
//   Forex Notes
// </h1>

login = login.replace(
  /<div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500\/30">[\s\S]*?<Activity className="w-7 h-7 text-white" \/>[\s\S]*?<\/div>/,
  '<div className="mb-6 flex justify-center"><img src="/logo3d.png" alt="Forex Notes" className="h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" /></div>'
);
login = login.replace(
  /Welcome back to <br \/>\s*Forex Notes/,
  'Welcome back'
);
fs.writeFileSync('frontend/src/pages/Login.jsx', login);

// 4. PromoPopup.jsx
let promo = fs.readFileSync('frontend/src/components/PromoPopup.jsx', 'utf8');
promo = promo.replace(
  /style=\{\{ width: "40px", height: "40px", objectFit: "contain"/g,
  'style={{ height: "60px", width: "auto", objectFit: "contain"'
);
fs.writeFileSync('frontend/src/components/PromoPopup.jsx', promo);

console.log('Logo branding updated across all files!');
