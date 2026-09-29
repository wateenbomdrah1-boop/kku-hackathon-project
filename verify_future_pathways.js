const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const expectedColours = ['#8555B8', '#C68A25', '#3DABAD', '#3265B5', '#D86C38', '#4C9465'];
const expectedClasses = ['tech', 'business', 'health', 'tourism', 'industry', 'sustainability'];

const layerStart = html.indexOf('<div id="future-pathways" aria-hidden="true">');
const contentStart = html.indexOf('<main class="wrap">');
if (layerStart === -1 || contentStart === -1 || layerStart > contentStart) throw new Error('Future pathways layer is missing or not placed before app content');
const layer = html.slice(layerStart, contentStart);
if ((layer.match(/class="future-pathway /g) || []).length !== 6) throw new Error('Future pathways must contain six sector particles');
for (const colour of expectedColours) if (!html.includes(`--pathway-colour:${colour}`)) throw new Error(`Missing sector colour: ${colour}`);
for (const name of expectedClasses) {
  if (!layer.includes(`future-pathway--${name}`)) throw new Error(`Missing sector particle: ${name}`);
  if (!layer.includes(`data-sector="${name[0].toUpperCase()}${name.slice(1)}"`)) throw new Error(`Missing sector data label: ${name}`);
}
for (const marker of [
  '#future-pathways{position:fixed;z-index:1;inset:0;overflow:hidden;pointer-events:none;contain:paint}',
  '.wrap{z-index:2}',
  '#sector-reveal{position:fixed;z-index:1',
  'future-pathway-label',
  'future-pathway-drift',
  'future-pathway-line',
  'function updateFuturePathwayLabels()',
  "sector[lang==='en'?0:1]",
  'updateFuturePathwayLabels();render()',
  '@media(max-width:600px){.future-pathway',
  '@media(prefers-reduced-motion:reduce){.future-pathway,.future-pathway::after,.future-pathway-label{animation:none!important}'
]) if (!html.includes(marker)) throw new Error(`Missing pathways safety marker: ${marker}`);
if (!html.includes('width:18px;height:18px') || !html.includes('height:2px') || !html.includes('box-shadow:0 0 8px color-mix')) throw new Error('Constellation nodes or glowing paths are not enhanced');
if (html.includes('requestAnimationFrame') && !html.includes('future-pathway-drift')) throw new Error('Pathways unexpectedly require JavaScript animation');
console.log('Future pathways labels, constellation visibility, layering, and motion fallbacks check passed.');
