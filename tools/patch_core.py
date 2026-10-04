# Греческая сборка ядра: общее ядро из dmshad/korean + языковые правки.
# Запуск (из корня dmshad/greek): python3 tools/patch_core.py <путь к клону dmshad/korean>
# Пишет src/core/app.js и src/shell.html. Каждая правка проверяется по числу вхождений:
# если ядро в korean изменилось и правка не легла — скрипт падает, правку нужно обновить.
import sys
K=sys.argv[1] if len(sys.argv)>1 else '../korean'
def patch(src,rules,name):
    for old,new,n in rules:
        c=src.count(old)
        if n is None: n=c if c>0 else -1   # «все вхождения», но хотя бы одно
        assert c==n,f'{name}: «{old[:60]}» — найдено {c}, ожидалось {n}'
        src=src.replace(old,new)
    return src
APP=[
 # сравнение слов: через LANG.fold (ударение строго, ς=σ, регистр, латиница)
 ("const kn=s=>String(s||'').normalize('NFC').replace(/[\\s.,!?~'’()]/g,'');",
  "const kn=s=>(LANG.fold?LANG.fold(String(s||'')):String(s||'').normalize('NFC')).replace(/[\\s.,!?~'’();·]/g,'');\nconst KNP=s=>{const t=(LANG.fold?LANG.fold(String(s||'')):String(s||'')).replace(/[.,!?~'’();·]/g,'').replace(/\\s+/g,' ').trim();return LANG.pretty?LANG.pretty(t):t;};",1),
 # проверка слова: допустимые варианты (w.alt) и пояснение (ударение, написание)
 ("c.v=v;c.ok=kn(v)===kn(w.ko)?1:0;c.r=c.ok?'ok':'bad';",
  "c.v=v;c.ok=[w.ko,...(w.alt||[])].some(x=>kn(v)===kn(x))?1:0;c.r=c.ok?'ok':'bad';c.note=c.ok?'':(LANG.wnote?LANG.wnote(v,w.ko):'');",1),
 # разбор ошибки: у корейского — по слогам и чамо, у остальных — подсветка букв
 ("(!c.ok&&!c.dk?diffHTML(kn(c.v),kn(w.ko)):'')",
  "(!c.ok&&!c.dk?(LANG.code==='ko'?diffHTML(kn(c.v),kn(w.ko)):`<div class=\"gv bad\">${markDiff(KNP(w.ko),KNP(c.v),'gdx')}</div><div class=\"gfix\">${markDiff(KNP(c.v),KNP(w.ko))}</div>`)+(c.note?`<div class=\"gnote\">${esc(c.note)}</div>`:''):'')",1),
 # повторение слов, когда пройденных слов ещё нет
 ("function initSess(){if(S.app==='rev'){","function initSess(){if(S.app==='rev'){if(!REG.length)return false;",1),
 ("$('list').innerHTML='<div class=\"empty\">Текущей словарной темы нет. Урок грамматики — вкладка «Грамматика» выше.</div>'",
  "$('list').innerHTML='<div class=\"empty\">'+(S.app==='rev'?'Повторять пока нечего: пройденных слов ещё нет.':'Текущей словарной темы нет. Урок грамматики — вкладка «Грамматика» выше.')+'</div>'",1),
 # поиск в словаре: без ударений
 ("return norm(w.ko).includes(S.q)||norm(w.ru).includes(S.q)||norm(w.tr).includes(S.q);}",
  "const nb=s=>(LANG.bare?LANG.bare(norm(s)):norm(s)).replace(/э/g,'е'),q=nb(S.q);return nb(w.ko).includes(q)||nb(w.ru).includes(q)||nb(w.tr).includes(q);}",1),
 # алфавит: сортировка и указатель
 ("[...L].sort((a,b)=>a.ko.localeCompare(b.ko,'ko'))","[...L].sort((a,b)=>(LANG.skey?LANG.skey(a.ko):a.ko).localeCompare(LANG.skey?LANG.skey(b.ko):b.ko,LANG.code))",1),
 ("function ini(s){","function ini(s){if(LANG.ini)return LANG.ini(s);",1),
 # голос озвучки
 ("/^ko/i.test(v.lang)","new RegExp('^'+LANG.code,'i').test(v.lang)",1),
 # подписи
 ("['adj','형용사']","['adj','Прилагательные']",1),
 ("КОР","ГРЕ",19),
 ("'переведи на корейский':'переведи на русский'",
  "((GBY[it[0].t]||{}).task_rk||'переведи на греческий'):((GBY[it[0].t]||{}).task_kr||'переведи на русский')",1),
 ("на корейский","на греческий",None),
 ("с корейского","с греческого",None),
 ("запиши хангылем","запиши по-гречески",2),
 ("lang=\"ko\"","lang=\"${LANG.code}\"",2),
 ("lang=\"${rk?'ko':'ru'}\"","lang=\"${rk?LANG.code:'ru'}\"",1),
 ("lang=\"${ko?'ko':'en'}\"","lang=\"${ko?LANG.code:'en'}\"",1),
 ("'Поиск: 어머니, мать, омони'","'Поиск: μητέρα, мать, митэра'",1),
 ("'은/는, 이에요, связка…'","'είμαι, артикль, ударение…'",1),
 # прогресс: свой формат файла
 ("app:'ko-trainer'","app:LANG.code+'-trainer'",1),
 ("d.app!=='ko-trainer'","d.app!==LANG.code+'-trainer'",1),
 ("'korean_progress_'","'greek_progress_'",1),
 # тема без этапа ГРЕ→РУС (g.nokr: темы чтения) — ни в уроке, ни в повторении в этом направлении
 ("{id:'mixkr',kind:'mix',label:'Смешанные ГРЕ→РУС',size:10,dir:'kr',extra:2},",
  "...(CURG&&CURG.nokr?[]:[{id:'mixkr',kind:'mix',label:'Смешанные ГРЕ→РУС',size:10,dir:'kr',extra:2}]),",1),
 ("→ вся тема → смешанные РУС→ГРЕ → ГРЕ→РУС → итог.</p>",
  "→ вся тема → смешанные РУС→ГРЕ${CURG.nokr?'':' → ГРЕ→РУС'} → итог.</p>",1),
 ("function planSeries(sel){const T=GTOP.filter(g=>gMod(g).length&&",
  "function planSeries(sel){const T=GTOP.filter(g=>gMod(g).length&&!(g.nokr&&ST.grd==='kr')&&",1),
 ("if(!s)return `<div class=\"tmeta\">Грамматика тем 1–",
  "if(s&&!s.plan.length)return '<p class=\"gp\">Для этого направления пока нет пройденных тем. Переключи направление кнопкой выше.</p>';if(!s)return `<div class=\"tmeta\">Грамматика тем 1–",1),
 # итог урока: тексты пройденных блоков могли быть удалены чисткой состояния — не падать
 ("for(const i in s.res){n++;s.res[i].forEach((r,k)=>{tot++;if(r.v==='ok'||r.v==='typo')ok++;else if(r.v==='bad')bad.push({st,i:+i,x:s.bl[i][k],r,",
  "for(const i in s.res){n++;s.res[i].forEach((r,k)=>{tot++;if(r.v==='ok'||r.v==='typo')ok++;else if(r.v==='bad')bad.push({st,i:+i,x:(s.bl[i]&&s.bl[i][k])||{ru:'(текст задания не сохранён)',ko:'—',t:'',u:''},r,",1),
 # чистка состояния: блоки с ошибками не удаляются — они нужны для итога темы
 ("for(const i of Object.keys(s.bl)){if(+i<s.bi&&s.res&&s.res[i]){delete s.bl[i];",
  "for(const i of Object.keys(s.bl)){if(+i<s.bi&&s.res&&s.res[i]&&!s.res[i].some(r=>r&&r.v==='bad')){delete s.bl[i];",1),
 # словарная тема: перед первым блоком раздела — знакомство со словами (слово, транскрипция, перевод, пример, озвучка)
 ("function updT(focus){",
  "function introHTML(s,st){const L=CURW[st.i]||[];return `<div class=\"trn\"><div class=\"tmeta\">${esc(st.label)} · новые слова</div><p class=\"gp\">Посмотри и послушай слова раздела — нажми на слово или пример. Потом проверка: перевод с русского.</p>`+\n L.map(w=>`<div style=\"padding:10px 0;border-bottom:1px solid var(--line)\"><div><span class=\"ko\" data-say=\"${esc(w.ko)}\">${esc(w.ko)}</span> <span class=\"tr\">[${esc(w.tr)}]</span></div><div class=\"ru\">${esc(w.ru)}</div>`+\n (w.extra?`<div class=\"mut\" style=\"font-size:15px\">${esc(w.extra)}</div>`:'')+(w.ex||[]).slice(0,1).map(e=>`<div class=\"mut\" style=\"font-size:16px;margin-top:3px\"><span data-say=\"${esc(e.ko)}\">${esc(e.ko)}</span> — ${esc(e.ru)}</div>`).join('')+'</div>').join('')+\n `<div class=\"tbtns\">${btn('wstart','Начать',1)}</div></div>`;}\nfunction updT(focus){",1),
 ("const ta=$('ta');\n if(s.ph==='sum'){",
  "const ta=$('ta');\n if(!rv&&st.kind==='sec'&&s.dir==='rk'&&!s.seen&&s.bn===1&&s.pos===0&&!s.rep&&!Object.keys(s.res||{}).length){$('tcard').hidden=true;$('tsum').hidden=false;$('tsum').innerHTML=introHTML(s,st);ta.blur();hh();return;}\n if(s.ph==='sum'){",1),
 ("function act(a){const s=SS(),c=s.cur;\n if(a==='chk')return check();",
  "function act(a){const s=SS(),c=s.cur;\n if(a==='wstart'){s.seen=1;saveST();scrollTo(0,0);return updT(true);}\n if(a==='chk')return check();",1),
 # «Диалог» — только когда в контенте есть готовые диалоги
 ("let A0='dict';try{A0=LSX.getItem('app')||'dict';}catch(e){}",
  "const HASD=!!(D.dlg&&D.dlg.length);{const b=$('mm').querySelector('[data-m=\"dlg\"]');if(b&&!HASD)b.hidden=true;}\nlet A0='dict';try{A0=LSX.getItem('app')||'dict';}catch(e){}if(A0==='dlg'&&!HASD)A0='dict';",1),
 # «Числа» и «Формы» — пока только у языков с движком X
 ("function tabHi(){if(S.app!=='rev'&&(S.ttab==='n'||S.ttab==='c'))S.ttab='w';",
  "function tabHi(){if((S.app!=='rev'||LANG.noX)&&(S.ttab==='n'||S.ttab==='c'))S.ttab='w';if(LANG.noX&&(S.rtab==='n'||S.rtab==='c'))S.rtab='w';",1),
 ("x.hidden=S.app!=='rev'&&(x.dataset.v==='n'||x.dataset.v==='c')","x.hidden=(S.app!=='rev'||LANG.noX)&&(x.dataset.v==='n'||x.dataset.v==='c')",1),
 # первая словарная тема (пройденных слов ещё нет): вместо «смешанных» — «вся тема» в обе стороны
 ("...(CURB.length?[{id:'all',label:'Вся тема',kind:'all',dir:'rk'},{id:'mixrk',label:'Смешанные РУС→ГРЕ',kind:'mix',dir:'rk'},{id:'mixkr',label:'Смешанные ГРЕ→РУС',kind:'mix',dir:'kr'}]:[])",
  "...(CURB.length?(REG.length?[{id:'all',label:'Вся тема',kind:'all',dir:'rk'},{id:'mixrk',label:'Смешанные РУС→ГРЕ',kind:'mix',dir:'rk'},{id:'mixkr',label:'Смешанные ГРЕ→РУС',kind:'mix',dir:'kr'}]:[{id:'all',label:'Вся тема РУС→ГРЕ',kind:'all',dir:'rk'},{id:'allkr',label:'Вся тема ГРЕ→РУС',kind:'all',dir:'kr'}]):[])",1),
 # «вся тема»: блоки поровну, не больше 8 (20 слов → 7+7+6, а не 8+8+4)
 ("if(kind==='all')return chunk(shuf([...CURS,...dobor(4)]),8);",
  "if(kind==='all'){const a=shuf([...CURS,...dobor(4)]);return chunk(a,Math.ceil(a.length/Math.ceil(a.length/8)));}",1),
 # первая грамматическая тема (нет прошлых тем в банке): без «смешанных» — они повторяли бы «всю тему»
 ("const PARTS=CURG&&CURG.parts?CURG.parts:[];",
  "const PARTS=CURG&&CURG.parts?CURG.parts:[];const PREVG=CURG?GTOP.filter(g=>g.n<CURG.n&&(!OFF||BANK.has(g.id))).length:0;",1),
 ("{id:'mixrk',kind:'mix',label:'Смешанные РУС→ГРЕ',size:10,dir:'rk',extra:2},",
  "...(PREVG?[{id:'mixrk',kind:'mix',label:'Смешанные РУС→ГРЕ',size:10,dir:'rk',extra:2}]:[]),",1),
 ("...(CURG&&CURG.nokr?[]:[{id:'mixkr'","...(CURG&&(CURG.nokr||!PREVG)?[]:[{id:'mixkr'",1),
 ("→ вся тема → смешанные РУС→ГРЕ${CURG.nokr?'':' → ГРЕ→РУС'} → итог.</p>",
  "→ вся тема${PREVG?' → смешанные РУС→ГРЕ'+(CURG.nokr?'':' → ГРЕ→РУС'):''} → итог.</p>",1),
]
SHELL=[
 ("<title>Корейский — справочник</title>","<title>Греческий — справочник</title>",1),
 ("placeholder=\"Поиск: 어머니, мать, омони\"","placeholder=\"Поиск: μητέρα, мать, митэра\"",1),
 ("<button data-v=\"abc\">가나다</button>","<button data-v=\"abc\">ΑΒΓ</button>",1),
 ("<button data-v=\"noko\">Без кор</button>","<button data-v=\"noko\">Без греч</button>",1),
 ("РУС → КОР","РУС → ГРЕ",1),
 ("<button data-v=\"morphs\">Частицы и окончания</button><button data-v=\"conj\">Спряжение</button>","",1),
 ("\"Apple SD Gothic Neo\",","",1),
]
def run():
    app=open(K+'/src/core/app.js',encoding='utf-8').read()
    sh=open(K+'/src/shell.html',encoding='utf-8').read()
    app=patch(app,APP,'app.js'); sh=patch(sh,SHELL,'shell.html')
    open('src/core/app.js','w',encoding='utf-8').write(app)
    open('src/shell.html','w',encoding='utf-8').write(sh)
    print('ok: src/core/app.js, src/shell.html')
run()
