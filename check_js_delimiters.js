const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<script>') + '<script>'.length;
const end = html.lastIndexOf('</script>');
const source = html.slice(start, end);
const stack = [];
let quote = null;
let escaped = false;
let line = 1;
let column = 0;

for (let index = 0; index < source.length; index++) {
  const character = source[index];
  const next = source[index + 1];
  if (character === '\n') {
    line++;
    column = 0;
  } else column++;

  if (quote) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (quote === '`' && character === '$' && next === '{') {
      stack.push({ expected: '}', line, column, template: true });
      index++;
      column++;
      continue;
    }
    if (character === quote) quote = null;
    continue;
  }

  if (character === '/' && next === '/') {
    while (index < source.length && source[index] !== '\n') index++;
    line++;
    column = 0;
    continue;
  }
  if (character === '/' && next === '*') {
    index += 2;
    while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
      if (source[index] === '\n') {
        line++;
        column = 0;
      } else column++;
      index++;
    }
    index++;
    continue;
  }
  if (character === '"' || character === "'" || character === '`') {
    quote = character;
    continue;
  }
  if (character === '{' || character === '(' || character === '[') {
    stack.push({ expected: { '{': '}', '(': ')', '[': ']' }[character], line, column });
  } else if (character === '}' || character === ')' || character === ']') {
    const open = stack.pop();
    if (!open || open.expected !== character) {
      console.log('Mismatch', { character, line, column, open });
      process.exit(1);
    }
  }
}
console.log({ quote, open: stack.slice(-10) });
