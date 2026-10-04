# Сборка контента: content/el/vocab_a1.tsv + content/el/vocab/themes.py + content/el/topics/tNN.py → content/el/data.json
# Запуск из корня репозитория: python3 tools/data_build.py
import csv,json,os,sys,importlib
R=os.getcwd(); sys.path.insert(0,R+'/content/el/topics')
exec(open(R+'/content/el/vocab/themes.py',encoding='utf-8').read())
# готовые темы: есть файл content/el/topics/tNN.py
READY={n for n,k,_ in THEMES if os.path.exists(f'{R}/content/el/topics/t{n:02d}.py')}
rows=list(csv.reader(open(R+'/content/el/vocab_a1.tsv',encoding='utf-8'),delimiter='\t'))[1:]
VOC=[n for n,k,_ in THEMES if k=='С']
BLK={n:[i*4+j+1 for j in range(4)] for i,n in enumerate(VOC)}   # 4 блока по 5 слов на словарную тему
course,blocks,words,grammar,bank=[],[],[],[],{}
order=0
for n,k,name in THEMES:
    if k=='С':
        course.append({'id':f'w{n}','k':'w','t':f'Т{n} · {name}','b':BLK[n]})
        if n not in READY: continue
        m=importlib.import_module(f't{n:02d}')
        tw=[r for r in rows if int(r[1])==n]
        assert len(tw)==20,(n,len(tw))
        for j,b in enumerate(BLK[n]):
            order+=1; blocks.append({'id':b,'label':f'Т{n} · {name} · {j+1}','order':order})
        for i,r in enumerate(tw):
            el=r[2]; cat,ex=m.WORDS.get(el,('expr',[]))
            assert el in m.WORDS, f'нет примеров/категории: {el}'
            words.append({'id':r[0],'ko':el,'tr':r[3],'pr':None,'ru':r[4],'cat':cat,'sub':None,'tag':None,'block':BLK[n][i//5],
                          'weak':False,'usage':'','notes':[],'rel':[],'roots':[],'forms':None,
                          'ex':[{'ko':a,'ru':b} for a,b in ex],'extra':r[5]})
    else:
        course.append({'id':f'g{n}','k':'g','g':f'g{n}','t':name})
        if n not in READY: continue
        m=importlib.import_module(f't{n:02d}')
        grammar.append(m.topic())
        if hasattr(m,'bank'): bank[f'g{n}']=m.bank()
first=next(s for s in course if (s['k']=='g' and int(s['g'][1:]) in READY) or (s['k']=='w' and int(s['id'][1:]) in READY))
meta={'version':2,'currentBlock':None,'currentGrammar':first['g'] if first['k']=='g' else None,'posTs':0}
D={'meta':meta,'blocks':blocks,'notes':{},'words':words,'grammar':grammar,'morphs':[],'conj':{'stems':[],'forms':[],'cells':{}},
   'bank':bank,'drill':{'weak':[],'skip':[]},'course':course,'memos':[],'dlg':[]}
os.makedirs(R+'/content/el',exist_ok=True)
json.dump(D,open(R+'/content/el/data.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('data.json:',len(words),'слов,',len(grammar),'тем грамматики, готовы темы',sorted(READY),', шагов курса',len(course))
