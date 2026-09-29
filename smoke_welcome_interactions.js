const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const script = html.split('<script>', 2)[1].split('</script>', 2)[0];
let appHTML = '';
const nodes = new Map();
const classList = () => ({ add() {}, remove() {}, toggle() {} });
const genericNode = () => ({
  textContent: '', innerHTML: '', style: {}, classList: classList(), isConnected: true,
  setAttribute() {}, removeAttribute() {}, addEventListener() {}, appendChild() {}, remove() {},
  focus() {}, click() {}, querySelector() { return genericNode(); }, querySelectorAll() { return []; },
  getContext() { return { fillRect() {}, fillText() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {}, measureText(text) { return { width: String(text).length * 10 }; } }; },
  toBlob(cb) { cb({ size: 1 }); }
});
const cursor = genericNode();
const document = {
  body: { classList: classList(), appendChild() {} }, documentElement: {}, hidden: false,
  addEventListener() {}, createElement: genericNode,
  getElementById(id) {
    if (id === 'app') return { get innerHTML() { return appHTML; }, set innerHTML(value) { appHTML = value; } };
    if (id === 'saudi-cursor') return cursor;
    if (!nodes.has(id)) nodes.set(id, genericNode());
    return nodes.get(id);
  },
  querySelector() { return genericNode(); }
};
const media = query => ({ matches: query.includes('reduced') ? false : false, addEventListener() {} });
const context = {
  document, console, setTimeout(fn) { fn(); return 1; }, clearTimeout() {},
  window: { matchMedia: media, addEventListener() {}, requestAnimationFrame(fn) { fn(); return 1; } },
  URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
};
vm.createContext(context);
vm.runInContext(script, context);

function makeForm({ name = '', age = '', gender = '' } = {}) {
  const nameNode = { value: name, setAttribute() {}, focus() {} };
  const ageNode = { value: age, setAttribute() {}, focus() {} };
  const options = ['male', 'female'].map(value => ({ value, checked: value === gender, setAttribute() {}, focus() {} }));
  return { elements: { name: nameNode, age: ageNode }, querySelectorAll() { return options; } };
}

context.startQuiz({ preventDefault() {}, currentTarget: makeForm({ name: 'Student Example', age: '18' }) });
if (vm.runInContext('step', context) !== -1) throw new Error('Quiz started without gender');
if (!nodes.get('gender-error').textContent.includes('Select a gender')) throw new Error('Missing English gender error');
context.startQuiz({ preventDefault() {}, currentTarget: makeForm({ name: 'Student Example', age: '17', gender: 'female' }) });
if (vm.runInContext('step', context) !== -1) throw new Error('Quiz accepted age 17');
context.startQuiz({ preventDefault() {}, currentTarget: makeForm({ name: 'Student Example', age: '120', gender: 'male' }) });
if (vm.runInContext('step', context) !== 0) throw new Error('Quiz rejected valid gender and age 120');
if (vm.runInContext('participant.gender', context) !== 'male') throw new Error('Gender was not held in welcome state');
vm.runInContext("answers=Array(totalQuestionCount).fill(0)", context);
const before = vm.runInContext("JSON.stringify(calculateResults())", context);
vm.runInContext("participant.gender='female'", context);
const after = vm.runInContext("JSON.stringify(calculateResults())", context);
if (before !== after) throw new Error('Gender changed sector calculation');
vm.runInContext("step=colourQuestionIndex;answers[colourQuestionIndex]=null;lang='en';render()", context);
if (appHTML.includes('colour-meaning') || appHTML.includes('Visionary and imaginative')) throw new Error('Colour meanings should not render');
if (appHTML.includes('Optional: choose a colour')) throw new Error('Bonus explanatory copy should not render');
vm.runInContext("answers[colourQuestionIndex]=0;render()", context);
if (!appHTML.includes('swatch-symbol">✓')) throw new Error('Selected colour indicator missing');
if (!appHTML.includes('>Selected</p>')) throw new Error('English selected confirmation missing');
vm.runInContext("lang='ar';render()", context);
if (!appHTML.includes('تم الاختيار')) throw new Error('Arabic selected confirmation missing');
vm.runInContext('restartQuiz()', context);
if (vm.runInContext("participant.name||participant.age||participant.gender", context) !== '') throw new Error('Restart did not clear gender');
if (!html.includes('id="saudi-cursor"') || !html.includes('pointer-events:none')) throw new Error('Non-blocking Saudi cursor/effects missing');
console.log('Welcome, gender, and colour-bonus smoke test passed.');
