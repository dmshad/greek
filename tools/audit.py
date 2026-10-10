# Проверка контента: python3 tools/audit.py [номер темы ...]   (из корня репозитория)
# Для каждой готовой темы ищет в греческом тексте слова и формы, которых к этому месту курса ещё не было:
#   в заданиях (эталоны, варианты) — ОШИБКА: ученик должен их написать или прочитать;
#   в теории, примерах, памятках — ЗАМЕЧАНИЕ: показываются с переводом, но лучше обойтись пройденным.
# Плюс: имена без греческого написания в русском задании, смешение алфавитов, многосложные слова без ударения,
# пустые эталоны. Сравнение форм — без учёта ударения и регистра (правописание проверяет движок).
import csv, os, re, sys, importlib, unicodedata
R = os.getcwd(); sys.path.insert(0, R + '/content/el/topics')
exec(open(R + '/content/el/vocab/themes.py', encoding='utf-8').read())
ROWS = list(csv.reader(open(R + '/content/el/vocab_a1.tsv', encoding='utf-8'), delimiter='\t'))[1:]
READY = sorted(n for n, k, _ in THEMES if os.path.exists(f'{R}/content/el/topics/t{n:02d}.py'))
KIND = {n: k for n, k, _ in THEMES}
GR = re.compile(r'[Ͱ-Ͽἀ-῿]')
CY = re.compile(r'[а-яёА-ЯЁ]')

def bare(w):
    w = unicodedata.normalize('NFD', w.lower())
    w = ''.join(c for c in w if c not in '́̈')
    return unicodedata.normalize('NFC', w).replace('ς', 'σ')
def toks(s):
    return [t for t in re.findall(r"[\w']+", s or '') if GR.search(t)]

# --- что считается пройденным к теме n ---
ART = {5: 'ο η το', 8: 'οι τα', 9: 'ένας μία μια ένα έναν', 13: 'τον την τη το στον στην στη στο σε'}
FIXED = {   # служебные формы, вводимые грамматикой
    5: 'είμαι είσαι είναι είμαστε είστε είσαστε',
    9: 'έχω έχεις έχει έχουμε έχετε έχουν έχουνε',
}
NAMES = {'Μαρία', 'Νίκος', 'Νίκο', 'Γιάννης', 'Γιάννη', 'Ελένη', 'Άννα', 'Κώστας', 'Κώστα', 'Κρήτη'}   # имена и названия вне словаря: в задании — с написанием
VARIANTS = 'εταιρία συγνώμη μπύρα άνδρας άνδρα αδελφός αδελφή αδελφό αδέλφια επτά οκτώ εννέα χτες βδομάδα μια'   # допустимые написания
LETTERS = {bare(x) for x in 'ου αι ει οι υι αυ ευ μπ ντ γκ γγ τσ τζ'.split()}
def syll(w):
    b = bare(w); b = re.sub(r'(ει|οι|ι|υ)(?=[αεοω]|ου)', '', b) if not re.search('[\u0301]', unicodedata.normalize('NFD', w)) else b
    return len(re.findall(r'ου|αι|ει|οι|υι|αυ|ευ|[αεηιουω]', b))
def has_acc(w): return '\u0301' in unicodedata.normalize('NFD', w)
VERB_FULL = 11          # с какой темы у глаголов на -ω все формы настоящего
CASE_ACC = 13           # винительный ед. ч.
PL_NOM = 17             # им. п. мн. ч. (м./ж.; ср. — 19)
PL_ACC = 21

def noun_forms(art, w, n):
    """Формы существительного, доступные к теме n (без ударений)."""
    b = bare(w); out = {b}
    if art in ('ο', 'ο/η'):
        if b.endswith('οσ'): out |= {b[:-1] + 'ε'}                       # звательный φίλε, κύριε
        if n >= CASE_ACC:
            for e, a in (('οσ', 'ο'), ('ασ', 'α'), ('ησ', 'η'), ('εσ', 'ε')):
                if b.endswith(e): out.add(b[:-2] + a)
        if n >= PL_NOM:
            for e, p in (('οσ', 'οι'), ('ασ', 'εσ'), ('ησ', 'εσ')):
                if b.endswith(e): out.add(b[:-2] + p)
        if n >= PL_ACC and b.endswith('οσ'): out.add(b[:-2] + 'ουσ')
    elif art == 'η':
        if n >= PL_NOM:
            for e, p in (('α', 'εσ'), ('η', 'εσ')):
                if b.endswith(e): out.add(b[:-1] + p)
    elif art == 'το':
        if n >= 19:
            if b.endswith('ο'): out.add(b[:-1] + 'α')
            if b.endswith('ι'): out.add(b + 'α')
            if b.endswith('μα'): out.add(b + 'τα')
    return out

def verb_forms(w, n):
    b = bare(w); out = {b}
    if b.endswith('ω') and n >= VERB_FULL:
        s = b[:-1]; out |= {s + e for e in ('εισ', 'ει', 'ουμε', 'ετε', 'ουν', 'ουνε')}
    return out

def known(n):
    K = {bare(x) for x in VARIANTS.split()}
    for t in READY:                                   # формы, которые тема даёт «выучить готовыми» (FORMS в tNN.py)
        if t <= n: K |= {bare(x) for x in getattr(importlib.import_module(f't{t:02d}'), 'FORMS', [])}
    for t, words in FIXED.items():
        if n >= t: K |= {bare(x) for x in words.split()}
    for t, words in ART.items():
        if n >= t: K |= {bare(x) for x in words.split()}
    for r in ROWS:
        if int(r[1]) > n: continue
        lemma, note = r[2], r[5]
        for t in toks(note): K.add(bare(t))                      # формы из примечаний словаря («мн. τα παιδιά»)
        parts = [p.strip() for p in re.split(r'[,(]', lemma.replace(')', '')) if p.strip()]
        for p in parts:
            ws = p.split()
            if len(ws) == 2 and ws[0] in ('ο', 'η', 'το', 'οι', 'τα', 'ο/η'):
                K |= noun_forms(ws[0], ws[1], n); continue
            for x in ws:
                x = x.strip(';!?')
                K |= verb_forms(x, n) if bare(x).endswith('ω') else {bare(x)}
    return K

# --- сбор текста темы ---
def items(n):
    """(вид, место, греческий текст, русский текст). вид: ex — задание, show — показ."""
    m = importlib.import_module(f't{n:02d}')
    out = []
    if hasattr(m, 'WORDS'):
        for w, v in m.WORDS.items():
            for a, b in v[1]: out.append(('show', f'пример к «{w}»', a, b))
    if hasattr(m, 'topic'):
        g = m.topic()
        for k, p in enumerate(g.get('parts', [])):
            for b in p.get('ex', []):
                for x in b:
                    out.append(('ex', f'часть {k+1}', x['ko'], x['ru']))
                    for a in x.get('alt', []): out.append(('ex', f'часть {k+1} (вариант)', a, x['ru']))
            out.append(('show', f'часть {k+1}: вступление', p.get('intro', ''), ''))
        for s in g.get('sections', []):
            out.append(('show', s['title'], s['body'], ''))
            for e in s.get('ex', []): out.append(('show', s['title'] + ': пример', e['ko'], e['ru']))
        for t in g.get('schema', []):
            for row in t['rows']: out.append(('show', 'таблица «' + t.get('title', '') + '»', ' · '.join(row), ''))
            out.append(('show', 'таблица «' + t.get('title', '') + '»: примечание', t.get('note', ''), ''))
        for u in g.get('usage', []): out.append(('show', 'употребление «' + u['sit'] + '»', u['phrase'] + ' ' + u.get('note', ''), ''))
        out.append(('show', 'описание темы', g.get('meaning', ''), ''))
    if hasattr(m, 'bank'):
        for p, a in m.bank().items():
            for x in a: out.append(('ex', f'банк {p}', x['ko'], x['ru']))
    for x in getattr(m, 'ART_MEMO', []):
        out.append(('show', 'памятка: ' + x['title'], x['body'], ''))
        for e in x.get('ex', []): out.append(('show', 'памятка: пример', e['ko'], e['ru']))
    return out

def strip_tpl(s):   # шаблоны эталонов: [a|b] и (x) → все слова
    return re.sub(r'[\[\]()|]', ' ', s)

def check(n):
    K = known(n); res = []
    K1 = known(n + 1) if KIND[n] == 'С' else K      # примеры к словам словарной темы могут опираться на следующую грамматику
    reading = KIND[n] == 'Ч'
    for kind, where, gk, ru in items(n):
        txt = strip_tpl(gk)
        for t in re.findall(r"[\w']+", txt):
            if re.search(r'[\u0370-\u03ff\u1f00-\u1fff]', t.replace('δ', '').replace('θ', '')) and CY.search(t): res.append(('ОШИБКА', where, f'смешение алфавитов: {t}', gk))
        if kind == 'ex' and gk.strip() in ('', '—', '-'): res.append(('ОШИБКА', where, 'пустой эталон', ru))
        if reading: continue
        for t in toks(txt):
            if t.isupper() and len(t) > 1: continue                       # ЗАГЛАВНЫЕ в заданиях на чтение
            b = bare(t)
            if kind == 'show' and b in LETTERS: continue                  # буквосочетания в объяснениях: ει, ου…
            if kind == 'show' and (re.search(r'[-‑]' + re.escape(t) + r'\b', gk) or re.search(r'\b' + re.escape(t) + r'[-‑]', gk) or len(t) == 1):
                continue                                                  # окончания и основы в теории: -ω, γράφ-
            if syll(t) >= 2 and not has_acc(t) and not t.isupper():
                res.append(('ОШИБКА', where, f'нет ударения: {t}', gk if len(gk) < 140 else gk[:140] + '…'))
            if t in NAMES or t.capitalize() in NAMES:
                if kind == 'ex' and t not in ru and not re.search(r'\(' + re.escape(t[:3]), ru):
                    res.append(('ОШИБКА', where, f'имя без написания в задании: {t}', ru))
                continue
            if b in (K1 if kind == 'show' else K): continue
            res.append(('ОШИБКА' if kind == 'ex' else 'замечание', where, f'не пройдено: {t}', gk if len(gk) < 140 else gk[:140] + '…'))
    return res

if __name__ == '__main__':
    sel = [int(x) for x in sys.argv[1:]] or READY
    tot = {'ОШИБКА': 0, 'замечание': 0}
    for n in sel:
        r = check(n)
        if not r: print(f'== Тема {n}: чисто'); continue
        print(f'== Тема {n}: ошибок {sum(1 for x in r if x[0]=="ОШИБКА")}, замечаний {sum(1 for x in r if x[0]!="ОШИБКА")}')
        seen = set()
        for lvl, where, what, ctx in r:
            k = (lvl, what)
            if k in seen: continue
            seen.add(k); tot[lvl] += 1
            print(f'  [{lvl}] {where}: {what}\n      {ctx}')
    print(f'\nИтого: ошибок {tot["ОШИБКА"]}, замечаний {tot["замечание"]}')
