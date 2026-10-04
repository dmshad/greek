# Общие функции для тем: транскрипция и упражнения на чтение
import sys,os,unicodedata,csv
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','..','..','tools'))
from translit import translit
# транскрипции из словаря (там ручные исключения и слоговое ι)
_TR={}
for r in list(csv.reader(open(os.path.join(os.path.dirname(__file__),'..','vocab_a1.tsv'),encoding='utf-8'),delimiter='\t'))[1:]:
    _TR[r[2]]=r[3]
SYLL={'αύριο','δωμάτιο','εστιατόριο'}
def T(w):
    if w in _TR: return _TR[w]
    return translit(w, syll=(w in SYLL))
def caps(w):
    s=unicodedata.normalize('NFD',w); s=s.replace('\u0301','')
    return unicodedata.normalize('NFC',s).upper()
def rd(w,ru,u):
    """Упражнение на чтение: ЗАГЛАВНЫМИ + транскрипция + перевод → слово строчными с ударением."""
    return {'ru':f'Строчными: {caps(w)} — {T(w)} ({ru})','ko':w,'alt':[],'u':u,'traps':[]}

# --- упражнения на распознавание сочетаний (тема 3) ---
def _plain(t): return unicodedata.normalize('NFC',unicodedata.normalize('NFD',t).replace('\u0301',''))
def _vars(t):
    """Допустимые записи русскими буквами: без ударения/с ударением; э или е; ья/ьо/ью или я/ё/ю; йа или я."""
    base={t,_plain(t)}; out=set()
    for x in base:
        for y in {x, x.replace('э','е')}:
            out|={y, y.replace('ья','я').replace('ьо','ё').replace('ью','ю'), y.replace('йа','я')}
    return out
def rdc(w,ru,u):
    """«Прочитай»: греческое слово → русскими буквами (без δ и θ в транскрипции)."""
    t=T(w); assert 'δ' not in t and 'θ' not in t, w
    p=_plain(t).replace('?','').strip()
    alt=sorted(v.replace('?','').strip() for v in _vars(t) if v.replace('?','').strip()!=p)
    return {'ru':f'Прочитай: {w} ({ru})','ko':p,'alt':alt,'u':u,'traps':[],'say':w}
def gap(w,part,ru,u):
    """«Допиши»: в слове пропущено сочетание букв — напиши слово целиком."""
    assert part in w, (w,part)
    return {'ru':f'Допиши: {w.replace(part,"__",1)} — {T(w)} ({ru})','ko':w,'alt':[],'u':u,'traps':[]}

# --- имена в русских заданиях: греческое написание в скобках (ученик его не знает) ---
NAMES={'Мария':'Μαρία','Никос':'Νίκος','Янис':'Γιάννης','Елена':'Ελένη','Анна':'Άννα','Костас':'Κώστας'}
def names(ru):
    import re
    for r,g in NAMES.items():
        ru=re.sub(r'\b'+r+r'\b',f'{r} ({g})',ru,count=1)
    return ru
