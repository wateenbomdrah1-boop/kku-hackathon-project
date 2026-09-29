const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptStart = html.indexOf('<script>') + '<script>'.length;
const scriptEnd = html.lastIndexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);
let appHTML = '';
let reduced = false;
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
  querySelector() { return genericNode(); },
  querySelectorAll() { return []; }
};
const context = {
  document, console,
  setTimeout(callback, delay) { const id = nextTimer++; timers.set(id, { callback, delay, cleared: false }); return id; },
  clearTimeout(id) { const timer = timers.get(id); if (timer) timer.cleared = true; },
  window: { matchMedia(query) { return { get matches() { return query.includes('reduced') ? reduced : false; }, addEventListener() {} }; }, addEventListener() {}, requestAnimationFrame(callback) { callback(); return 1; } },
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
};
vm.createContext(context);
vm.runInContext(script, context);
const run = code => vm.runInContext(code, context);
const expect = (condition, message) => { if (!condition) throw new Error(message); };

run("step=0;lang='en';visitedQuizTitles=new Set();render()");
expect(appHTML.includes('quiz-question-title is-typing'), 'New scored question does not start typing');
expect(appHTML.includes('quiz-question-reveal is-pending'), 'Question content does not wait for title');
expect(appHTML.includes('inert aria-hidden="true"'), 'Pending question content is not removed from keyboard access');
expect(appHTML.includes('aria-label="Problem Solving"'), 'Typing title does not expose its full accessible name');
expect(!appHTML.includes('>Problem Solving</h1>'), 'Full English title appears before typewriter completes');
run("step=1;render()");
run("step=0;render()");
expect(!appHTML.includes('is-typing'), 'Visited question replays typewriter after Back');
expect(appHTML.includes('>Problem Solving</h1>'), 'Visited title is not immediate');

run("step=2;lang='ar';visitedQuizTitles=new Set();render()");
expect(appHTML.includes('dir="auto"'), 'Typing title lacks direction-aware markup');
expect(appHTML.includes('quiz-question-reveal is-pending'), 'Arabic question content does not wait for typewriter');
run('toggleLang()');
expect(!appHTML.includes('is-typing'), 'Language switch replayed a visited title');

reduced = true;
run("step=3;visitedQuizTitles=new Set();render()");
expect(!/quiz-question-title is-typing/.test(appHTML), 'Reduced motion starts typewriter');
expect(!appHTML.includes('quiz-question-reveal is-pending'), 'Reduced motion hides question content');
expect(appHTML.includes('>The Unexpected Opportunity</h1>'), 'Reduced motion does not show title immediately');

reduced = false;
run("step=colourQuestionIndex;visitedQuizTitles=new Set();render()");
expect(!appHTML.includes('is-typing') && !appHTML.includes('quiz-question-reveal'), 'Bonus page receives typewriter markup');
run("answers=Array(totalQuestionCount).fill(0);step=totalQuestionCount;resultStage='intro';render()");
expect(!appHTML.includes('is-typing'), 'Results page receives typewriter markup');
for (const marker of ['Array.from(title)', 'quiz-title-caret', 'quiz-question-reveal', 'cancelQuizTitleTypewriter()', 'visitedQuizTitles']) {
  expect(html.includes(marker), `Missing title typewriter marker: ${marker}`);
}
console.log('Quiz title typewriter first-visit, revisit, language, bonus, result, and reduced-motion checks passed.');
