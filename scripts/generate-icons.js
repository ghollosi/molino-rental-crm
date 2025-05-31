// PWA ikon generátor
// Mivel nincs képfeldolgozó könyvtár, egyszerű SVG alapú ikonokat hozunk létre

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgTemplate = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0070f3"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.3}px" font-weight="bold">
    M
  </text>
</svg>`;

const iconsDir = path.join(__dirname, '../public/icons');

// Főbb app ikonok generálása
sizes.forEach(size => {
  const svg = svgTemplate(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ Létrehozva: icon-${size}x${size}.svg`);
});

// Speciális ikonok
const specialIcons = {
  'issue-icon': `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <rect width="96" height="96" fill="#ef4444" rx="8"/>
    <path d="M48 20 L48 56 M48 68 L48 76" stroke="white" stroke-width="8" stroke-linecap="round"/>
  </svg>`,
  'property-icon': `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <rect width="96" height="96" fill="#10b981" rx="8"/>
    <path d="M24 72 L24 36 L48 20 L72 36 L72 72 L24 72" fill="white"/>
    <rect x="38" y="50" width="20" height="22" fill="#10b981"/>
  </svg>`
};

Object.entries(specialIcons).forEach(([name, svg]) => {
  const filename = path.join(iconsDir, `${name}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✅ Létrehozva: ${name}.svg`);
});

// Provizórikus PNG konverzió info
console.log('\n⚠️  Megjegyzés: SVG ikonok lettek létrehozva.');
console.log('Production környezetben ezeket PNG-re kell konvertálni.');
console.log('Használható eszközök: sharp, jimp, vagy online konverter.\n');