const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/LandingPage.jsx', 'utf8');

// Colors
content = content.replace(/#0a0a0a/g, '#050014');
content = content.replace(/#0b0c0e/g, '#050014');
content = content.replace(/#121418/g, '#0a0520');
content = content.replace(/#0b131d/g, '#0e0730');
content = content.replace(/#2f8df4/g, '#A855F7');
content = content.replace(/#2376e8/g, '#9333EA');

// Tailwind classes
content = content.replace(/blue-500/g, 'purple-500');
content = content.replace(/cyan-500/g, 'fuchsia-500');
content = content.replace(/blue-400/g, 'purple-400');
content = content.replace(/cyan-400/g, 'fuchsia-400');

// Fix specific gradients
content = content.replace(/from-purple-400 via-fuchsia-400 to-emerald-400/g, 'from-purple-400 via-fuchsia-400 to-pink-400');
content = content.replace(/text-emerald-400/g, 'text-pink-400');
content = content.replace(/emerald-500/g, 'pink-500');
content = content.replace(/bg-pink-500\/10/g, 'bg-purple-500/20');
content = content.replace(/border-pink-500\/20/g, 'border-purple-500/30');

fs.writeFileSync('frontend/src/pages/LandingPage.jsx', content);
console.log("Done");
