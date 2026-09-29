const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const script = html.split('<script>', 2)[1].split('</script>', 2)[0];
const labels = {};
const nodes = Object.fromEntries(['Tech', 'Business', 'Health', 'Tourism', 'Industry', 'Sustainability'].map(sector => [sector, {
  dataset: { sector },
  querySelector() { return labels[sector] || (labels[sector] = { textContent: '' }); }
}]));
let appHTML = '';
const genericNode = () => ({
  textContent: '', innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, isConnected: true,
  setAttribute() {}, removeAttribute() {}, addEventListener() {}, appendChild() {}, remove() {}, focus() {}, click() {},
  querySelector() { return genericNode(); }, querySelectorAll() { return []; },
  getContext() { return { fillRect() {}, fillText() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {}, measureText(text) { return { width: String(text).length * 10 }; } }; },
  toBlob(callback) { callback({ size: 1 }); }
});
const document = {
  body: { classList: { add() {}, remove() {}, toggle() {} }, appendChild() {} }, documentElement: {}, hidden: false,
  addEventListener() {}, createElement: genericNode,
  getElementById(id) {
    if (id === 'app') return { get innerHTML() { return appHTML; }, set innerHTML(value) { appHTML = value; } };
    return genericNode();
  },
  querySelector() { return genericNode(); },
  querySelectorAll(selector) { return selector === '#future-pathways [data-sector]' ? Object.values(nodes) : []; }
};
const context = {
  document, console, setTimeout() { return 1; }, clearTimeout() {},
  window: { matchMedia() { return { matches: false, addEventListener() {} }; }, addEventListener() {}, requestAnimationFrame(callback) { callback(); return 1; } },
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
};
vm.createContext(context);
vm.runInContext(script, context);
const expectedEnglish = {
  Tech: 'Technology & Digital Innovation', Business: 'Business, Finance & Entrepreneurship',
  Health: 'Healthcare & Biotechnology', Tourism: 'Tourism, Culture & Entertainment',
  Industry: 'Industry, Energy & Logistics', Sustainability: 'Sustainability & Environment'
};
for (const [sector, expected] of Object.entries(expectedEnglish)) if (labels[sector].textContent !== expected) throw new Error(`Wrong English label for ${sector}`);
context.toggleLang();
const expectedArabic = {
  Tech: 'التقنية والابتكار الرقمي', Business: 'الأعمال والمالية وريادة الأعمال',
  Health: 'الرعاية الصحية والتقنية الحيوية', Tourism: 'السياحة والثقافة والترفيه',
  Industry: 'الصناعة والطاقة والخدمات اللوجستية', Sustainability: 'الاستدامة والبيئة'
};
for (const [sector, expected] of Object.entries(expectedArabic)) if (labels[sector].textContent !== expected) throw new Error(`Wrong Arabic label for ${sector}`);
console.log('Future pathway labels use existing sector data in both languages.');
