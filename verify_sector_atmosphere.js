const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
for (const marker of [
  'sector-atmosphere-rise',
  'pointer-events:none',
  'card.style.getPropertyValue(\'--sector\')',
  'sectorRevealSequence',
  'sequence===sectorRevealSequence',
  'prefers-reduced-motion:reduce'
]) {
  if (!html.includes(marker)) throw new Error(`Missing sector-atmosphere marker: ${marker}`);
}

const script = html.split('<script>', 2)[1].split('</script>', 2)[0];
const classes = new Set();
const overlay = {
  style: { value: '', setProperty(name, value) { if (name === '--reveal-sector') this.value = value; } },
  classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); } },
  offsetWidth: 1
};
const generic = () => ({
  textContent: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, isConnected: true,
  setAttribute() {}, removeAttribute() {}, addEventListener() {}, appendChild() {}, remove() {}, focus() {},
  querySelector() { return generic(); }, querySelectorAll() { return []; },
  getContext() { return { fillRect() {}, fillText() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {}, measureText(text) { return { width: String(text).length * 10 }; } }; },
  toBlob(cb) { cb({ size: 1 }); }
});
let appHTML = '';
const document = {
  body: { classList: { add() {}, remove() {}, toggle() {} }, appendChild() {} }, documentElement: {}, hidden: false,
  addEventListener() {}, createElement: generic,
  getElementById(id) {
    if (id === 'app') return { get innerHTML() { return appHTML; }, set innerHTML(value) { appHTML = value; } };
    if (id === 'sector-reveal') return overlay;
    return generic();
  },
  querySelector() { return generic(); }
};
const timers = [];
const context = {
  document, console,
  setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {},
  window: { matchMedia() { return { matches: false, addEventListener() {} }; }, requestAnimationFrame(fn) { fn(); return 1; }, addEventListener() {} },
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
};
vm.createContext(context);
vm.runInContext(script, context);
context.showSectorReveal('#8555B8');
if (overlay.style.value !== '#8555B8' || !classes.has('sector-reveal-active')) throw new Error('First reveal did not activate its sector colour');
context.showSectorReveal('#C68A25');
if (overlay.style.value !== '#C68A25' || !classes.has('sector-reveal-active')) throw new Error('Second reveal did not replace the sector colour');
timers.forEach(timer => timer());
if (classes.has('sector-reveal-active')) throw new Error('Latest sector atmosphere did not clean up');
console.log('Sector atmosphere behavior checks passed.');
