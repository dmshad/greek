# Печатная версия таблиц A1: python3 tools/print_build.py <выходной файл>   (из корня репозитория)
# Все таблицы целиком (без скрытия будущих тем), части 'only':'app' пропускаются, 'only':'print' — включаются.
# Таблицы с 'wide' печатаются на альбомных листах.
import sys, os, html, re
R = os.getcwd(); sys.path.insert(0, R + '/content/el')
from tables import TABLES

def esc(s): return html.escape(str(s))
def fmt(s): return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', esc(s))
def cell(c): return '<br>'.join(fmt(x) for x in str(c).split(' · '))

def part(p):
    rows = [r['c'] if isinstance(r, dict) else r for r in p['rows']]
    h = f'<h3>{esc(p["title"])}</h3>' if p.get('title') else ''
    h += '<div class="tw"><table>'
    if any(p['cols']): h += '<thead><tr>' + ''.join(f'<th>{esc(c)}</th>' for c in p['cols']) + '</tr></thead>'
    h += '<tbody>' + ''.join('<tr>' + ''.join(f'<td>{cell(c)}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table></div>'
    if p.get('note'): h += f'<p class="note">{fmt(p["note"])}</p>'
    return f'<div class="part">{h}</div>'

def build():
    toc = ''.join(f'<li><a href="#t{t["n"]}">{t["n"]}. {esc(t["title"])}</a></li>' for t in TABLES)
    body = ''
    for t in TABLES:
        ps = [part(p) for p in t['parts'] if p.get('only') != 'app']
        h2 = f'<h2><span class="num">Таблица {t["n"]}</span> {esc(t["title"])}</h2>'
        parts = ps[0].replace('<div class="part">', '<div class="part">' + h2, 1) + ''.join(ps[1:])   # заголовок не отрывается от таблицы
        cls = 'tbl wide' if t.get('wide') else 'tbl'
        body += f'<section class="{cls}" id="t{t["n"]}">{parts}</section>'
    return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Греческий A1 — таблицы</title>
<style>
:root{{--fg:#1a1a1a;--mut:#666;--line:#bbb;--acc:#1d5fa8;--bg:#fff;--head:#eef2f7}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--fg:#e8e8e8;--mut:#a0a0a0;--line:#555;--acc:#7fb0ef;--bg:#16181b;--head:#23272d}}}}
html{{background:var(--bg)}}
body{{font:15px/1.4 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:var(--fg);background:var(--bg);max-width:980px;margin:0 auto;padding:16px}}
h1{{font-size:24px;margin:0 0 4px}} .sub{{color:var(--mut);margin:0 0 12px}}
.toc{{columns:2;list-style:none;padding:0;margin:0 0 16px}} .toc a{{color:var(--acc);text-decoration:none}}
.btn{{font:inherit;padding:8px 14px;border:1px solid var(--acc);color:var(--acc);background:none;border-radius:8px;cursor:pointer}}
section.tbl{{margin:28px 0}}
h2{{font-size:20px;margin:0 0 8px;border-bottom:2px solid var(--fg);padding-bottom:3px}} .num{{color:var(--acc)}}
h3{{font-size:15px;margin:12px 0 4px}}
.part{{break-inside:avoid;page-break-inside:avoid}}
.tw{{overflow-x:auto}}
table{{border-collapse:collapse;width:100%;margin:0 0 4px}}
th,td{{border:1px solid var(--line);padding:3px 6px;text-align:left;vertical-align:top}}
th{{background:var(--head);font-weight:600}}
td:first-child{{font-weight:600}}
.note{{font-size:13px;color:var(--mut);margin:2px 0 6px}}
@media (max-width:600px){{.toc{{columns:1}} body{{font-size:14px}} th,td{{padding:2px 4px}}}}
@page{{size:A4 portrait;margin:12mm}}
@page wide{{size:A4 landscape;margin:10mm}}
@media print{{
 :root{{--fg:#000;--mut:#333;--line:#888;--acc:#000;--bg:#fff;--head:#e8e8e8}}
 body{{max-width:none;padding:0;font-size:11pt}} .noprint{{display:none}}
 .toc{{font-size:10pt}} section.tbl{{margin:0 0 6mm}}
 section.wide{{page:wide;break-before:page}} section.wide + section{{break-before:page}}
 h2{{font-size:14pt}} h3{{font-size:11pt}} th,td{{padding:1.5mm 2mm}}
 a{{color:#000;text-decoration:none}}
}}
</style></head><body>
<h1>Греческий A1 — таблицы</h1>
<p class="sub">Номера совпадают с вкладкой «Грамматика → Таблицы» в приложении и ссылками «таблица N» в теории.</p>
<p class="noprint"><button class="btn" onclick="print()">Напечатать</button></p>
<ul class="toc">{toc}</ul>
{body}
</body></html>'''

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'print.html'
    open(out, 'w', encoding='utf-8').write(build())
    print(out, os.path.getsize(out))
