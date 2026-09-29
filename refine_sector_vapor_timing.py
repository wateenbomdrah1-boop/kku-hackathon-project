from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
replacements = {
    'sector-vapor-rise 2.5s cubic-bezier(.15,.7,.19,1)': 'sector-vapor-rise 3.7s cubic-bezier(.15,.7,.19,1)',
    'sector-vapor-bloom 2.5s .08s cubic-bezier(.18,.7,.22,1)': 'sector-vapor-bloom 3.7s .08s cubic-bezier(.18,.7,.22,1)',
    '13%{opacity:.58;transform:translate3d(0,44%,0) scale(1,.86)}39%{opacity:.54;transform:translate3d(0,7%,0) scale(1.08,1)}68%{opacity:.37;transform:translate3d(0,-27%,0) scale(1.18,1.08)}': '13%{opacity:.66;transform:translate3d(0,44%,0) scale(1,.86)}39%{opacity:.60;transform:translate3d(0,7%,0) scale(1.08,1)}68%{opacity:.44;transform:translate3d(0,-27%,0) scale(1.18,1.08)}',
    '17%{opacity:.39;transform:translate3d(0,42%,0) scale(1.08,.91)}49%{opacity:.35;transform:translate3d(0,3%,0) scale(1.2,1.04)}76%{opacity:.2;transform:translate3d(0,-25%,0) scale(1.25,1.1)}': '17%{opacity:.46;transform:translate3d(0,42%,0) scale(1.08,.91)}49%{opacity:.40;transform:translate3d(0,3%,0) scale(1.2,1.04)}76%{opacity:.26;transform:translate3d(0,-25%,0) scale(1.25,1.1)}',
    'reduced?500:2500': 'reduced?500:3900',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing expected value: {old}')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('Refined sector vapor timing and visibility.')
