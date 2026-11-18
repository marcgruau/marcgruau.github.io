#!/usr/bin/env python3
"""Convert every piece of text set in the display face (N-Cage) inside
data/fast-concept-design.html into SVG outlines, so the font file itself does not
have to be published. Usage:  python tools/outline-display-font.py <font.ttf>
Needs fontTools. Reads data/fast-concept-design.src.html, writes data/fast-concept-design.html."""
import re, sys, html
from html.parser import HTMLParser
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font = TTFont(sys.argv[1])
UPM = font['head'].unitsPerEm
CAP = 642
cmap = font.getBestCmap()
gset = font.getGlyphSet()
hmtx = font['hmtx']
SPACE = hmtx[cmap[32]][0]

def run_path(chars, ls_u, scale=1.0, ox=0.0, oy=0.0):
    """outline for a run of characters, y pointing down; returns (d, advance in font units).
    scale/ox/oy bake the placement into the coordinates, so strokes keep their own width."""
    pen = SVGPathPen(gset, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
    x = 0
    for ch in chars:
        g = cmap[ord(ch)]
        gset[g].draw(TransformPen(pen, (scale, 0, 0, -scale, ox + x * scale, oy)))
        x += hmtx[g][0] + ls_u
    return pen.getCommands(), x

VOID = {'img', 'br', 'input', 'hr', 'meta', 'link', 'source', 'wbr'}
num = lambda v: ('%.4f' % v).rstrip('0').rstrip('.')

class Rewriter(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.out = []
        self.stack = [dict(tag='root', disp=False, fs=16.0, ls=0.0, upper=False, svg=False, db=None)]
        self.text_el = None   # buffering an SVG <text> in the display face
        self.stats = dict(html=0, svg=0, fallback=set())

    def cur(self): return self.stack[-1]

    def state_for(self, tag, attrs):
        a = dict(attrs); st = a.get('style') or ''
        s = dict(self.cur()); s['tag'] = tag
        s['svg'] = s['svg'] or tag == 'svg'
        fam = None
        m = re.search(r'font-family:\s*([^;]+)', st)
        if m: fam = m.group(1)
        elif a.get('font-family'): fam = a['font-family']
        if fam is not None: s['disp'] = ('--font-display' in fam) or ('N-Cage' in fam)
        m = re.search(r'font-size:\s*([\d.]+)px', st)
        if m: s['fs'] = float(m.group(1))
        elif a.get('font-size') and re.fullmatch(r'[\d.]+', a['font-size']): s['fs'] = float(a['font-size'])
        m = re.search(r'letter-spacing:\s*(-?[\d.]+)(em|px)', st)
        if m: s['ls'] = float(m.group(1)) * (s['fs'] if m.group(2) == 'em' else 1)
        elif re.search(r'letter-spacing:\s*normal', st): s['ls'] = 0.0
        elif a.get('letter-spacing') and re.fullmatch(r'-?[\d.]+', a['letter-spacing']): s['ls'] = float(a['letter-spacing'])
        m = re.search(r'dominant-baseline:\s*([\w-]+)', st)
        if m: s['db'] = m.group(1)
        elif a.get('dominant-baseline'): s['db'] = a['dominant-baseline']
        m = re.search(r'text-transform:\s*(\w+)', st)
        if m: s['upper'] = m.group(1) == 'uppercase'
        return s, a

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text()
        s, a = self.state_for(tag, attrs)
        if tag not in VOID: self.stack.append(s)
        if self.text_el is not None:
            raise SystemExit(f'nested <{tag}> inside display <text> is not supported')
        if tag == 'text' and s['disp']:
            self.text_el = dict(attrs=a, raw=raw, data=[], state=s)
            return
        self.out.append(raw)

    def handle_startendtag(self, tag, attrs):
        self.out.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if tag in VOID: return
        if self.text_el is not None and tag == 'text':
            self.out.append(self.svg_text(self.text_el)); self.text_el = None
        else:
            self.out.append(f'</{tag}>')
        while len(self.stack) > 1:
            if self.stack.pop()['tag'] == tag: break

    def handle_entityref(self, name): self.handle_data(f'&{name};')
    def handle_charref(self, name): self.handle_data(f'&#{name};')
    def handle_comment(self, d): self.out.append(f'<!--{d}-->')

    def handle_data(self, data):
        if self.text_el is not None:
            self.text_el['data'].append(data); return
        s = self.cur()
        if not s['disp'] or s['svg'] or not data.strip() or s['tag'] in ('style', 'script'):
            self.out.append(data); return
        self.out.append(self.html_text(data, s))

    def html_text(self, data, s):
        text = html.unescape(data).replace('\xa0', ' ')
        shown = text.upper() if s['upper'] else text
        ls_u = s['ls'] / s['fs'] * UPM
        parts = [f'<span class="nc-t">{html.escape(text.strip())}</span>']
        tokens = re.split(r'(\s+)', shown)
        lead = bool(tokens and tokens[0] == '')
        for i, tok in enumerate(tokens):
            if tok == '': continue
            if tok.isspace():
                if (i == 1 and lead) or i == len(tokens) - 1 or (i == len(tokens) - 2 and tokens[-1] == ''):
                    parts.append(' ')   # edge whitespace keeps its normal collapsing behaviour
                else:
                    parts.append(f'<span class="nc-s" style="width:{num((SPACE + ls_u) / UPM)}em"></span>')
                continue
            for run in self.runs(tok):
                kind, chars = run
                if kind == 'glyph':
                    d, adv = run_path(chars, ls_u)
                    parts.append(f'<svg class="nc" viewBox="0 {-CAP} {num(adv)} {CAP}" style="width:{num(adv / UPM)}em" aria-hidden="true"><path d="{d}"/></svg>')
                else:
                    self.stats['fallback'].update(chars)
                    parts.append(f'<span class="nc-f" aria-hidden="true">{html.escape(chars)}</span>')
        self.stats['html'] += 1
        return ''.join(parts)

    def runs(self, tok):
        out = []
        for ch in tok:
            kind = 'glyph' if ord(ch) in cmap else 'fb'
            if out and out[-1][0] == kind: out[-1][1] += ch
            else: out.append([kind, ch])
        return out

    def svg_text(self, el):
        a, s = el['attrs'], el['state']
        text = html.unescape(''.join(el['data'])).replace('\xa0', ' ').strip()
        if s['upper']: text = text.upper()
        missing = [c for c in text if ord(c) not in cmap]
        if missing: raise SystemExit(f'no glyph for {missing!r} in SVG text {text!r}')
        st = a.get('style') or ''
        for unsupported in ('textLength', 'dx', 'dy', 'rotate'):
            if unsupported in a or unsupported in st: raise SystemExit(f'{unsupported} on display <text> is not supported')
        if s['db'] not in (None, 'auto', 'alphabetic', 'central', 'middle'): raise SystemExit(f"dominant-baseline {s['db']} on display text {text!r}")
        scale = s['fs'] / UPM
        ls_u = s['ls'] / scale if scale else 0
        adv = sum(hmtx[cmap[ord(c)]][0] + ls_u for c in text)
        x = float(a.get('x') or 0); y = float(a.get('y') or 0)
        if s['db'] in ('central', 'middle'): y += CAP / 2 * scale   # glyphs are cap-height tall, so centre them on y
        anchor = a.get('text-anchor') or (re.search(r'text-anchor:\s*(\w+)', st) or [None, 'start'])[1]
        width = adv * scale
        if anchor == 'middle': x -= width / 2
        elif anchor == 'end': x -= width
        keep = {k: v for k, v in a.items() if k not in ('x', 'y', 'text-anchor', 'font-size', 'letter-spacing', 'font-family', 'font-weight')}
        attrs = ''.join(f' {k}="{html.escape(v or "", quote=True)}"' for k, v in keep.items())
        self.stats['svg'] += 1
        d, _ = run_path(text, ls_u, scale, x, y)
        return f'<g{attrs}><path d="{d}"/></g>'

src = open('data/fast-concept-design.src.html', encoding='utf-8').read()
r = Rewriter(); r.feed(src); r.close()
open('data/fast-concept-design.html', 'w', encoding='utf-8').write(''.join(r.out))
print('html text runs:', r.stats['html'], '· svg texts:', r.stats['svg'], '· left as live text (no glyph in font):', sorted(r.stats['fallback']))
