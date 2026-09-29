const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
for (const value of [
  'id="saudi-cursor"',
  "(hover: hover) and (pointer: fine)",
  "(prefers-reduced-motion: reduce)",
  "pointer-events:none",
  "requestAnimationFrame",
  "press-spark",
  "press-flag",
  "isEditableTarget",
  "document.addEventListener('pointerdown',addTapRipple,{passive:true})"
]) if (!html.includes(value)) throw new Error(`Missing interaction implementation: ${value}`);
console.log('Saudi interaction implementation checks passed.');
