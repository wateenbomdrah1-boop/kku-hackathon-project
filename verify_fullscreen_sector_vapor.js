const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
for (const marker of [
  'position:fixed;z-index:1;inset:0;width:100vw;height:100vh',
  '#sector-reveal.sector-reveal-active{opacity:1}',
  '#sector-reveal::before,#sector-reveal::after',
  'sector-vapor-rise 3.7s',
  'sector-vapor-bloom 3.7s',
  'function getSectorRevealOverlay()',
  "document.body.appendChild(overlay)",
  "showSectorReveal(card.style.getPropertyValue('--sector'))",
  'sectorRevealFrame',
  'sequence!==sectorRevealSequence',
  'pointer-events:none'
]) if (!html.includes(marker)) throw new Error(`Missing full-screen vapor marker: ${marker}`);

const script = html.split('<script>', 2)[1].split('</script>', 2)[0];
const active = new Set();
const scheduled = [];
const overlay = {
  offsetWidth: 1,
  parentNode: null,
  style: { value: '', setProperty(name, value) { if (name === '--reveal-sector') this.value = value; } },
  setAttribute() {},
  classList: { add(name) { active.add(name); }, remove(name) { active.delete(name); } }
};
const generic = () => ({
  textContent: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, isConnected: true,
  setAttribute() {}, removeAttribute() {}, addEventListener() {}, appendChild() {}, remove() {}, focus() {},
  querySelector() { return generic(); }, querySelectorAll() { return []; },
  getContext() { return { fillRect() {}, fillText() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {}, measureText(text) { return { width: String(text).length * 10 }; } }; },
  toBlob(cb) { cb({ size: 1 }); }
});
let appHTML = '';
let attachedOverlay = null;
const document = {
  body: { classList: { add() {}, remove() {}, toggle() {} }, appendChild(node) { attachedOverlay = node; node.parentNode = this; } }, documentElement: {}, hidden: false,
  addEventListener() {}, createElement() { return overlay; },
  getElementById(id) { if (id === 'app') return { get innerHTML() { return appHTML; }, set innerHTML(value) { appHTML = value; } }; if (id === 'sector-reveal') return attachedOverlay; return generic(); },
  querySelector() { return generic(); }
};
let nextId = 1;
const context = {
  document, console,
  setTimeout(fn) { const id = nextId++; scheduled.push({ id, fn, cleared: false }); return id; },
  clearTimeout(id) { const item = scheduled.find(timer => timer.id === id); if (item) item.cleared = true; },
  window: { matchMedia() { return { matches: false, addEventListener() {} }; }, requestAnimationFrame(fn) { fn(); return 1; }, cancelAnimationFrame() {}, addEventListener() {} },
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
};
vm.createContext(context);
vm.runInContext(script, context);
context.showSectorReveal('#3265B5');
if (attachedOverlay !== overlay || overlay.parentNode !== document.body) throw new Error('Sector vapor was not attached directly to document.body');
if (overlay.style.value !== '#3265B5' || !active.has('sector-reveal-active')) throw new Error('Tourism vapor did not activate with its existing sector color');
context.showSectorReveal('#8555B8');
if (overlay.style.value !== '#8555B8' || !active.has('sector-reveal-active')) throw new Error('Technology vapor did not replace Tourism vapor');
for (const timer of scheduled) if (!timer.cleared) timer.fn();
if (active.has('sector-reveal-active')) throw new Error('Latest vapor run did not clean up');
console.log('Full-screen sector vapor behavior checks passed.');
