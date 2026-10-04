# Сборка офлайн-пакета (PWA) из артефакта. Запуск: python3 build_pkg.py <index.html> <версия> [язык=ko]
import sys,os,shutil,json,zipfile
from PIL import Image,ImageDraw,ImageFont
src,ver=sys.argv[1],sys.argv[2]
LANG=sys.argv[3] if len(sys.argv)>3 else 'ko'
# Настройки приложений по языкам (адрес — dmshad.github.io/<repo>; кэш и хранилище — с префиксом языка)
PKG={'ko':{'name':'Корейский','glyph':'한','font':('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',1),'color':'#3a4fa0','title':'Корейский — справочник','zip':'korean_app'},
     'el':{'name':'Греческий','glyph':'Ελ','font':('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',0),'color':'#1f5f9e','title':'Греческий — справочник','zip':'greek_app'}}
C=PKG[LANG]; CP=LANG+'-'
out='/home/claude/pkg/app';shutil.rmtree(out,ignore_errors=True);os.makedirs(out)
# --- иконки
def icon(n,path,pad=0):
    im=Image.new('RGB',(n,n),C['color']);d=ImageDraw.Draw(im)
    f=ImageFont.truetype(C['font'][0],int(n*0.58),index=C['font'][1])
    t=C['glyph'];b=d.textbbox((0,0),t,font=f);w,h=b[2]-b[0],b[3]-b[1]
    d.text(((n-w)/2-b[0],(n-h)/2-b[1]),t,font=f,fill='white');im.save(path)
icon(180,out+'/apple-touch-icon.png');icon(192,out+'/icon-192.png');icon(512,out+'/icon-512.png')
# --- манифест
json.dump({"name":C["name"],"short_name":C["name"],"lang":"ru","start_url":"./","scope":"./","display":"standalone",
 "background_color":"#121417","theme_color":C["color"],
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},
          {"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},
 open(out+'/manifest.webmanifest','w',encoding='utf-8'),ensure_ascii=False,indent=1)
# --- service worker: всё приложение в кэше, обновление только по кнопке
open(out+'/sw.js','w',encoding='utf-8').write("""const VERSION='%s';
const CACHE='%s'+VERSION;
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:'reload'})))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('%s')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting();});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin||new URL(r.url).pathname.endsWith('version.json'))return;
 e.respondWith(caches.match(r,{ignoreSearch:true}).then(h=>h||fetch(r).catch(()=>r.mode==='navigate'?caches.match('./index.html'):undefined)));});
"""%(ver,CP,CP))
json.dump({'v':ver},open(out+'/version.json','w'))
# --- index.html: мета, регистрация SW, баннер обновления, версия
s=open(src,encoding='utf-8').read()
head='''<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="%s">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="%s">
<script>window.APPV=%s;</script>
'''%(C['name'],C['color'],json.dumps(ver))
a='<title>%s</title>'%C['title'];assert s.count(a)==1
s=s.replace(a,'<title>%s</title>\n'%C['name']+head)
tail='''<div id="updbar" hidden style="position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:'''+C['color']+''';color:#fff;font-size:18px;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;align-items:center;justify-content:space-between;pointer-events:auto">
<span style="flex:1">Доступна новая версия</span><button id="updbtn" style="border:0;border-radius:10px;padding:10px 16px;font:inherit;font-size:18px;font-weight:600;background:#fff;color:'''+C['color']+'''">Обновить</button><button id="updx" aria-label="Закрыть" style="border:0;background:none;color:#fff;font-size:26px;line-height:1;padding:4px 6px">×</button></div>
<script>
(function(){const bar=document.getElementById('updbar'),SW=navigator.serviceWorker;
 const hide=()=>{bar.hidden=true;bar.style.display='none';};const show=()=>{bar.hidden=false;bar.style.display='flex';};hide();
 // проверка версии на сервере (только при сети)
 const check=()=>{if(!navigator.onLine)return;fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d&&d.v&&d.v!==window.APPV)show();}).catch(()=>{});};
 // надёжное обновление: сброс кэша приложения и загрузка свежей версии (прогресс не затрагивается)
 const go=async()=>{hide();try{const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith('''+json.dumps(CP)+''')).map(k=>caches.delete(k)));}catch(e){}
  try{if(SW){const me=new URL('./',location.href).href,rs=await SW.getRegistrations();await Promise.all(rs.filter(r=>r.scope===me).map(r=>r.unregister()));}}catch(e){}
  location.replace(location.pathname+'?u='+Date.now());};
 document.getElementById('updbtn').addEventListener('click',go);
 document.getElementById('updx').addEventListener('click',hide);
 if(SW)SW.register('sw.js').then(reg=>{document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){reg.update().catch(()=>{});check();}});}).catch(()=>{});
 check();
 if(location.search.includes('u='))history.replaceState(null,'',location.pathname);})();
</script>
'''
a='</body>';assert s.count(a)==1
s=s.replace(a,tail+'</body>')
open(out+'/index.html','w',encoding='utf-8').write(s)
z='/mnt/user-data/outputs/%s_%s.zip'%(C['zip'],ver)
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as zf:
    for f in sorted(os.listdir(out)):zf.write(os.path.join(out,f),f)
print(z,os.path.getsize(z),sorted(os.listdir(out)))
