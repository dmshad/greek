# Словарь A1: content/el/vocab/words.txt + themes.py → content/el/vocab_a1.tsv (транскрипция — tools/translit.py)
# Запуск из корня репозитория: python3 tools/vocab_build.py
import csv,sys,os
sys.path.insert(0,os.path.dirname(__file__))
from translit import translit
V='content/el/vocab/'
exec(open(V+'themes.py').read())
rows=[]
for l in open(V+'words.txt'):
    if l.startswith('#') or not l.strip(): continue
    p=[x.strip() for x in l.rstrip('\n').split('|')]
    while len(p)<5: p.append('')
    th,el,ru,note,fl=p
    if fl.startswith('X:'):
        ov=fl[2:].replace("'",'\u0301'); parts=el.split(' ',1)
        tr=(translit(parts[0])+' '+ov) if len(parts)==2 and parts[0] in ('ο','η','το','τα','οι','ο/η') else ov
    else: tr=translit(el, syll=('S' in fl))
    rows.append([int(th),el,tr,ru,note,fl])
order={n:i for i,(n,_,_) in enumerate(THEMES)}
rows.sort(key=lambda r:order[r[0]])
with open('content/el/vocab_a1.tsv','w',newline='') as f:
    w=csv.writer(f,delimiter='\t'); w.writerow(['id','тема','слово','транскрипция','перевод','формы/примечание','флаги'])
    for i,r in enumerate(rows,1): w.writerow([f'a1-{i:03d}']+r)
print(len(rows))
