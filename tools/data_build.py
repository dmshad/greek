# Сборка контента: content/el/vocab_a1.tsv + content/el/vocab/themes.py + content/el/topics/tNN.py → content/el/data.json
# Запуск из корня репозитория: python3 tools/data_build.py
import csv,json,os,sys,importlib
import re
# общие допуски в эталонах заданий: «они» без указания пола — и αυτοί, и αυτές; «немного по-гречески» — λίγο и λίγα
def fixko(t):
    if not re.search(r'(^|\s)(ο|οι|Ο|Οι) ',t): t=re.sub(r'\((Α|α)υτοί\)',lambda m:'(['+m.group(1)+'υτοί|'+m.group(1)+'υτές])',t)
    t=re.sub(r'(?<![\[|])\bλίγο (ελληνικά|αγγλικά|ρωσικά)',r'[λίγο|λίγα] \1',t)
    return t
def fix(x):
    if 'ko' in x and not x.get('say'): x['ko']=fixko(x['ko']); x['alt']=[fixko(a) for a in x.get('alt',[])]
    return x
def fixg(g):
    for p in g.get('parts',[]):
        p['ex']=[[fix(x) for x in b] for b in p.get('ex',[])]
    return g
R=os.getcwd(); sys.path.insert(0,R+'/content/el/topics')
exec(open(R+'/content/el/vocab/themes.py',encoding='utf-8').read())
# готовые темы: есть файл content/el/topics/tNN.py
READY={n for n,k,_ in THEMES if os.path.exists(f'{R}/content/el/topics/t{n:02d}.py')}
rows=list(csv.reader(open(R+'/content/el/vocab_a1.tsv',encoding='utf-8'),delimiter='\t'))[1:]
VOC=[n for n,k,_ in THEMES if k=='С']
BLK={n:[i*4+j+1 for j in range(4)] for i,n in enumerate(VOC)}   # 4 блока по 5 слов на словарную тему
course,blocks,words,grammar,bank=[],[],[],[],{}
order=0
def add_word(m,r,block):
    el=r[2]; assert el in m.WORDS, f'нет примеров/категории: {el}'
    v=m.WORDS[el]; cat,ex=v[0],v[1]; extra=v[2] if len(v)>2 and v[2] else r[5]
    words.append({'id':r[0],'ko':el,'tr':r[3],'pr':None,'ru':r[4],'cat':cat,'sub':None,'tag':None,'block':block,
                  'weak':False,'usage':'','notes':[],'rel':[],'roots':[],'forms':None,
                  'ex':[{'ko':a,'ru':b} for a,b in ex],'extra':extra,'alt':getattr(m,'ALT',{}).get(el,[])})
for n,k,name in THEMES:
    if k=='С':
        course.append({'id':f'w{n}','k':'w','t':f'Т{n} · {name}','b':BLK[n]})
        if n not in READY: continue
        m=importlib.import_module(f't{n:02d}')
        tw=[r for r in rows if int(r[1])==n]
        assert len(tw)==20,(n,len(tw))
        for j,b in enumerate(BLK[n]):
            order+=1; blocks.append({'id':b,'label':f'Т{n} · {name} · {j+1}','order':order})
        for i,r in enumerate(tw): add_word(m,r,BLK[n][i//5])
    else:
        tw=[r for r in rows if int(r[1])==n]
        st={'id':f'g{n}','k':'g','g':f'g{n}','t':name}
        if tw: st['b']=[f'g{n}']          # слова, которые вводит грамматическая тема (местоимения, предлоги…)
        course.append(st)
        if n not in READY: continue
        m=importlib.import_module(f't{n:02d}')
        grammar.append(fixg(m.topic()))
        if tw:
            order+=1; blocks.append({'id':f'g{n}','label':f'Т{n} · {name}','order':order})
            for r in tw: add_word(m,r,f'g{n}')
        if hasattr(m,'bank'): bank[f'g{n}']={k:[fix(x) for x in v] for k,v in m.bank().items()}
# памятка «Артикль»: вступление + разделы из готовых тем (раздел виден, когда открыта его тема)
memos=[]
asec=[]
for n,k,name in THEMES:
    if n in READY and k!='С':
        m=importlib.import_module(f't{n:02d}')
        for x in getattr(m,'ART_MEMO',[]): asec.append(dict(x,after=f'g{n}'))
if asec:
    intro={'title':'Как пользоваться','body':'Артикль в греческом ставится чаще, чем кажется по-русски. Общая логика: **ο/η/το** — известное, конкретное, имя или «вообще» (обобщение); **без артикля** — «кто такой / что такое», неопределённое количество; **ένας/μία/ένα** — «один, какой-то».\nПамятка пополняется с каждой темой: правило, примеры и номер темы, где оно разобрано.','ex':[]}
    memos.append({'id':'m-art','title':'Артикль: когда нужен и когда нет','after':asec[0]['after'],'sections':[intro]+asec})
# таблицы A1 (вкладка «Таблицы»): части только для печати не передаются
sys.path.insert(0,R+'/content/el')
from tables import TABLES
tables=[dict(t,parts=[p for p in t['parts'] if p.get('only')!='print']) for t in TABLES]
first=next(s for s in course if (s['k']=='g' and int(s['g'][1:]) in READY) or (s['k']=='w' and int(s['id'][1:]) in READY))
meta={'version':2,'currentBlock':None,'currentGrammar':first['g'] if first['k']=='g' else None,'posTs':0}
D={'meta':meta,'blocks':blocks,'notes':{},'words':words,'grammar':grammar,'morphs':[],'conj':{'stems':[],'forms':[],'cells':{}},
   'bank':bank,'drill':{'weak':[],'skip':[]},'course':course,'memos':memos,'tables':tables,'dlg':[]}
os.makedirs(R+'/content/el',exist_ok=True)
json.dump(D,open(R+'/content/el/data.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('data.json:',len(words),'слов,',len(grammar),'тем грамматики, готовы темы',sorted(READY),', шагов курса',len(course))
