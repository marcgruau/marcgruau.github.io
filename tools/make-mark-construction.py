#!/usr/bin/env python3
"""Rebuild the "mark construction" block of the Fast Concept page as live SVG + CSS animation
(it used to be a 1400px GIF, which looked soft on retina screens).
Usage: python tools/make-mark-construction.py <Mark.dc.html>
Rewrites the block inside data/fast-concept-design.src.html and the generated CSS section in src/style.css."""
import re, sys

mark = open(sys.argv[1], encoding='utf-8').read()
paths = re.findall(r'<path transform="translate\(([^)]*)\)"[^>]*? d="([^"]*)"', mark)
assert len(paths) == 7, len(paths)
# order in the component: spine, base, diagonal, mid bar, top bar, wedge, nucleus
T = 9.0                                   # loop length, seconds
PAPER, GHOST, RED = '#F1EFEA', '#1B1C1F', '#EC1812'
steps = [                                 # (list label, [(path index, fly-in offset)])
    ('SPINE',    [(0, (-58, 0))]),
    ('BASE',     [(1, (0, 72))]),
    ('DIAGONAL', [(2, (78, 0)), (5, (78, 0))]),
    ('MID BAR',  [(3, (0, -150))]),
    ('TOP BAR',  [(4, (-78, 0))]),
    ('NUCLEUS',  [(6, (0, -46))]),
]
START0, GAP, FLY, FILL, HOLD_END = 0.4, 1.1, 0.5, 0.62, 8.6
pc = lambda t: ('%.2f' % (t / T * 100)).rstrip('0').rstrip('.') + '%'

css = []
ghost, live = [], []
for n, (label, parts) in enumerate(steps):
    s = START0 + n * GAP
    for idx, (dx, dy) in parts:
        tr, d = paths[idx]
        fill = RED if idx == 6 else PAPER
        ghost.append(f'<path transform="translate({tr})" d="{d}" fill="{GHOST}"/>')
        live.append(f'<g class="mc-p mc-p{idx}"><path transform="translate({tr})" d="{d}" fill="{fill}" stroke="{PAPER}" stroke-width="1" vector-effect="non-scaling-stroke"/></g>')
        css.append(f'@keyframes mc-move{idx} {{ 0%, {pc(s)} {{ opacity: 0; transform: translate({dx}px, {dy}px); }} {pc(s + .02)} {{ opacity: 1; transform: translate({dx}px, {dy}px); animation-timing-function: cubic-bezier(.2, .8, .2, 1); }} {pc(s + FLY)}, {pc(HOLD_END)} {{ opacity: 1; transform: none; }} 100% {{ opacity: 0; transform: none; }} }}')
        css.append(f'@keyframes mc-fill{idx} {{ 0%, {pc(s + FILL)} {{ fill: transparent; stroke-opacity: 1; }} {pc(s + FILL + .02)}, 100% {{ fill: {fill}; stroke-opacity: 0; }} }}')
        css.append(f'.fcx .mc-p{idx} {{ animation-name: mc-move{idx}; }} .fcx .mc-p{idx} path {{ animation-name: mc-fill{idx}; }}')
    nxt = START0 + (n + 1) * GAP if n < len(steps) - 1 else HOLD_END
    css.append(f'@keyframes mc-item{n} {{ 0%, {pc(s)} {{ color: #2C2D31; }} {pc(s + .02)}, {pc(nxt)} {{ color: #fff; }} {pc(nxt + .02)}, {pc(HOLD_END)} {{ color: #8A8B90; }} 100% {{ color: #2C2D31; }} }}')
    css.append(f'@keyframes mc-dot{n} {{ 0%, {pc(s)} {{ opacity: 0; }} {pc(s + .02)}, {pc(nxt)} {{ opacity: 1; }} {pc(nxt + .02)}, 100% {{ opacity: 0; }} }}')
    css.append(f'.fcx .mc-list li:nth-child({n + 1}) {{ animation-name: mc-item{n}; }} .fcx .mc-list li:nth-child({n + 1}) i {{ animation-name: mc-dot{n}; }}')
# counter 00..06 and the closing caption
for n in range(7):
    a = 0 if n == 0 else START0 + (n - 1) * GAP + FILL
    b = START0 + n * GAP + FILL if n < 6 else HOLD_END + .2
    css.append(f'@keyframes mc-count{n} {{ 0%, {pc(a)} {{ opacity: {1 if n == 0 else 0}; }} {pc(a + .02)}, {pc(b)} {{ opacity: 1; }} {pc(b + .02)}, 100% {{ opacity: 0; }} }}')
    css.append(f'.fcx .mc-count span:nth-child({n + 1}) {{ animation-name: mc-count{n}; }}')
red = START0 + 5 * GAP + FILL
css.append(f'@keyframes mc-cap-a {{ 0%, {pc(red)} {{ opacity: 1; }} {pc(red + .02)}, {pc(HOLD_END + .2)} {{ opacity: 0; }} 100% {{ opacity: 1; }} }}')
css.append(f'@keyframes mc-cap-b {{ 0%, {pc(red)} {{ opacity: 0; }} {pc(red + .02)}, {pc(HOLD_END + .2)} {{ opacity: 1; }} 100% {{ opacity: 0; }} }}')

# the nucleus slot stays dark inside the spine until the red core drops in
live.insert(1, f'<path transform="translate({paths[6][0]})" d="{paths[6][1]}" fill="{GHOST}"/>')
grid = ''.join(f'<path d="M{80 + i * 40} 64V736"/>' for i in range(19)) + ''.join(f'<path d="M80 {64 + i * 40}H800"/>' for i in range(18))
items = ''.join(f'<li><i></i><b>{n + 1:02d}</b>{label}</li>' for n, (label, _) in enumerate(steps))
counts = ''.join(f'<span>{n:02d} / 06</span>' for n in range(7))
block = f'''<section class="mc" role="img" aria-label="Animated construction of the FAST CONCEPT mark: six parts lock into place — spine, base, diagonal, mid bar, top bar — and the nucleus drops in red" style="position: relative; width: 1400px; height: 800px; overflow: hidden; background: rgb(5, 6, 8);">
    <svg class="mc-grid" viewBox="0 0 1400 800" aria-hidden="true">{grid}</svg>
    <svg class="mc-mark" viewBox="-1 -1 184.61 415.592" aria-hidden="true"><g>{''.join(ghost)}</g>{''.join(live)}</svg>
    <div class="mc-lab" style="left: 64px; top: 28px;">FAST CONCEPT // MARK CONSTRUCTION</div>
    <div class="mc-lab" style="right: 64px; top: 28px;">182.61 : 413.59 — 1 : 2.265</div>
    <div class="mc-title" aria-hidden="true" style="font-family: var(--font-display); font-weight: 700; font-size: 37px; line-height: 1.08; letter-spacing: 0.02em; text-transform: uppercase; color: rgb(255, 255, 255);">Mark /<br>Construction</div>
    <ol class="mc-list" aria-hidden="true">{items}</ol>
    <div class="mc-lab mc-cap" style="left: 64px; bottom: 22px;" aria-hidden="true"><span>SIX PARTS · ONE CORE</span><span>ONE RED CORE</span></div>
    <div class="mc-lab mc-count" style="right: 64px; bottom: 22px;" aria-hidden="true">{counts}</div>
  </section>'''

static = f'''/* >>> generated by tools/make-mark-construction.py — do not edit by hand */
.fcx .mc-grid {{ position: absolute; inset: 0; width: 100%; height: 100%; fill: none; stroke: rgba(255, 255, 255, .055); stroke-width: 1; }}
.fcx .mc-mark {{ position: absolute; left: 342px; top: 110px; height: 579px; overflow: visible; }}
.fcx .mc-lab {{ position: absolute; font: 500 13px/1.1 var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: #8A8B90; white-space: nowrap; }}
.fcx .mc-title {{ position: absolute; left: 880px; top: 142px; }}
.fcx .mc-list {{ position: absolute; left: 880px; top: 270px; margin: 0; padding: 0; list-style: none; font: 500 20px/48px var(--font-mono); letter-spacing: .08em; color: #8A8B90; }}
.fcx .mc-list li {{ position: relative; padding-left: 26px; white-space: nowrap; }}
.fcx .mc-list li:last-child {{ color: #fff; }}
.fcx .mc-list b {{ font-weight: 500; display: inline-block; width: 54px; }}
.fcx .mc-list i {{ position: absolute; left: 0; top: 18px; width: 11px; height: 11px; background: #fff; opacity: 0; }}
.fcx .mc-list li:last-child i {{ opacity: 1; }}
.fcx .mc-cap span, .fcx .mc-count span {{ position: absolute; bottom: 0; opacity: 0; }}
.fcx .mc-cap span {{ left: 0; }} .fcx .mc-count span {{ right: 0; }}
.fcx .mc-cap span:last-child, .fcx .mc-count span:last-child {{ opacity: 1; position: relative; }}
.fcx .mc-p path {{ stroke-opacity: 0; }}
@media (prefers-reduced-motion: no-preference) {{
  .fcx .mc-p, .fcx .mc-p path, .fcx .mc-list li, .fcx .mc-list i, .fcx .mc-count span {{ animation-duration: {T:g}s; animation-iteration-count: infinite; animation-timing-function: step-end; animation-fill-mode: both; }}
  .fcx .mc-p {{ animation-timing-function: linear; }}
  .fcx .mc-cap span {{ animation: mc-cap-b {T:g}s step-end infinite both; }}
  .fcx .mc-cap span:first-child {{ animation-name: mc-cap-a; }}
  {chr(10).join('  ' + c for c in css).strip()}
}}
/* <<< generated */
'''

p = 'data/fast-concept-design.src.html'; s = open(p, encoding='utf-8').read()
i = s.index('id="blk-gif-mark"'); j = s.index('<div id="blk-3d-mark"', i)
blk = s[i:j]
new = re.sub(r'<img[^>]*fc-mark-construction[^>]*>|<section class="mc".*?</section>', lambda m: block, blk, count=1, flags=re.S)
assert new != blk or 'class="mc"' in blk, 'construction block not found'
open(p, 'w', encoding='utf-8').write(s[:i] + new + s[j:])
p = 'src/style.css'; c = open(p, encoding='utf-8').read()
if '/* >>> generated by tools/make-mark-construction.py' in c:
    c = re.sub(r'/\* >>> generated by tools/make-mark-construction\.py.*?/\* <<< generated \*/\n', lambda m: static, c, flags=re.S)
else:
    k = c.index('@keyframes fcNucBlink')
    c = c[:k] + static + c[k:]
open(p, 'w', encoding='utf-8').write(c)
print('block and CSS written')
