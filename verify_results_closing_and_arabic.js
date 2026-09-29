const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + '<script>'.length;
const scriptEnd = html.lastIndexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);
let appHTML = '';
let reduced = false;
let now = 1000;
let nextTimer = 1;
const timers = new Map();
const nodes = new Map();
const classList = () => ({ add() {}, remove() {}, toggle() {} });
const genericNode = () => ({
  textContent: '', innerHTML: '', style: { setProperty() {}, getPropertyValue() { return ''; } },
  classList: classList(), isConnected: true, parentNode: null,
  setAttribute() {}, removeAttribute() {}, appendChild() {}, remove() {}, focus() {}, click() {},
  querySelector() { return genericNode(); }, querySelectorAll() { return []; },
  getContext() { return { fillRect() {}, fillText() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {}, measureText(text) { return { width: String(text).length * 10 }; } }; },
  toBlob(callback) { callback({ size: 1 }); }
});
const document = {
  body: { classList: classList(), appendChild() {} }, documentElement: {}, hidden: false,
  addEventListener() {}, createElement: genericNode,
  getElementById(id) {
    if (id === 'app') return { get innerHTML() { return appHTML; }, set innerHTML(value) { appHTML = value; } };
    if (!nodes.has(id)) nodes.set(id, genericNode());
    return nodes.get(id);
  },
  querySelector() { return genericNode(); }, querySelectorAll() { return []; }
};
const context = {
  document, console, Date: { now() { return now; } },
  setTimeout(callback, delay) { const id = nextTimer++; timers.set(id, { callback, delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
  window: { matchMedia(query) { return { get matches() { return query.includes('reduced') ? reduced : false; }, addEventListener() {} }; }, addEventListener() {}, requestAnimationFrame(callback) { callback(); return 1; } },
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
};
vm.createContext(context);
vm.runInContext(script, context);
const run = code => vm.runInContext(code, context);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

run("lang='ar';participant={name:'',age:'',gender:''};step=-1;render()");
expect(appHTML.includes('أدخل/ي اسمك الكامل'), 'Arabic welcome name placeholder is not inclusive before selection');
expect(appHTML.includes('أدخل/ي عمرك'), 'Arabic welcome age placeholder is not inclusive before selection');
expect(appHTML.includes('مستعد/ة لاكتشاف مستقبلك؟'), 'Arabic welcome robot message is not inclusive before selection');
expect(appHTML.includes('ابدأ/ي الاختبار'), 'Arabic welcome action is not inclusive before selection');

run("participant={name:'فهد',age:'22',gender:'male'};step=-1;render()");
expect(appHTML.includes('أدخل اسمك الكامل') && !appHTML.includes('أدخلي اسمك الكامل'), 'Male Arabic welcome copy is not masculine');
expect(appHTML.includes('ابدأ الاختبار') && !appHTML.includes('ابدئي الاختبار'), 'Male Arabic start action is not masculine');

run("participant={name:'سارة',age:'22',gender:'female'};step=-1;render()");
expect(appHTML.includes('أدخلي اسمك الكامل'), 'Female Arabic welcome copy is not feminine');
expect(appHTML.includes('ابدئي الاختبار'), 'Female Arabic start action is not feminine');

run("lang='en';participant={name:'Alex',age:'22',gender:'male'};step=-1;render()");
expect(appHTML.includes('Enter your full name') && appHTML.includes('Start Quiz'), 'English welcome copy changed unexpectedly');

run("lang='ar';participant={name:'فهد',age:'22',gender:'male'};answers=Array(totalQuestionCount).fill(0);step=totalQuestionCount;resultStage='detail';revealedMatches={1:true,2:true};render()");
expect(appHTML.includes('مستقبلك يبدأ بالمسار الذي تختاره اليوم.'), 'Exact Arabic results closing message is missing');
expect(appHTML.includes('result-closing'), 'Closing section is missing from detailed results');
expect(appHTML.includes('أعد الاختبار'), 'Male Arabic restart action is not masculine');
expect(appHTML.includes('هل أنت مستعد؟'), 'Male Arabic result prompt is not masculine');

run("participant={name:'سارة',age:'22',gender:'female'};render()");
expect(appHTML.includes('أعيدي الاختبار'), 'Female Arabic restart action is not feminine');
expect(appHTML.includes('هل أنتِ مستعدة؟'), 'Female Arabic result prompt is not feminine');

run("lang='en';participant={name:'Alex',age:'22',gender:'male'};render()");
expect(appHTML.includes('Your future starts with the path you choose today.'), 'Exact English results closing message is missing');
expect(appHTML.includes('Take Quiz Again'), 'Existing restart action was not retained');

run('restartQuiz()');
expect(run('step') === -1 && run('participant.gender') === '' && run('answers.every(answer=>answer===null)'), 'Restart does not clear quiz state');

reduced = true;
run("lang='en';participant={name:'Alex',age:'22',gender:'male'};answers=Array(totalQuestionCount).fill(0);step=totalQuestionCount;resultStage='detail';revealedMatches={1:true,2:true};render()");
expect(appHTML.includes('result-closing'), 'Reduced-motion detailed result omits the closing section');
for (const marker of ['.result-closing', 'result-closing-shimmer', '@media(prefers-reduced-motion:reduce){.result-closing::after{display:none}', "const A=(en,neutral,male,female)"]) {
  expect(html.includes(marker), `Missing expected closing or Arabic grammar marker: ${marker}`);
}
console.log('Arabic gender wording, premium results closing, restart, English, and reduced-motion checks passed.');
