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
 # «Диалог» — только когда в контенте есть готовые диалоги
 ("let A0='dict';try{A0=LSX.getItem('app')||'dict';}catch(e){}",
  "const HASD=!!(D.dlg&&D.dlg.length);{const b=$('mm').querySelector('[data-m=\"dlg\"]');if(b&&!HASD)b.hidden=true;}\nlet A0='dict';try{A0=LSX.getItem('app')||'dict';}catch(e){}if(A0==='dlg'&&!HASD)A0='dict';",1),
 # «Числа» и «Формы» — пока только у языков с движком X
 ("function tabHi(){if(S.app!=='rev'&&(S.ttab==='n'||S.ttab==='c'))S.ttab='w';",
  "function tabHi(){if((S.app!=='rev'||LANG.noX)&&(S.ttab==='n'||S.ttab==='c'))S.ttab='w';if(LANG.noX&&(S.rtab==='n'||S.rtab==='c'))S.rtab='w';",1),
 ("x.hidden=S.app!=='rev'&&(x.dataset.v==='n'||x.dataset.v==='c')","x.hidden=(S.app!=='rev'||LANG.noX)&&(x.dataset.v==='n'||x.dataset.v==='c')",1),
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
