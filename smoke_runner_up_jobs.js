const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const code = html.split('<script>', 2)[1].split('</script>', 2)[0];
let appHTML = '';
const context2d = { fillRect() {}, fillText() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {}, measureText(text) { return { width: String(text).length * 10 }; } };
const generic = () => ({ textContent: '', style: { setProperty() {} }, setAttribute() {}, removeAttribute() {}, focus() {}, click() {}, addEventListener() {}, remove() {}, appendChild() {}, classList: { add() {}, remove() {}, toggle() {} }, getContext() { return context2d; }, toBlob(cb) { cb({ size: 1 }); } });
const nodes = new Map();
const back = { setAttribute() {} };
const front = { removeAttribute() {}, querySelector() { return { isConnected: true, focus() {} }; } };
const document = { body: { classList: { toggle() {} }, appendChild() {} }, documentElement: {}, addEventListener() {}, createElement: generic, querySelector() { return { style: { getPropertyValue() { return '#3DABAD'; } }, classList: { add() {} }, querySelector(q) { return q === '.match-card-back' ? back : front; } }; }, getElementById(id) { if (id === 'app') return { get innerHTML() { return appHTML; }, set innerHTML(v) { appHTML = v; } }; if (!nodes.has(id)) nodes.set(id, generic()); return nodes.get(id); } };
const context = { document, window: { matchMedia() { return { matches: false }; } }, console, setTimeout(fn) { fn(); return 1; }, clearTimeout() {}, URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} } };
vm.createContext(context); vm.runInContext(code, context);
vm.runInContext("lang='en';step=totalQuestionCount;answers=Array(totalQuestionCount).fill(0);resultStage='detail';revealedMatches={1:false,2:false};render()", context);
if (!appHTML.includes('match-front-2" inert aria-hidden="true"')) throw new Error('Runner-up front is exposed before reveal');
context.revealMatch(2); context.render();
const front2Tag = appHTML.match(/<div class="match-card-face match-card-front" id="match-front-2"[^>]*>/)?.[0] || '';
if (front2Tag.includes('inert') || front2Tag.includes('aria-hidden')) throw new Error('Runner-up front remains hidden after reveal');
if (!appHTML.includes('#2 SECOND MATCH') || !appHTML.includes('RUNNER-UP')) throw new Error('Runner-up labels are missing');
if ((appHTML.match(/Example jobs/g) || []).length !== 2) throw new Error('Both card job headings should be rendered');
const second = vm.runInContext('calculateResults().ordered[1]', context);
const expectedJobs = vm.runInContext(`DATA.jobs[${JSON.stringify(second)}]`, context);
for (const job of expectedJobs) {
  if (!appHTML.includes(job.title[0])) throw new Error(`Runner-up job missing: ${job.title[0]}`);
  if (!appHTML.includes(`href="${job.url}"`)) throw new Error(`Runner-up source link missing: ${job.url}`);
}
context.revealMatch(1); context.render();
const front1Tag = appHTML.match(/<div class="match-card-face match-card-front" id="match-front-1"[^>]*>/)?.[0] || '';
if (front1Tag.includes('inert') || front1Tag.includes('aria-hidden')) throw new Error('Winner front remains hidden after reveal');
if ((appHTML.match(/Example jobs/g) || []).length !== 2) throw new Error('Both cards do not show example jobs');
if (!appHTML.includes('Save My Result') || !appHTML.includes('Sources: official Saudi references')) throw new Error('Post-reveal features missing');
vm.runInContext("lang='ar';render()", context);
if ((appHTML.match(/أمثلة وظائف/g) || []).length !== 2) throw new Error('Arabic job headings missing');
console.log('Runner-up job reveal smoke test passed.');
