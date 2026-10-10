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
    return {'ru':f'С ударением: {caps(w)} — {T(w)} ({ru})','ko':w,'alt':[],'u':u,'traps':[]}

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
# основа русского имени → окончания падежей → греческое написание
NAMES=[('Мари','(?:я|и|ю|ей|е)','Μαρία'),('Никос','(?:а|у|ом|е)?','Νίκος'),('Янис','(?:а|у|ом|е)?','Γιάννης'),
       ('Елен','(?:а|ы|е|у|ой)','Ελένη'),('Анн','(?:а|ы|е|у|ой)','Άννα'),('Костас','(?:а|у|ом|е)?','Κώστας'),
       ('Крит','(?:а|у|ом|е)?','Κρήτη')]
def names(ru):
    import re
    for st,end,g in NAMES:
        if g in ru: continue
        ru=re.sub(r'\b('+st+end+r')\b(?! \()',r'\1 ('+g+')',ru,count=1)
    return ru

# --- ловушки «лишний артикль» у существительного-сказуемого (общий генератор) ---
import re as _re
def art_traps(ko,pred,why):
    """pred: {слово: артикль}; why: шаблон пояснения с {w}. Для каждого слова из pred без артикля перед ним —
    вариант ответа с артиклем (+ вариант, где артикль у всех сразу)."""
    def spots(t):
        r=[]
        for n,a in pred.items():
            for m in _re.finditer(r'\b'+_re.escape(n)+r'\b',t,_re.I):
                prev=t[:m.start()].rstrip().split(' ')[-1].lower() if t[:m.start()].strip() else ''
                if _re.sub(r'[()\[\]|]','',prev) not in ('ο','η','το','οι','τα','τον','τη','την','έναν','ένας','μια','μία','ένα','στον','στη','στην','στο','σε','του','της'): r.append((m.start(),m.end(),n,a))
        return sorted(r)
    S=spots(ko); out=[]
    for st,en,n,a in S: out.append((ko[:st]+f'{a} {n}'+ko[en:],why.format(w=n)))
    if len(S)>1:
        t=ko
        for st,en,n,a in reversed(S): t=t[:st]+f'{a} {n}'+t[en:]
        out.append((t,why.format(w=', '.join(n for _,_,n,_ in S))))
    return out

# τη / την, στη / στην: -ν перед гласной и κ, π, τ, ξ, ψ, μπ, ντ, γκ (τσ, τζ начинаются с τ). Движок засчитывает обе формы,
# а эталон (и показанный правильный ответ) пишется по правилу. [τη|την] сворачивается в одну форму.
import re as _rn
_NU=_rn.compile(r'(?:[αεηιοωυάέήίόύώ]|[κπτξψ]|μπ|ντ|γκ)',_rn.I)
def nu(ko):
    ko=_rn.sub(r'\[(στη|τη)\|(?:στην|την)\]',r'\1',ko)
    ko=_rn.sub(r'\[(στην|την)\|(?:στη|τη)\]',r'\1',ko)
    def f(m):
        return m.group(1)+('ν' if _NU.match(m.group(3)) else '')
    return _rn.sub(r'(?<!\w)(στη|τη)ν?(?=(\|[^\]]*\])?\s+(\w+))',f,ko)
