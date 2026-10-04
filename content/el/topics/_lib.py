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
    return {'ru':f'{caps(w)} — {T(w)} ({ru})','ko':w,'alt':[],'u':u,'traps':[]}
