const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const script = html.split('<script>', 2)[1].split('</script>', 2)[0];
let appHTML = '';
let now = 1000;
let nextTimer = 1;
const timers = new Map();
const nodes = new Map();
const classList = () => ({ add() {}, remove() {}, toggle() {} });
const genericNode = () => ({
  textContent: '', innerHTML: '', style: { getPropertyValue() { return ''; }, setProperty() {} },
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
  querySelector() { return genericNode(); }
};
const context = {
  document, console,
  Date: { now() { return now; } },
  setTimeout(callback, delay) { const id = nextTimer++; timers.set(id, { callback, delay }); return id; },
  clearTimeout(id) { timers.delete(id); },
  window: {
    matchMedia(query) { return { matches: query.includes('reduced') ? false : false, addEventListener() {} }; },
    addEventListener() {}, requestAnimationFrame(callback) { callback(); return 1; }
  },
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
};
vm.createContext(context);
vm.runInContext(script, context);

function run(code) { return vm.runInContext(code, context); }
function expect(condition, message) { if (!condition) throw new Error(message); }

for (const milestone of [3, 6, 9]) {
  run(`answers=Array(totalQuestionCount).fill(null);answers.fill(0,0,${milestone});step=${milestone};resultStage='intro';quizRobotEnteringMilestone=-1;render()`);
  expect(appHTML.includes(`robot-body-gradient-quiz-${milestone}`), `Robot missing after question ${milestone}`);
  expect(appHTML.includes('quiz-robot-slot is-entering'), `Check-in animation missing at question ${milestone}`);
}
run(`answers=Array(totalQuestionCount).fill(null);answers.fill(0,0,9);step=colourQuestionIndex;render()`);
expect(!appHTML.includes('quiz-robot-slot'), 'Quiz robot appears on colour bonus');

run(`answers=Array(totalQuestionCount).fill(0);step=totalQuestionCount;resultStage='intro';viewSectorMatches()`);
expect(appHTML.includes('result-goodbye-robot is-waving'), 'Farewell animation missing after result CTA');
expect(run('resultGoodbyeWaveRendered') === true, 'Farewell animation was not marked as played');
expect(timers.size === 1, 'Farewell completion timer missing');

run('revealMatch(1)');
expect(run('resultGoodbyeWave') === true, 'Card reveal prematurely stopped farewell animation');
const [{ callback, delay }] = timers.values();
expect(delay === 2600, 'Farewell duration is not 2.6 seconds');
now += delay;
callback();
expect(run('resultGoodbyeWave') === false, 'Farewell state did not settle after animation');
expect(!appHTML.includes('result-goodbye-robot is-waving'), 'Farewell replays after settling');

for (const marker of [
  'robot-head', 'robot-pupil--left', 'robot-pupil--right', 'quiz-robot-clear-wave',
  'quiz-robot-look', 'quiz-robot-blink', 'result-robot-clear-wave',
  'result-robot-farewell-bounce', 'pointer-events:none', 'aria-hidden="true"'
]) expect(html.includes(marker), `Missing robot clarity marker: ${marker}`);

console.log('Robot milestone, farewell timing, and decorative-motion checks passed.');
