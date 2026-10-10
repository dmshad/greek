"""Транскрипция греческого русскими буквами (правила проекта, A1)."""
import unicodedata, re
ACC = '\u0301'
STRESSED = {'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','ΐ':'ϊ','ΰ':'ϋ'}
VOW = set('αεηιουωϊϋ')
VOICELESS = set('θκξπστφχψ')
CONS_MAP = {'β':'в','γ':'г','δ':'δ','ζ':'з','θ':'θ','κ':'к','λ':'л','μ':'м','ν':'н','ξ':'кс',
            'π':'п','ρ':'р','σ':'с','τ':'т','φ':'ф','χ':'х','ψ':'пс'}
RU_VOW = set('аэеиоуяюё')

def units(word):
    """Разбить слово на звуковые единицы: ('V', класс, ударение) / ('C', буквы)."""
    s=[]; 
    for ch in word:
        st = ch in STRESSED
        s.append((STRESSED.get(ch,ch), st))
    out=[]; i=0
    while i < len(s):
        c,st = s[i]; n = s[i+1] if i+1<len(s) else (None,False)
        if c in VOW:
            pair = c + (n[0] or '')
            # дифтонги: первая буква без ударения, вторая без диэрезиса
            if not st and n[0] in ('ι','υ') and pair in ('αι','ει','οι','υι','ου','αυ','ευ'):
                cls = {'αι':'e','ει':'i','οι':'i','υι':'i','ου':'u','αυ':'av','ευ':'ev'}[pair]
                out.append(('V',cls,n[1],pair)); i+=2; continue
            cls = {'α':'a','ε':'e','η':'i','ι':'i','υ':'i','ο':'o','ω':'o','ϊ':'i','ϋ':'i'}[c]
            out.append(('V',cls,st,c)); i+=1; continue
        if c in CONS_MAP or c=='ς':
            c = 'σ' if c=='ς' else c
            nc = n[0]
            if nc and (c+nc) in ('μπ','ντ','γκ','γγ','γχ','γξ','τσ','τζ'):
                out.append(('C',c+nc)); i+=2; continue
            if nc == c:   # двойные согласные
                out.append(('C',c)); i+=2; continue
            out.append(('C',c)); i+=1; continue
        out.append(('O',ch)); i+=1
    return out

def is_front(u): return u[0]=='V' and u[1] in ('e','i','ev')

def word(w, syll=False):
    u = units(w.lower())
    res=''; i=0
    def prev_is_cons():
        return bool(res) and res[-1] not in RU_VOW and res[-1] not in (ACC,'й','ь')
    while i < len(u):
        x = u[i]; nxt = u[i+1] if i+1<len(u) else None; nn = u[i+2] if i+2<len(u) else None
        if x[0]=='O': res+=x[1]; i+=1; continue
        if x[0]=='C':
            c=x[1]; first = (i==0)
            if c=='γ' and nxt and is_front(nxt):
                res+='й'
                # γι/γει/γυ + гласная → й + гласная (ι не слоговое)
                if nxt[1]=='i' and not nxt[2] and nn and nn[0]=='V' and not syll:
                    i+=2; continue
                i+=1; continue
            if c=='μπ': res += 'б' if first else ('мп' if nxt and nxt[0]=='C' and nxt[1]=='τ' else 'мб')
            elif c=='ντ': res += 'д' if first else 'нд'
            elif c=='γκ': res += 'г' if first else 'нг'
            elif c=='γγ': res += 'нг'
            elif c=='γχ': res += 'нх'
            elif c=='γξ': res += 'нкс'
            elif c=='τσ': res += 'ц'
            elif c=='τζ': res += 'дз'
            elif c=='σ' and nxt and nxt[0]=='C' and nxt[1][0] in 'βγδμνλρ': res+='з'
            else: res += CONS_MAP[c]
            # согласная + неударное ι/υ/ει/οι + гласная → ь
            if nxt and nxt[0]=='V' and nxt[1]=='i' and not nxt[2] and nxt[3] in ('ι','υ','ει','οι') \
               and nn and nn[0]=='V' and not syll:
                res+='ь'; i+=2; continue
            i+=1; continue
        # гласная
        _,cls,st,_src = x
        if cls in ('av','ev'):
            base = 'а' if cls=='av' else 'э'
            res += base + (ACC if st else '')
            vl = (nxt is None) or (nxt[0]=='C' and (nxt[1][0] in VOICELESS)) or nxt[0]=='O'
            res += 'ф' if vl else 'в'
            i+=1; continue
        if cls=='e': v = 'э'
        else: v = {'a':'а','i':'и','o':'о','u':'у'}[cls]
        if False:
            # λ, ν + ι + гласная = один мягкий звук [ʎ], [ɲ] → ля, ню
            v = {'а':'я','у':'ю'}[v]; res = res[:-1]
        elif res.endswith('ь'):
            # остальные согласные + ι + гласная = согласная + й-образный звук → ья, ьо, ью
            v = {'а':'я','у':'ю'}.get(v, v)
        res += v + (ACC if st else '')
        i+=1
    return res

def translit(phrase, syll=False):
    out=[]
    for tok in re.split(r"(\s+|[;,.!?()/'’])", phrase):
        if not tok: continue
        if re.match(r'[α-ωάέήίόύώϊϋΐΰςΑ-ΩΆΈΉΊΌΎΏ]', tok):
            t=word(tok, syll)
            if len(re.findall(r'[аэиоуыяюёе]', t.lower()))<=1: t=t.replace('\u0301','')   # односложное — без знака ударения
            out.append(t)
        elif tok==';': out.append('?')
        else: out.append(tok)
    return ''.join(out)

if __name__=='__main__':
    for w in ['καλημέρα','γεια σου','γιαγιά','γυναίκα','παιδιά','ποιος','μια','ευχαριστώ','Ευρώπη','αύριο','Δευτέρα',
              'Πέμπτη','πέντε','ντομάτα','Αγγλία','εγγονός','κόσμος','Ελλάδα','τσάι','ρολόι','λαϊκή','ψυγείο','απόγευμα',
              'κοιλιά','δουλειά','στην υγειά μας','ήλιος','καινούριος','χιόνι','δεξιά','γυαλιά','εύκολος','Παρασκευή',
              'παπούτσια','αυτός','κρεβατοκάμαρα','Κυριακή','μαγειρεύω','εκκλησία','μπουκάλι','κολυμπάω','άντε','να \'σαι καλά','τι κάνεις;','δεκαεφτά','αέρας','ευθεία']:
        print(w,'—',translit(w))
