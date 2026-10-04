# Сборка артефакта из частей: python3 tools/build.py <lang> <out.html>  (из корня репозитория)
import sys
lang,out=sys.argv[1],sys.argv[2]
r=lambda p:open(p,encoding='utf-8').read()
app=r('src/core/app.js').replace('/*@LANG@*/',r(f'src/lang/{lang}/lang.js'),1).replace('/*@ENGINE@*/',r(f'src/lang/{lang}/chk.js'),1)
html=r('src/shell.html').replace('/*@APP@*/',app,1).replace('/*@DATA@*/',r(f'content/{lang}/data.json'),1)
assert '/*@' not in html.replace('/*@ ','')
open(out,'w',encoding='utf-8').write(html); print(out,len(html.encode()))
