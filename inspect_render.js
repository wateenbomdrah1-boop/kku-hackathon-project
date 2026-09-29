const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.slice(html.indexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const source = script.split(/\r?\n/)[21];
const stack = [];
let quote = null;
let escaped = false;
let templateExpression = false;
for (let index = 0; index < source.length; index++) {
  const character = source[index];
  const next = source[index + 1];
  if (quote) {
    if (escaped) { escaped = false; continue; }
    if (character === '\\') { escaped = true; continue; }
    if (quote === '`' && character === '$' && next === '{') {
      stack.push({ expected: '}', index, kind: 'interpolation' });
      quote = null;
      templateExpression = true;
      index++;
      continue;
    }
    if (character === quote) quote = null;
    continue;
  }
  if (character === '"' || character === "'" || character === '`') { quote = character; continue; }
  if (character === '{' || character === '(' || character === '[') {
    stack.push({ expected: { '{': '}', '(': ')', '[': ']' }[character], index, kind: 'delimiter' });
  } else if (character === '}' || character === ')' || character === ']') {
    const open = stack.pop();
    if (!open || open.expected !== character) {
      console.log('Mismatch', index, character, open, source.slice(index - 80, index + 80));
      break;
    }
    if (open.kind === 'interpolation') { quote = '`'; templateExpression = false; }
  }
}
console.log({ quote, templateExpression, remaining: stack.slice(-30), tail: source.slice(-500) });
