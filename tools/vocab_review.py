# Страница проверки словаря: python3 tools/vocab_review.py <out.html>
import csv, json, sys
exec(open('content/el/vocab/themes.py').read())
rows=list(csv.reader(open('content/el/vocab_a1.tsv'),delimiter='\t'))[1:]
words=[{'id':r[0],'t':int(r[1]),'el':r[2],'tr':r[3],'ru':r[4],'n':r[5]} for r in rows]
themes=[{'n':n,'k':k,'name':nm} for n,k,nm in THEMES]
data=json.dumps({'themes':themes,'words':words},ensure_ascii=False)
html=r'''<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Греческий A1 — словарь на проверку</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600&family=Noto+Sans:wght@400;600&display=swap&subset=greek,cyrillic" rel="stylesheet">
<style>
:root{--bg:#fbfaf7;--ink:#1d2433;--muted:#6b7385;--line:#e4e1d8;--sea:#1f4e8c;--sea-soft:#e8eef7;--flag:#b5402a;--flag-soft:#f7e6e1;
 box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141820;--ink:#e6e8ee;--muted:#9aa2b3;--line:#2a303c;--sea:#8fb4ea;--sea-soft:#1c2636;--flag:#ef8a74;--flag-soft:#3a221d}}
:root[data-theme="dark"]{--bg:#141820;--ink:#e6e8ee;--muted:#9aa2b3;--line:#2a303c;--sea:#8fb4ea;--sea-soft:#1c2636;--flag:#ef8a74;--flag-soft:#3a221d}
html{scroll-padding-top:calc(env(safe-area-inset-top,0px) + 64px)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 "Noto Sans",-apple-system,system-ui,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:0 16px 80px}
header.top{padding:28px 0 8px}
h1{font:600 26px/1.2 "Noto Serif",Georgia,serif;margin:0 0 6px}
.lead{color:var(--muted);margin:0 0 14px;font-size:15px}
.bar{position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);padding:10px 0;border-bottom:1px solid var(--line);z-index:5;display:flex;gap:8px;flex-wrap:wrap}
.bar input{flex:1;min-width:160px;font:inherit;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--ink)}
.bar button{font:inherit;font-size:14px;padding:8px 12px;border:1px solid var(--sea);color:var(--sea);background:transparent;border-radius:8px;cursor:pointer}
.bar button.on{background:var(--sea);color:var(--bg)}
.stats{font-size:14px;color:var(--muted);margin:8px 0 0}
section.th{margin-top:26px}
section.th h2{font:600 18px/1.3 "Noto Serif",Georgia,serif;margin:0 0 2px;display:flex;gap:10px;align-items:baseline}
.num{color:var(--muted);font-size:14px;min-width:28px}
.kind{font:400 13px "Noto Sans",sans-serif;color:var(--sea);background:var(--sea-soft);padding:1px 8px;border-radius:10px;white-space:nowrap}
.empty{color:var(--muted);font-size:14px;margin:2px 0 0 38px}
.w{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:9px 0 9px 38px;border-bottom:1px solid var(--line)}
.el{font:600 18px/1.35 "Noto Serif",Georgia,serif}
.tr{color:var(--muted);font-size:15px}
.ru{grid-column:1/2}
.n{grid-column:1/2;font-size:13.5px;color:var(--muted)}
.mark{grid-row:1/4;grid-column:2;align-self:start;font:inherit;font-size:13px;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:8px;padding:4px 8px;cursor:pointer}
.w.flag{background:var(--flag-soft)}
.w.flag .mark{border-color:var(--flag);color:var(--flag)}
.cm{grid-column:1/3;display:none}
.w.flag .cm{display:block}
.cm input{width:100%;font:inherit;font-size:14px;padding:6px 8px;border:1px solid var(--flag);border-radius:6px;background:var(--bg);color:var(--ink)}
.hide{display:none!important}
.toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:8px 14px;border-radius:8px;font-size:14px;display:none}
button:focus-visible,input:focus-visible{outline:2px solid var(--sea);outline-offset:2px}
</style></head><body><div class="wrap">
<header class="top"><h1>Греческий A1: словарь на проверку</h1>
<p class="lead">Слова разложены по темам курса. Отметь сомнительное слово кнопкой «Замечание», допиши комментарий, затем нажми «Скопировать замечания» и вставь текст в чат.</p></header>
<div class="bar"><input id="q" type="search" placeholder="Поиск: слово, перевод, транскрипция"><button id="onlyF">Только отмеченные</button><button id="copy">Скопировать замечания</button></div>
<p class="stats" id="stats"></p>
<main id="list"></main></div><div class="toast" id="toast"></div>
<script>
const D=__DATA__;
const KIND={'С':'словарь','Г':'грамматика','Ч':'чтение','Пр':'практикум','П':'повторение','N':'числа'};
const KEY='el-a1-review';
let marks={};try{marks=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(marks))}catch(e){}}
const list=document.getElementById('list');
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
D.themes.forEach(t=>{
  const ws=D.words.filter(w=>w.t===t.n);
  const s=document.createElement('section');s.className='th';s.dataset.n=t.n;
  s.innerHTML=`<h2><span class="num">${t.n}</span><span>${esc(t.name)}</span><span class="kind">${KIND[t.k]}${ws.length?', '+ws.length:''}</span></h2>`+
   (ws.length?'':`<p class="empty">${t.k==='Пр'?'Новые слова последнего блока в пройденных грамматических темах':t.k==='П'?'Повторение пройденного':'Без новых слов'}</p>`)+
   ws.map(w=>`<div class="w" data-id="${w.id}"><div class="el">${esc(w.el)}</div><div class="tr">${esc(w.tr)}</div><div class="ru">${esc(w.ru)}</div>${w.n?`<div class="n">${esc(w.n)}</div>`:''}<button class="mark">Замечание</button><div class="cm"><input placeholder="Что не так?"></div></div>`).join('');
  list.appendChild(s);
});
document.querySelectorAll('.w').forEach(el=>{
  const id=el.dataset.id, inp=el.querySelector('.cm input');
  if(marks[id]!==undefined){el.classList.add('flag');inp.value=marks[id]}
  el.querySelector('.mark').onclick=()=>{
    if(el.classList.toggle('flag')){marks[id]=inp.value;inp.focus()}else{delete marks[id]}
    save();stats();};
  inp.oninput=()=>{marks[id]=inp.value;save()};
});
const q=document.getElementById('q'),onlyF=document.getElementById('onlyF');
function filter(){
  const s=q.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const f=onlyF.classList.contains('on');
  document.querySelectorAll('section.th').forEach(sec=>{let any=false;
    sec.querySelectorAll('.w').forEach(w=>{const txt=w.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      const ok=(!s||txt.includes(s))&&(!f||w.classList.contains('flag'));w.classList.toggle('hide',!ok);any=any||ok});
    sec.classList.toggle('hide',(s||f)&&!any);});
}
q.oninput=filter;onlyF.onclick=()=>{onlyF.classList.toggle('on');filter()};
function stats(){const n=Object.keys(marks).length;
  document.getElementById('stats').textContent=`Слов: ${D.words.length}, тем: ${D.themes.length}, отмечено: ${n}`;}
stats();
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',1800)}
document.getElementById('copy').onclick=async()=>{
  const ids=Object.keys(marks);if(!ids.length){toast('Нет отмеченных слов');return}
  const txt=ids.map(id=>{const w=D.words.find(x=>x.id===id);return `${id} [тема ${w.t}] ${w.el} (${w.ru}): ${marks[id]||'—'}`}).join('\n');
  try{await navigator.clipboard.writeText(txt);toast('Скопировано: '+ids.length)}catch(e){prompt('Скопируй текст:',txt)}
};
</script></body></html>'''
open(sys.argv[1] if len(sys.argv)>1 else 'vocab_review.html','w').write(html.replace('__DATA__',data))
