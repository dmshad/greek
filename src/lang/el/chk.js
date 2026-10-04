/* ===== Проверка без Claude (движок) ===== */
/* Греческий: ударение строго; σ вместо конечного ς — не ошибка; регистр и пунктуация не важны;
   латинские буквы-двойники приводятся к греческим (LANG.fold). */
const CHK=(()=>{
 /* ---- шаблон: ( ) — необязательно, [a|b] — варианты ---- */
 function expand(t,lim=800){
  let i=0;
  function seq(){let out=[''];while(i<t.length){const c=t[i];
    if(c===')'||c===']'||c==='|')break;
    if(c==='('){i++;const inner=seq();i++;out=cross(out,[...inner,'']);}
    else if(c==='['){i++;let alts=[];for(;;){alts=alts.concat(seq());if(t[i]==='|'){i++;continue;}i++;break;}out=cross(out,alts);}
    else{out=out.map(x=>x+c);i++;}}
   return out;}
  const cross=(a,b)=>{const r=[];for(const x of a)for(const y of b){r.push(x+y);if(r.length>lim)return r;}return r;};
  return [...new Set(seq().map(norm))];
 }
 /* ---- нормализация: регистр, ς/σ, латиница, пунктуация ---- */
 function norm(s){return LANG.fold(s).replace(/[.,!?;:·~…"'«»“”‘’()\[\]—–\-]/g,' ').replace(/\s+/g,' ').trim();}
 const nsp=s=>s.replace(/\s/g,'');
 function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];}
 function diff(a,b){return {a,b};}
 function setLex(D){}
 const canon=s=>s;
 // item: {ko, alt[], traps[{a,why}]}; ответ пользователя
 // эталон для показа — в исходном виде (регистр, ς, пунктуация), если совпадает с найденным
 function check(item,ans){const r=check0(item,ans);if(r.best){const o=[item.ko,...(item.alt||[])].find(x=>x&&!/[()\[\]|]/.test(x)&&norm(x)===r.best);r.best=o||LANG.pretty(r.best);if(o&&(r.kind==='accent'||r.kind==='spelling'))r.note=LANG.wnote(ans,o)||r.note;}return r;}
 function check0(item,ans){
  const raw=String(ans||'').trim();
  if(!raw||raw==='-')return {v:'bad',kind:'empty',best:expand(item.ko)[0]||'',note:''};
  if(/[\[\]|]/.test(raw)){const b=expand(item.ko)[0]||'';return {v:'bad',kind:'brk',best:b,note:'Квадратные скобки и | в ответе не пишутся. Пиши один вариант целиком; необязательную часть можно взять в круглые скобки.'};}
  if(/[()]/.test(raw)){
   const ok=(()=>{let d=0;for(const c of raw){if(c==='(')d++;else if(c===')'){d--;if(d<0)return false;}}return d===0;})();
   const U=ok?expand(raw).filter((x,i,a)=>x&&a.indexOf(x)===i):[];
   if(!ok||!U.length||U.length>8){const b=expand(item.ko)[0]||'';return {v:'bad',kind:'brk',best:b,note:'Скобки расставлены неверно. Необязательную часть бери в круглые скобки.'};}
   const R=U.map(x=>({x,r:check0(item,x)}));
   const bad=R.find(o=>o.r.v==='bad');
   if(bad)return {v:'bad',kind:'opt',best:bad.r.best,note:'Скобки значат «верно и с этим, и без этого». Здесь это не так — вариант «'+bad.x+'» неверен'+(bad.r.note?': '+bad.r.note:'.')};
   const unk=R.find(o=>o.r.v==='unk');
   if(unk)return {v:'unk',kind:'unk',best:unk.r.best,note:''};
   return {v:'ok',kind:'opt',best:R[0].r.best,note:'Верно: часть в скобках здесь необязательна.'};}
  const a=norm(raw);
  const V=[];for(const t of [item.ko,...(item.alt||[])])for(const x of expand(t))if(!V.includes(x))V.push(x);
  if(V.includes(a))return {v:'ok',kind:'exact',best:a};
  const an=nsp(a);
  for(const x of V)if(nsp(x)===an)return {v:'typo',kind:'space',best:x,note:'Только пробелы.'};
  for(const tr of item.traps||[])for(const x of expand(tr.a))if(nsp(x)===an){
   const best=V.slice().sort((p,q)=>lev(nsp(p),an)-lev(nsp(q),an))[0];
   return {v:'bad',kind:'trap',best,note:tr.why};}
  // ударение, односложные, «звучит так же — пишется иначе»
  for(const x of V){const n=LANG.wnote(a,x);if(n)return {v:'bad',kind:/дарени|односложн|Разные слова/.test(n)?'accent':'spelling',best:x,note:n};}
  let best=V[0],bd=1e9;for(const x of V){const d=lev(nsp(x),an);if(d<bd){bd=d;best=x;}}
  // ловушка с опечаткой: ошибка по смыслу важнее
  for(const tr of item.traps||[])for(const x of expand(tr.a))if(lev(nsp(x),an)<=1&&nsp(x).length>=4)return {v:'bad',kind:'trap',best,note:tr.why+' Плюс ошибка в написании — сравни с эталоном.'};
  return {v:'unk',kind:'unk',best,note:''};
 }
 return {check,expand,norm,lev,diff,setLex,canon};
})();
/* ===== Банк заданий (автономный режим) ===== */
// D.bank = { gN: { qN|_ : [ {ru, ko, alt[], traps[{a,why}], u} ] } }; ko/alt — шаблоны ( ) и [a|b]
const BANK=(()=>{
 // показ шаблона: ( ) — с содержимым, [a|b] — первый вариант
 function show(t){let i=0;t=String(t||'');
  function seq(stop){let o='';while(i<t.length){const c=t[i];
    if(stop&&(c===')'||c===']'||c==='|'))return o;
    if(c==='('){i++;o+=seq(1);i++;}
    else if(c==='['){i++;let first=seq(1),f=true;while(t[i]==='|'){i++;seq(1);}i++;o+=first;}
    else{o+=c;i++;}}return o;}
  return seq(0).replace(/\s+/g,' ').replace(/\s+([.,?!])/g,'$1').trim();}
 // ключ задания — первая реплика (до « — »): одинаковые вопросы в один блок не ставятся
 const key=x=>CHK.norm(show(x.ko).split(' — ')[0]);
 function pick(src,n,used,taken){const r=[];for(const x of src){if(r.length>=n)break;const k=key(x);if(taken.has(k)||(used&&used.has(x.id)))continue;taken.add(k);r.push(x);}return r;}
 const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
 let POOL=null;
 // пул: банк + базовые блоки из тем (ex частей, allEx — по модели в свою часть)
 function build(D){POOL={};const B=D.bank||{},OPEN=new Set(D.grammar.filter(g=>g.open).map(g=>g.id)),HAS=new Set(D.grammar.map(g=>g.id));
  for(const g of D.grammar){if(!(g.n>0))continue;const P={},add=(p,x,src)=>{const a=P[p]||(P[p]=[]),k=show(x.ko);if(a.some(y=>show(y.ko)===k))return;a.push(Object.assign({},x,{id:g.id+'|'+p+'|'+src+a.length}));};
   const parts=g.parts||[],pOf=u=>{const p=parts.find(p=>(p.usage||[]).includes(u));return p?p.id:(parts[0]?parts[0].id:'_');};
   for(const p of parts)for(const b of p.ex||[])for(const x of b)add(p.id,x,'e');
   for(const b of g.allEx||[])for(const x of b)add(pOf(x.u),x,'a');
   for(const [p,a] of Object.entries(B[g.id]||{}))for(const x of a)if(!x.after||(HAS.has(x.after)&&!OPEN.has(x.after)))add(p,x,'b');
   if(Object.keys(P).length)POOL[g.id]=P;}
  return POOL;}
 const all=g=>Object.values(POOL[g]||{}).flat();
 const has=g=>all(g).length>0;
 // элемент блока в формате движка: ko — показ, шаблоны — в alt
 function item(x,g){const ko=show(x.ko);return {ru:x.ru,ko,alt:[x.ko,...(x.alt||[])],traps:x.traps||[],t:g,u:x.u||'',w:[],bid:x.id,strict:!!x.strict};}
 // часть: по кругу, i-й блок
 function part(g,p,i,n=5){const a=(POOL[g]||{})[p]||[];if(!a.length)return null;const L=a.length,st=(i*n)%L;
  const rot=Array.from({length:L},(_,k)=>a[(st+k)%L]);return pick(rot,Math.min(n,L),null,new Set()).map(x=>item(x,g));}
 // вся тема: n случайных из всех частей, без повторов внутри сессии, пока хватает
 function whole(g,used,n=8,taken){const a=all(g);if(!a.length)return null;taken=taken||new Set();let f=a.filter(x=>!used.has(x.id));if(f.length<n){used.clear();f=a;}
  let r=pick(sh(f),n,null,taken);if(r.length<n)r=r.concat(pick(sh(a),n-r.length,new Set(r.map(x=>x.id)),taken));
  r.forEach(x=>used.add(x.id));return r.map(x=>item(x,g));}
 // смешанные: nc из текущей + no из прошлых тем
 function mix(g,prev,used,nc=5,no=5){const taken=new Set(),cur=whole(g,used,nc,taken)||[];const old=prev.filter(has);
  const o=[];for(let k=0,tries=0;o.length<no&&old.length&&tries<no*6;tries++){const t=old[Math.random()*old.length|0];const a=pick(sh(all(t)),1,used,taken);const x=a[0];if(x){used.add(x.id);o.push(item(x,t));}}
  return sh([...cur,...o]);}
 // повторение: слоты {t,u} → фраза той модели, иначе любая фраза темы
 function rev(slots,used){const taken=new Set();return slots.map(sl=>{const a=all(sl.t);if(!a.length)return null;
   const ok=x=>!taken.has(key(x));
   let f=a.filter(x=>x.u===sl.u&&!used.has(x.id)&&ok(x));if(!f.length)f=a.filter(x=>!used.has(x.id)&&ok(x));if(!f.length)f=a.filter(ok);if(!f.length)f=a;
   const x=f[Math.random()*f.length|0];used.add(x.id);taken.add(key(x));return item(x,sl.t);}).filter(Boolean);}
 // сколько фраз и моделей покрыто
 function stat(){const r={};for(const g of Object.keys(POOL||{})){const a=all(g);r[g]={n:a.length,parts:Object.fromEntries(Object.entries(POOL[g]).map(([p,x])=>[p,x.length])),u:new Set(a.map(x=>x.u)).size};}return r;}
 return {build,show,item,part,whole,mix,rev,stat,has,all};
})();