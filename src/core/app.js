
/*@LANG@*/
/* ===== Хранилище с языковым префиксом: несколько приложений на одном адресе (dmshad.github.io) не пересекаются ===== */
const LSX=(()=>{const P=LANG.code+':';
 try{if(!localStorage.getItem(P+'_migr')){const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&!/^[a-z]{2}:/.test(k))ks.push(k);}
  for(const k of ks)if(localStorage.getItem(P+k)===null)localStorage.setItem(P+k,localStorage.getItem(k));localStorage.setItem(P+'_migr',String(Date.now()));}}catch(e){}
 return {getItem:k=>localStorage.getItem(P+k),setItem:(k,v)=>localStorage.setItem(P+k,v),removeItem:k=>localStorage.removeItem(P+k)};})();
const SSX={getItem:k=>sessionStorage.getItem(LANG.code+':'+k),setItem:(k,v)=>sessionStorage.setItem(LANG.code+':'+k,v),removeItem:k=>sessionStorage.removeItem(LANG.code+':'+k)};

/* ===== Автономный режим ===== */
const HASC=!!(window.claude&&window.claude.use);
const OFFF=(()=>{try{return LSX.getItem('offmode')==='1';}catch(e){return false;}})();
let OFF=!HASC||OFFF;             /* автономно: вне Claude или тумблер */
let OFFT=HASC&&OFFF;             /* тестовый режим внутри Claude */
let LSK=OFFT?'trainer_off':'trainer';
/*@ENGINE@*/
const D=JSON.parse(document.getElementById('data').textContent);
/* ===== Курс: последовательность тем, позиция, скрытие будущего ===== */
const COURSE=(()=>{
 const S=D.course||[];const posKey=()=>'coursePos_'+LSK;
 const gIds=new Set((D.grammar||[]).map(g=>g.id)),bIds=new Set((D.blocks||[]).map(b=>String(b.id)));
 const loaded=s=>s.k==='g'?gIds.has(s.g):(s.b&&s.b.length>0&&s.b.every(b=>bIds.has(String(b))));
 const idxOf=id=>S.findIndex(s=>s.id===id);
 // позиция по умолчанию — из meta (ведётся в чате управления)
 function metaPos(){const m=D.meta||{},cb=m.currentBlock;
  if(cb!=null){const a=(Array.isArray(cb)?cb:[cb]).map(String);const s=S.find(s=>s.k==='w'&&(s.b||[]).some(b=>a.includes(String(b))));if(s)return s.id;}
  if(m.currentGrammar){const s=S.find(s=>s.k==='g'&&s.g===m.currentGrammar);if(s)return s.id;}
  let last=null;for(const s of S)if(loaded(s))last=s.id;return last;}
 // выбор ученика (localStorage; синхронизируется из ST.course при загрузке)
 let user=null;try{user=JSON.parse(LSX.getItem(posKey())||'null');}catch(e){}
 const mts=(D.meta&&D.meta.posTs)||0;
 let cur=(user&&user.cur&&idxOf(user.cur)>=0&&loaded(S[idxOf(user.cur)])&&(user.ts||0)>=mts)?user.cur:metaPos();
 let idx=idxOf(cur);
 const on=S.length>0&&idx>=0;
 if(on){
  const after=S.slice(idx+1),before=S.slice(0,idx),cs=S[idx];
  const hidB=new Set(after.filter(s=>s.k==='w').flatMap(s=>(s.b||[]).map(String)));
  const hidG=new Set(after.filter(s=>s.k==='g').map(s=>s.g));
  const hidN=new Set((D.grammar||[]).filter(g=>hidG.has(g.id)).map(g=>g.n));
  D.words=D.words.filter(w=>!hidB.has(String(w.block)));
  D.blocks=D.blocks.filter(b=>!hidB.has(String(b.id)));
  D.grammar=D.grammar.filter(g=>!hidG.has(g.id));
  if(D.morphs)D.morphs=D.morphs.filter(m=>!hidN.has(m.topic));
  if(D.conj&&D.conj.cells)for(const k of Object.keys(D.conj.cells))if(hidN.has(D.conj.cells[k].topic))delete D.conj.cells[k];
  if(D.bank)for(const g of hidG)delete D.bank[g];
  for(const g of D.grammar)g.open=(cs.k==='g'&&g.id===cs.g);
  D.meta.currentGrammar=cs.k==='g'?cs.g:null;
  D.meta.currentBlock=cs.k==='w'?(cs.b.length===1?cs.b[0]:cs.b.slice()):null;
  // пройденные практикумы снимают флаги «не отработано» (unflag частей)
  const GB=Object.fromEntries(D.grammar.map(g=>[g.id,g])),MB=Object.fromEntries((D.morphs||[]).map(m=>[m.id,m]));
  for(const s of before){if(s.k!=='g')continue;const g=GB[s.g];if(!g||!g.parts)continue;
   for(const p of g.parts)for(const f of p.unflag||[]){const i=f.lastIndexOf(':'),o=f.slice(0,i),id=f.slice(i+1);
    const t=GB[o]||MB[o];if(t&&t.new)t.new=t.new.filter(x=>x!==id);}}
 }
// повтор пройденной темы: временно делает её «темой урока», текущая позиция не меняется
 const vKey=()=>'courseView_'+LSK;let view=null;
 if(on){try{view=LSX.getItem(vKey())||null;}catch(e){}
  const vi=view?idxOf(view):-1;
  if(vi<0||vi>=idx||!loaded(S[vi]))view=null;
  else{const vs=S[vi];
   if(vs.k==='g'){const g=D.grammar.find(x=>x.id===vs.g);if(!g)view=null;else{D.meta.currentGrammar=g.id;g.open=true;
     if(!g.parts||!g.parts.length)g.parts=[{id:'_',title:'Вся тема',intro:g.meaning||'',schema:(g.schema||[]).map((_,i)=>i),
       sections:(g.sections||[]).map(x=>x.id),usage:(g.usage||[]).map(x=>x.id),ex:[]}];}}
   else D.meta.currentBlock=vs.b.length===1?vs.b[0]:vs.b.slice();}}
 function setView(id){try{id?LSX.setItem(vKey(),id):LSX.removeItem(vKey());}catch(e){}}
 // прогресс (с 03.10): пройденные шаги курса / все шаги курса — словарные, грамматические, практикумы, доп. темы на равных
 function stat(){if(!on)return null;const pb=new Set(S.slice(0,idx).filter(s=>s.k==='w').flatMap(s=>(s.b||[]).map(String)));
  const nw=D.words.filter(w=>pb.has(String(w.block))).length;
  const done=idx,total=S.length,pct=Math.round(done/total*100);return {words:nw,done,total,pct,themes:done,half:0};}
 function status(s){const i=idxOf(s.id);return !loaded(s)?'soon':i<idx?'done':i===idx?'cur':'ahead';}
 // смена позиции: сохраняется и применяется перезапуском
 function set(id){const i=idxOf(id);if(i<0||!loaded(S[i]))return false;const v={cur:id,ts:Date.now()};
  try{LSX.setItem(posKey(),JSON.stringify(v));}catch(e){}if(typeof ST==='object'){ST.course=v;try{saveST();}catch(e){}}return true;}
 // после загрузки состояния: если в ST выбор новее — применить
 function sync(st){if(!on||!st||!st.course||!st.course.cur)return false;const c=st.course,i=idxOf(c.cur);
  if(i<0||!loaded(S[i])||(c.ts||0)<mts)return false;if(c.cur===cur)return false;
  try{LSX.setItem(posKey(),JSON.stringify(c));}catch(e){}return true;}
 return {on,steps:S,get cur(){return cur;},get idx(){return idx;},get view(){return view;},loaded,status,stat,set,sync,idxOf,setView,
  title:s=>{if(s.k!=='g')return s.t;const g=(D.grammar||[]).find(x=>x.id===s.g);if(g&&g.label)return g.label;const n=g?g.n:+String(s.g).slice(1);return 'Т'+n+' · '+(g?g.title:s.t);}};
})();
D.bank=D.bank||{};try{BANK.build(D);}catch(e){}try{CHK.setLex(D);}catch(e){}
const W=D.words, BY=Object.fromEntries(W.map(w=>[w.id,w]));
const CAT=[['noun','Существительные'],['verb','Глаголы'],['adj','Прилагательные'],['adv','Наречия'],['pron','Местоимения и указательные'],
['question','Вопросительные'],['time','Слова времени'],['num','Числительные'],['counter','Счётные слова'],['answer','Ответы'],['expr','Выражения']];
const CATN=Object.fromEntries(CAT), SUBN={sino:'한자어',native:'고유어'};
const BL=Object.fromEntries(D.blocks.map(b=>[b.id,b]));
const REL={homonym:'омоним',pair:'пара',register:'регистр',see:'см.'};
function isCur(x){const c=D.meta.currentBlock;return Array.isArray(c)?c.includes(x):x===c;}
const S={app:'dict',gtab:'topics',sort:'chrono',mode:'all',tr:true,weak:false,q:'',open:new Set()};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/ъ/g,'');
function seg(id,key){const el=$(id);const upd=()=>el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===S[key]));
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;S[key]=b.dataset.v;if(key==='mode')S.open.clear();upd();render();};upd();}
seg('sort','sort');seg('mode','mode');
$('trb').onclick=()=>{S.tr=!S.tr;S.open.clear();render();};
$('wk').onclick=()=>{S.weak=!S.weak;render();};
$('q').oninput=e=>{S.q=norm(e.target.value.trim());render();};
function match(w){if(S.weak&&!WK(w))return false;if(!S.q)return true;
 const nb=s=>(LANG.bare?LANG.bare(norm(s)):norm(s)).replace(/э/g,'е'),q=nb(S.q);return nb(w.ko).includes(q)||nb(w.ru).includes(q)||nb(w.tr).includes(q);}
const hid='<span class="hid"></span>';
function row(w){const o=S.open.has(w.id),hk=S.mode==='noko'&&!o,hr=S.mode==='noru'&&!o,
 showTr=S.mode!=='noko'?(S.tr||o):o;
 const eye=(S.mode!=='all'||!S.tr)?`<button class="eye" data-e="${esc(w.id)}" aria-label="Показать">${o?'◉':'◎'}</button>`:'';
 return `<div class="row" data-id="${esc(w.id)}"><div class="txt"><span class="ko">${hk?hid:esc(w.ko)}</span>`+
 (showTr?`<span class="tr">[${esc(w.tr)}]</span>`:(S.tr&&S.mode==='noko'?` <span class="tr">${hid}</span>`:''))+
 `<div class="ru">${hr?hid:esc(w.ru)}</div></div><button class="wkb${WK(w)?' on':''}" data-wk="${esc(w.id)}" aria-label="Плохо помню">${WK(w)?'●':'○'}</button>${eye}</div>`;}
function togWeak(id){const w=BY[id];if(!w)return;ST.weak[id]=WK(w)?{on:0,c:0}:{on:1,c:0,m:1};saveST();}
function render(){document.body.classList.toggle('rv',S.app==='rev');$('dseg').hidden=S.app!=='rev';if(S.app==='rev')dsegUpd();if(S.app==='dlg')return renderD();if(S.app==='prog')return renderP();if(S.app==='gram')return renderG();if(S.app==='train'||S.app==='rev')return renderT();
 $('trb').disabled=S.mode==='noko';$('trb').classList.toggle('on',S.tr&&S.mode!=='noko');
 const nw=W.filter(w=>WK(w)).length;$('wk').classList.toggle('on',S.weak);$('wk').innerHTML='<span style="color:var(--acc)">●</span>'+(nw?' '+nw:'');
 const L=W.filter(match);
 let h='',i=0;const secs=[];
 if(!L.length)h='<div class="empty">'+(S.weak&&!nw?'Список «плохо помню» пуст.':'Ничего не найдено.')+'</div>';
 else if(S.sort==='abc'){let last=null;for(const w of [...L].sort((a,b)=>(LANG.skey?LANG.skey(a.ko):a.ko).localeCompare(LANG.skey?LANG.skey(b.ko):b.ko,LANG.code))){const c=ini(w.ko);
  if(c!==last){last=c;secs.push(['s'+i,c]);h+=`<h2 id="s${i++}">${c}</h2>`;}h+=row(w);}}
 else if(S.sort==='chrono'){const bs=[...D.blocks].sort((a,b)=>b.order-a.order);
  for(const b of bs){const g=L.filter(w=>w.block===b.id);if(!g.length)continue;
   secs.push(['s'+i,isCur(b.id)?b.id+' · тек.':(typeof b.id==='number'?String(b.id):b.label)]);
   h+=`<h2 id="s${i++}">${esc(b.label)}${isCur(b.id)?' <span class="cur">текущая тема</span>':''}</h2>`+g.map(row).join('');}}
 else{for(const [c,n] of CAT){const g=L.filter(w=>w.cat===c);if(!g.length)continue;secs.push(['s'+i,n]);h+=`<h2 id="s${i++}">${n}</h2>`;
  const subs=[...new Set(g.map(w=>w.sub))];
  for(const s of subs){if(s)h+=`<h3>${esc(SUBN[s]||s)}</h3>`;h+=g.filter(w=>w.sub===s).map(row).join('');}}}
 $('list').innerHTML=h;
 $('jump').innerHTML=secs.map(s=>`<button class="chip" data-s="${s[0]}">${esc(s[1])}</button>`).join('');hh();}
const IN='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function ini(s){if(LANG.ini)return LANG.ini(s);const c=s.charCodeAt(0)-0xAC00;return c>=0&&c<11172?IN[Math.floor(c/588)]:s[0];}
function hh(){document.documentElement.style.setProperty('--hh',document.querySelector('header').offsetHeight+'px');}
addEventListener('resize',hh);
$('jump').onclick=e=>{const b=e.target.closest('button');if(b)document.getElementById(b.dataset.s).scrollIntoView({block:'start'});};
$('list').onclick=e=>{const kb=e.target.closest('.wkb');if(kb){togWeak(kb.dataset.wk);render();return;}const eb=e.target.closest('.eye');
 if(eb){const id=eb.dataset.e;S.open.has(id)?S.open.delete(id):S.open.add(id);render();return;}
 const r=e.target.closest('.row');if(r)openCard(r.dataset.id);};
let KV=null;function voice(){if(!window.speechSynthesis)return null;if(!KV)KV=speechSynthesis.getVoices().find(v=>new RegExp('^'+LANG.code,'i').test(v.lang))||null;return KV;}
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=()=>{KV=null;voice();};
function say(t){if(!window.speechSynthesis)return;speechSynthesis.cancel();t=String(t||'').replace(/[()]/g,'');const u=new SpeechSynthesisUtterance(t);u.lang=LANG.tts;u.rate=rate();const v=voice();if(v)u.voice=v;speechSynthesis.speak(u);}
function sec(t,b){return b?`<div class="sec"><b>${t}</b>${b}</div>`:'';}
function openCard(id){const w=BY[id];if(!w)return;
 const notes=(w.notes||[]).map(n=>D.notes[n]).filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
 const rel=(w.rel||[]).map(r=>BY[r.id]?`<button class="rel" data-id="${esc(r.id)}">${esc(BY[r.id].ko)} <span style="font-size:18px">${esc(BY[r.id].ru)}</span></button>`:'').join('');
 const roots=(w.roots||[]).map(r=>{const same=W.filter(x=>x!==w&&(x.roots||[]).some(y=>y.s===r.s&&y.m===r.m));
  return `<p><b style="display:inline;color:var(--fg);font-size:15px">${esc(r.s)}</b> — ${esc(r.m)}${same.length?': '+same.map(x=>`<button class="rel" data-id="${esc(x.id)}">${esc(x.ko)}</button>`).join(''):''}</p>`;}).join('');
 const f=w.forms?`<p>${esc(w.ko)} · ${esc(w.forms.pres)} · ${esc(w.forms.past)}</p>`:'';
 const ex=(w.ex||[]).map(e=>`<p>${esc(e.ko)}<br><span style="color:var(--mut)">${esc(e.ru)}</span></p>`).join('');
 const b=BL[w.block],tags=[`<span class="tag">${esc(b?b.label:w.block)}</span>`,`<span class="tag">${CATN[w.cat]}${w.sub?' · '+esc(SUBN[w.sub]||w.sub):''}</span>`];
 if(w.tag)tags.push(`<span class="tag">${esc(w.tag)}</span>`);if(isCur(w.block))tags.push('<span class="tag cu">текущая тема</span>');
 tags.push(`<button class="tag wkt${WK(w)?' wk':''}" id="wkt">${WK(w)?'плохо помню · убрать':'+ в «плохо помню»'}</button>`);
 $('card').innerHTML=`<div class="top"><div><div class="big">${esc(w.ko)}</div><div class="btr">[${esc(w.tr)}]</div><div class="bru">${esc(w.ru)}</div></div>
 <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px"><button class="x" id="cx" aria-label="Закрыть">×</button><button class="say" id="sy" aria-label="Озвучить">▶</button></div></div>`+
 sec('Употребление',w.usage?`<p>${esc(w.usage)}</p>`:'')+sec('Заметки',notes)+sec('Дополнительно',w.extra?`<p>${esc(w.extra)}</p>`:'')+
 sec('Связанные',rel)+sec('한자어',roots)+sec('Формы',f)+sec('Примеры',ex)+`<div class="tags">${tags.join('')}</div>`;
 $('sy').onclick=()=>say(w.ko);$('cx').onclick=closeCard;$('wkt').onclick=()=>{const y=$('sh').scrollTop;togWeak(w.id);openCard(w.id);$('sh').scrollTop=y;if(S.app==='dict')render();};
 $('card').querySelectorAll('.rel').forEach(b=>b.onclick=()=>openCard(b.dataset.id));
 $('ov').style.display='block';$('sh').scrollTop=0;requestAnimationFrame(()=>$('sh').classList.add('open'));}
function closeCard(){$('sh').classList.remove('open');$('ov').style.display='none';}
$('ov').onclick=closeCard;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCard();});
/* ===== Грамматика ===== */
const G=D.grammar||[],M=D.morphs||[],CJ=D.conj||{stems:[],forms:[],cells:{}};
const GBY=Object.fromEntries(G.map(g=>[g.id,g])),MBY=Object.fromEntries(M.map(m=>[m.id,m]));
const KIND={particle:'частица',ending:'окончание',adverb:'наречие'};
const gn=s=>norm(s).replace(/[\s\/\-–—().,?!·«»:;]/g,'');
const fmt=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
const txt=s=>String(s||'').split(/\n+/).filter(Boolean).map(p=>`<p>${fmt(p)}</p>`).join('');
const NW='<span class="nw">не отработано</span>';
const short=m=>String(m.func||'').split(/[.:]/)[0];
seg('gtab','gtab');
function tMatch(g){const q=gn(S.q);return [String(g.n),g.title,g.meaning,...(g.sections||[]).map(x=>x.title),...(g.usage||[]).map(u=>u.sit+' '+u.phrase)].some(x=>gn(x).includes(q));}
function mMatch(m){const q=gn(S.q);return [m.id,m.func,KIND[m.kind],...(m.forms||[]).map(f=>f.f)].some(x=>gn(x).includes(q));}
const MEMO=()=>(D.memos||[]).filter(m=>!m.after||GBY[m.after]);
const mmMatch=m=>{const q=S.q.toLowerCase();return (m.title+' '+m.sections.map(x=>x.title+' '+x.body).join(' ')).toLowerCase().includes(q);};
function memoRow(m){return `<div class="row" data-memo="${esc(m.id)}"><div class="txt gtr"><span class="gn">✎</span><span class="gt">${esc(m.title)}</span></div></div>`;}
function openMemo(id){const m=MEMO().find(x=>x.id===id);if(!m)return;let h=head('Памятка',m.title);for(const x of m.sections)h+=gsec(esc(x.title),txt(x.body)+exL(x.ex));showSheet(h);}
function tRow(g){return `<div class="row" data-g="${esc(g.id)}"><div class="txt gtr"><span class="gn">${GS2(g)}</span><span class="gt">${esc(g.title)}</span></div></div>`;}
function mRow(m){return `<div class="row" data-m="${esc(m.id)}"><div class="txt"><span class="ko">${esc(m.id)}</span><span class="kd">${KIND[m.kind]||''} · тема ${m.topic}</span><div class="rsub">${esc(short(m))}</div></div></div>`;}
function conjHTML(){const FS=CJ.forms.filter(f=>CJ.stems.some(s=>CJ.cells[s.id+'|'+f.id]));if(!CJ.stems.length)return '<div class="empty">Пока пусто.</div>';
 let h='<div class="tw"><table class="gtb cj"><thead><tr><th>Основа</th>'+FS.map(f=>`<th>${esc(f.label)}</th>`).join('')+'</tr></thead><tbody>';
 for(const s of CJ.stems){if(!FS.some(f=>CJ.cells[s.id+'|'+f.id]))continue;h+=`<tr><th>${esc(s.label)}</th>`;
  for(const f of FS){const c=CJ.cells[s.id+'|'+f.id];
   h+=c?`<td data-g="g${c.topic}"><div class="ko2">${esc(c.v)}</div><div class="cjx">${esc(c.ex)}</div><div class="cjt">тема ${c.topic}</div></td>`:'<td class="mut">—</td>';}
  h+='</tr>';}
 return h+'</tbody></table></div><p class="hint">Строки (типы основ) и колонки (формы) добавляются при закрытии тем. Тап по ячейке — карточка темы.</p>';}
function renderG(){let h='';const Gs=[...G].sort((a,b)=>a.n-b.n);
 if(S.q){const t=Gs.filter(tMatch),m=M.filter(mMatch);
  if(t.length)h+='<h2>Темы</h2>'+t.map(tRow).join('');
  if(m.length)h+='<h2>Частицы и окончания</h2>'+m.map(mRow).join('');
  const mm=MEMO().filter(mmMatch);if(mm.length)h+='<h2>Памятки</h2>'+mm.map(memoRow).join('');
  if(!h)h='<div class="empty">Ничего не найдено.</div>';}
 else if(S.gtab==='topics')h=Gs.length?'<h2>Пройденные темы</h2>'+Gs.map(tRow).join(''):'<div class="empty">Пока пусто.</div>';
 else if(S.gtab==='memo')h=MEMO().length?'<h2>Памятки</h2>'+MEMO().map(memoRow).join(''):'<div class="empty">Пока пусто.</div>';
 else if(S.gtab==='morphs')h=M.length?'<h2>Частицы и окончания</h2>'+[...M].sort((a,b)=>a.topic-b.topic).map(mRow).join(''):'<div class="empty">Пока пусто.</div>';
 else h='<h2>Сводная таблица спряжения</h2>'+conjHTML();
 $('list').innerHTML=h;$('jump').innerHTML='';hh();}
function tbl(t){return (t.title?`<div class="ttl">${esc(t.title)}</div>`:'')+
 `<div class="tw"><table class="gtb"><thead><tr>${t.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`+
 t.rows.map(r=>'<tr>'+r.map(c=>`<td>${String(c).split(' · ').map(x=>`<span class="nb">${esc(x)}</span>`).join('<br>')}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>'+(t.note?`<p class="tnote">${fmt(t.note)}</p>`:'');}
function exL(a){return (a||[]).map(e=>`<p class="ex"><span data-say="${esc(e.ko)}">${esc(e.ko)}</span><br><span class="mut">${esc(e.ru)}</span></p>`).join('');}
function gsec(t,b){return b?`<div class="gsec"><h4>${t}</h4>${b}</div>`:'';}
function useL(a,nw){return (a||[]).map(u=>`<div class="use"><div class="sit">${esc(u.sit)}${nw.has(u.id)?NW:''}</div><div class="ph" data-say="${esc(u.phrase)}">${esc(u.phrase)}</div>${u.note?`<p>${fmt(u.note)}</p>`:''}${exL(u.ex)}</div>`).join('');}
function relC(rel){return (rel||[]).map(r=>{const g=GBY[r.id],m=MBY[r.id];
 if(g)return `<button class="rel" data-g="${esc(g.id)}">${GL(g)}: ${esc(g.title)}</button>`;
 if(m)return `<button class="rel" data-m="${esc(m.id)}">${esc(m.id)}</button>`;
 return `<span class="rel off">${esc(r.label||r.id)}</span>`;}).join('');}
const NWNOTE=`<p class="tnote">${NW} — модель есть в теории, но в чатах не отрабатывалась. В серии не идёт до отработки.</p>`;
function head(sub,title){return `<div class="top"><div><div class="gnum">${sub}</div><div class="gtitle">${esc(title)}</div></div><button class="x" id="cx" aria-label="Закрыть">×</button></div>`;}
function openTopic(id){const g=GBY[id];if(!g)return;const nw=new Set(g['new']||[]);
 let h=head(GL(g),g.title)+gsec('Смысл',txt(g.meaning))+gsec('Схема',(g.schema||[]).map(tbl).join(''));
 for(const s of g.sections||[])h+=gsec(esc(s.title)+(nw.has(s.id)?NW:''),txt(s.body)+exL(s.ex));
 h+=gsec('Употребление',useL(g.usage,nw))+gsec('Связанные темы и частицы',relC(g.rel));
 if(nw.size)h+=NWNOTE;
 showSheet(h);}
function openMorph(id){const m=MBY[id];if(!m)return;const nw=new Set(m['new']||[]);
 const ft={cols:['Условие','Форма','Примеры'],rows:(m.forms||[]).map(f=>[f.c,f.f,f.ex])};
 let h=head((KIND[m.kind]||'')+' · тема '+m.topic,m.id)+gsec('Формы',tbl(ft))+gsec('Функция',txt(m.func))+
  gsec('Употребление',useL(m.usage,nw))+gsec('Примеры',exL(m.ex))+
  gsec('Связанные',relC(m.rel)+(GBY['g'+m.topic]?`<button class="rel" data-g="g${m.topic}">Тема ${m.topic}: ${esc(GBY['g'+m.topic].title)}</button>`:''));
 if(nw.size)h+=NWNOTE;
 showSheet(h);}
function showSheet(h){$('card').innerHTML=h;$('cx').onclick=closeCard;
 $('ov').style.display='block';$('sh').scrollTop=0;requestAnimationFrame(()=>$('sh').classList.add('open'));}
$('card').addEventListener('click',e=>{const t=e.target.closest('[data-g],[data-m],[data-say]');if(!t)return;
 if(t.dataset.g)openTopic(t.dataset.g);else if(t.dataset.m)openMorph(t.dataset.m);else say(t.dataset.say);});
$('list').addEventListener('click',e=>{const t=e.target.closest('[data-g],[data-m],[data-memo]');if(!t)return;
 if(t.dataset.memo)return openMemo(t.dataset.memo);t.dataset.g?openTopic(t.dataset.g):openMorph(t.dataset.m);});
/* ===== Тренировка ===== */
let ST={v:1,weak:{},stats:{},sess:null,last:[]};
function WK(w){const x=ST.weak[w.id];return x?!!x.on:!!w.weak;}
let REF=null,SAVEQ=Promise.resolve(),TREADY=false,TLOCAL=false;
/* Чистка состояния (03.10): храним позицию, «плохо помню», «Спорные», счётчики и незаконченное.
   Уроки прошлых тем (lesArc) — только текущая позиция и повтор; в уроке — тексты завершённых блоков удаляются, остаются вердикты. */
function pruneST(){try{
 if(ST.lesArc&&typeof COURSE==='object'&&COURSE.on){const keep=new Set([COURSE.cur,COURSE.view].filter(Boolean));for(const g of Object.keys(ST.lesArc))if(!keep.has(g))delete ST.lesArc[g];}
 const S=Object.values((ST.les&&ST.les.by)||{});for(const L of Object.values(ST.lesArc||{}))S.push(...Object.values((L&&L.by)||{}));
 for(const s of S){if(!s||!s.bl||typeof s.bi!=='number')continue;
  for(const i of Object.keys(s.bl)){if(+i<s.bi&&s.res&&s.res[i]&&!s.res[i].some(r=>r&&r.v==='bad')){delete s.bl[i];if(s.ans)delete s.ans[i];
   s.res[i]=s.res[i].map(r=>r&&typeof r==='object'?{v:r.v,e:r.e||'',man:r.man||0}:r);}}}
 if(ST.lesArc&&!Object.keys(ST.lesArc).length)delete ST.lesArc;
}catch(e){}}
function saveST(){pruneST();ST.upd=Date.now();const snap=JSON.parse(JSON.stringify(ST));
 try{LSX.setItem(LSK,JSON.stringify(snap));}catch(e){}
 if(REF)SAVEQ=SAVEQ.then(()=>REF.set(snap)).catch(e=>{if(e&&e.code==='unavailable')return new Promise(r=>setTimeout(r,700+Math.random()*700)).then(()=>REF.set(snap)).catch(()=>{});});}
let DBH=null;
async function initST(){let db=null;try{db=HASC?(DBH||(DBH=await window.claude.use('db'))):null;}catch(e){db=null;}
 if(db){try{const m=await db.doc('trainer/mode').get();if(m.exists){const on=!!(m.data()||{}).off;OFFT=on;OFF=on;LSK=on?'trainer_off':'trainer';SMPP=null;try{on?LSX.setItem('offmode','1'):LSX.removeItem('offmode');}catch(e){}offUI();}}catch(e){}}
 let loc=null;try{loc=JSON.parse(LSX.getItem(LSK)||'null');}catch(e){}
 let rem=null;if(db){try{REF=db.doc(OFFT?'trainer/state_off':'trainer/state');const s=await REF.get();if(s.exists)rem=JSON.parse(JSON.stringify(s.data()));}catch(e){REF=null;}}
 if(!REF)TLOCAL=true;
 const best=[rem,loc].filter(Boolean).sort((a,b)=>(b.upd||0)-(a.upd||0))[0];
 if(best)ST=Object.assign({v:1,weak:{},stats:{},sess:null,last:[]},best);
 let fix=false;for(const x of [...Object.values(ST.rs||{}),ST.rsess,...Object.values((ST.sess&&ST.sess.by)||{})]){const c=x&&x.cur,it=x&&x.q&&x.q[x.pos];
  if(c&&it&&c.st==='shown'&&c.r==='bad'&&BY[it.id]&&otherSys(BY[it.id],c.v)){x.cur={st:'ask',r:null,v:''};fix=true;}}
 if(fix||(REF&&loc&&(!rem||(loc.upd||0)>(rem.upd||0))))saveST();
 if(OFF&&offPurge())saveST();
 try{if(COURSE.sync(ST)&&!SSX.getItem('courseRl')){SSX.setItem('courseRl','1');location.reload();return;}}catch(e){}
 TREADY=true;render();setTimeout(()=>{try{lesPump();}catch(e){}},500);}
/* автономный режим: неотвеченные блоки от Claude заменяются блоками из банка */
function offPurge(){let n=0;const S=[...Object.values((ST.les&&ST.les.by)||{}),...Object.values(ST.grs||{})];
 for(const s of S){if(!s||!s.bl)continue;for(const i of Object.keys(s.bl)){const b=s.bl[i];if(!b||(s.res&&s.res[i]))continue;
  if(b.some(x=>x&&x.bid))continue;
  let st=null;try{st=s.kind==='les'&&LBY[s.stage]?lesStatic(s,+i):null;}catch(e){}
  if(st)continue;delete s.bl[i];if(s.ans)delete s.ans[i];n++;}}
 return n;}
initST();
function record(id,r){const s=ST.stats[id]||(ST.stats[id]=[0,0,0]);s[r==='ok'?0:r==='peek'?1:2]++;
 if(CURS.has(id)){const T=(ST.tw=ST.tw||{})[THEME]||(ST.tw[THEME]={}),y=T[id];if(r==='ok'){if(y&&y.on){const c=(y.c||0)+1;T[id]=c>=2?{on:0,c:0}:{on:1,c};}}else T[id]={on:1,c:0};return;}
 const w=BY[id],x=ST.weak[id];
 if(r==='ok'){if(WK(w)){const c=((x&&x.c)||0)+1;ST.weak[id]=c>=2?{on:0,c:0}:{on:1,c};}}
 else ST.weak[id]={on:1,c:0};}
const CURB=(()=>{const c=D.meta.currentBlock;return c==null?[]:(Array.isArray(c)?c:[c]);})();
const CURW=CURB.map(b=>W.filter(w=>w.block===b)),CURS=new Set(CURW.flat().map(w=>w.id)),REG=W.filter(w=>!CURS.has(w.id));
const STAGES=[...CURB.map((b,i)=>({id:'s'+i,i,label:'Раздел '+(i+1),kind:'sec',dir:'rk'})),
 ...(CURB.length?(REG.length?[{id:'all',label:'Вся тема',kind:'all',dir:'rk'},{id:'mixrk',label:'Смешанные РУС→ГРЕ',kind:'mix',dir:'rk'},{id:'mixkr',label:'Смешанные ГРЕ→РУС',kind:'mix',dir:'kr'}]:[{id:'all',label:'Вся тема РУС→ГРЕ',kind:'all',dir:'rk'},{id:'allkr',label:'Вся тема ГРЕ→РУС',kind:'all',dir:'kr'}]):[])];
const RSTG={id:'rev',label:'Повторение',kind:'rev',dir:'rk'};
const STG=Object.fromEntries([...STAGES,RSTG].map(x=>[x.id,x])),FLOW=STAGES.map(x=>x.id),THEME=CURB.join(',');
const RUC={};W.forEach(w=>{RUC[w.ru]=(RUC[w.ru]||0)+1;});
const kn=s=>(LANG.fold?LANG.fold(String(s||'')):String(s||'').normalize('NFC')).replace(/[\s.,!?~'’();·]/g,'');
const KNP=s=>{const t=(LANG.fold?LANG.fold(String(s||'')):String(s||'')).replace(/[.,!?~'’();·]/g,'').replace(/\s+/g,' ').trim();return LANG.pretty?LANG.pretty(t):t;};
function shuf(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
function stitch(ids,tail){ids=[...ids];if(ids.length>1&&tail.includes(ids[0])){const j=ids.findIndex(x=>!tail.includes(x));if(j>0)[ids[0],ids[j]]=[ids[j],ids[0]];}return ids;}
function spread(ids){const g={};ids.forEach(id=>{const c=(BY[id]&&BY[id].cat)||'?';(g[c]=g[c]||[]).push(id);});
 const o=[];for(const c in g){const a=shuf(g[c]),n=a.length,s=Math.random();a.forEach((id,k)=>o.push([(k+s)/n,id]));}
 return o.sort((x,y)=>x[0]-y[0]).map(x=>x[1]);}
function pick(pool,n,excl){const last=new Set(ST.last||[]);const cand=pool.filter(w=>!excl.has(w.id));
 if(cand.length<=n)return shuf(cand).map(w=>w.id);
 const out=shuf(cand.filter(WK)).slice(0,n).map(w=>w.id),used=new Set(out);const need=n-out.length;if(need<=0)return out;
 const rest=cand.filter(w=>!used.has(w.id)),cats=[...new Set(rest.map(w=>w.cat))],by=Object.fromEntries(cats.map(c=>[c,rest.filter(w=>w.cat===c)]));
 const q={};for(const c of cats)q[c]=Math.min(by[c].length,Math.max(1,Math.round(need*by[c].length/rest.length)));
 const sum=()=>cats.reduce((a,c)=>a+q[c],0);
 while(sum()>need){const c=cats.filter(c=>q[c]>1).sort((a,b)=>q[b]-q[a])[0];if(!c)break;q[c]--;}
 while(sum()<need){const c=cats.filter(c=>q[c]<by[c].length).sort((a,b)=>(by[b].length-q[b])-(by[a].length-q[a]))[0];if(!c)break;q[c]++;}
 for(const c of shuf(cats)){const l=by[c];out.push(...[...shuf(l.filter(w=>!last.has(w.id))),...shuf(l.filter(w=>last.has(w.id)))].slice(0,q[c]).map(w=>w.id));}
 return out.slice(0,n);}
function dobor(n){const out=shuf(REG.filter(WK)).slice(0,n).map(w=>w.id);
 if(out.length<n&&CURB.length){const minO=Math.min(...CURB.map(b=>BL[b].order));
  for(const b of D.blocks.filter(b=>b.order<minO).sort((a,b)=>b.order-a.order)){
   for(const w of shuf(W.filter(x=>x.block===b.id)))if(out.length<n&&!out.includes(w.id))out.push(w.id);if(out.length>=n)break;}}
 return out;}
function chunk(a,k){const r=[];for(let i=0;i<a.length;i+=k)r.push(a.slice(i,i+k));return r;}
function buildSeries(kind){
 if(kind==='all'){const a=shuf([...CURS,...dobor(4)]);return chunk(a,Math.ceil(a.length/Math.ceil(a.length/8)));}
 if(kind==='rev')return chunk(spread(pick(REG,100,new Set())),10);
 const cur=[...CURS],A=[...cur,...cur,...dobor(10)],B=spread(pick(REG,50,new Set(A))),bl=Array.from({length:10},()=>[]);
 for(const id of shuf(A)){let c=bl.filter(b=>b.length<5&&!b.includes(id));if(!c.length)c=bl.filter(b=>b.length<5);if(!c.length)break;
  const m=Math.min(...c.map(b=>b.length));const t=c.filter(b=>b.length===m);t[Math.random()*t.length|0].push(id);}
 return bl.map((b,i)=>shuf([...b,...B.slice(i*5,i*5+5)])).filter(b=>b.length);}
function nextBlock(s){const st=STG[s.stage];let ids;
 if(st.kind==='sec')ids=shuf(CURW[st.i].map(w=>w.id));
 else{if(!s.blocks||s.bi>=s.blocks.length-1){s.blocks=buildSeries(st.kind);s.bi=-1;s.cov=null;}s.bi++;ids=s.blocks[s.bi];}
 ids=stitch(ids,s.tail||[]);s.bn++;s.q=ids.map(id=>({id}));s.pos=0;s.res={};s.rep=0;s.ph='q';s.cur={st:'ask',r:null,v:''};}
function sessFor(id,dir){const s={stage:id,dir:dir||STG[id].dir,bn:0,blocks:null,bi:-1,tail:[],cov:null};nextBlock(s);return s;}
function initSess(){if(S.app==='rev'){if(!REG.length)return false;if(!ST.rs){ST.rs={};if(ST.rsess){ST.rs[ST.rsess.dir||'rk']=ST.rsess;ST.rd=ST.rsess.dir||'rk';}delete ST.rsess;}
 ST.rd=ST.rd||'rk';if(!ST.rs[ST.rd])ST.rs[ST.rd]=sessFor('rev',ST.rd);return true;}
 if(!STAGES.length)return false;
 if(!ST.sess||ST.sess.theme!==THEME){ST.sessArc=ST.sessArc||{};if(ST.sess&&ST.sess.theme!=null)ST.sessArc[ST.sess.theme]=ST.sess;ST.sess=ST.sessArc[THEME]||{theme:THEME,cur:STAGES[0].id,by:{}};delete ST.sessArc[THEME];}
 if(!STAGES.some(x=>x.id===ST.sess.cur))ST.sess.cur=STAGES[0].id;
 if(!ST.sess.by[ST.sess.cur])ST.sess.by[ST.sess.cur]=sessFor(ST.sess.cur);return true;}
const SS=()=>S.app==='rev'?ST.rs[ST.rd]:ST.sess.by[ST.sess.cur];
function goStage(id){ST.sess.cur=id;if(!ST.sess.by[id])ST.sess.by[id]=sessFor(id);saveST();updT(true);scrollTo(0,0);}
function adv(s,r){const it=s.q[s.pos];if(!it.rep){s.res[it.id]=r;record(it.id,r);}
 s.pos++;
 if(s.pos>=s.q.length&&!s.rep){s.rep=1;s.q.push(...s.q.filter(x=>!x.rep&&s.res[x.id]==='bad').map(x=>({id:x.id,rep:1})));}
 if(s.pos>=s.q.length){s.ph='sum';s.tail=s.q.slice(-2).map(x=>x.id);const st=STG[s.stage];
  if(st.kind!=='sec'&&s.bi===s.blocks.length-1&&!s.cov){const ids=[...new Set(s.blocks.flat())];s.cov=ids.length;ST.last=ids;}}
 else s.cur={st:'ask',r:null,v:''};
 saveST();}
const LJ='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ',VJ='ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ',
 TJ=['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function syl(s){return [...s].map(ch=>{const c=ch.charCodeAt(0)-0xAC00;if(c<0||c>=11172)return {ch,j:[ch]};return {ch,j:[LJ[c/588|0],VJ[(c%588)/28|0],TJ[c%28]].filter(Boolean)};});}
function diffHTML(a,b){const A=syl(a),B=syl(b),fa=A.flatMap(s=>s.j.map(j=>({j}))),fb=B.flatMap(s=>s.j.map(j=>({j})));
 const n=fa.length,m=fb.length,L=Array.from({length:n+1},()=>new Int16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let k=m-1;k>=0;k--)L[i][k]=fa[i].j===fb[k].j?L[i+1][k+1]+1:Math.max(L[i+1][k],L[i][k+1]);
 for(let i=0,k=0;i<n&&k<m;){if(fa[i].j===fb[k].j){fa[i].m=fb[k].m=1;i++;k++;}else if(L[i+1][k]>=L[i][k+1])i++;else k++;}
 const row=(S,F)=>{let p=0;return S.map(s=>{const js=F.slice(p,p+=s.j.length);return `<span class="dsy${js.some(x=>!x.m)?' bad':''}"><span class="dch">${esc(s.ch)}</span><span class="dj">${js.map(x=>`<i${x.m?'':' class="x"'}>${esc(x.j)}</i>`).join('')}</span></span>`;}).join('');};
 return `<div class="dff"><div class="dl">Твой</div><div class="dr">${row(A,fa)}</div><div class="dl">Верно</div><div class="dr">${row(B,fb)}</div></div>`;}
const btn=(a,t,pri,on,g)=>`<button class="tb${pri?' pri':''}${on?' on'+(g?' g':''):''}" data-a="${a}">${t}</button>`;
function sumHTML(s,st){const ids=s.q.filter(x=>!x.rep).map(x=>x.id),ok=ids.filter(id=>s.res[id]==='ok').length;
 const L=r=>ids.filter(id=>s.res[id]===r).map(id=>`<div class="sw"><span class="swk" data-say="${esc(BY[id].ko)}">${esc(BY[id].ko)}</span> <span class="mut">${esc(BY[id].ru)}</span></div>`).join('');
 const bd=L('bad'),pk=L('peek'),end=st.kind!=='sec'&&s.bi===s.blocks.length-1;
 let h=`<div class="trn"><div class="tmeta">Блок ${s.bn} завершён</div><div class="tp">${ok} из ${ids.length}</div>`+
  (bd?`<div class="sh2">Ошибки</div>${bd}`:'')+(pk?`<div class="sh2">Подсмотрел / не уверен</div>${pk}`:'');
 if(end)h+=`<p class="tcov">${st.kind==='all'?'Этап пройден':'Серия завершена'}. Охват: ${s.cov} из ${W.length} слов.</p><div class="tbtns">${btn('ns',st.kind==='all'?'Ещё раз':'Новая серия',1)}</div>`;
 else h+=`<div class="tbtns">${btn('nb','Следующий блок',1)}</div>`;
 return h+'</div>';}
function introHTML(s,st){const L=CURW[st.i]||[];return `<div class="trn"><div class="tmeta">${esc(st.label)} · новые слова</div><p class="gp">Посмотри и послушай слова раздела — нажми на слово или пример. Потом проверка: перевод с русского.</p>`+
 L.map(w=>`<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div><span class="ko" data-say="${esc(w.ko)}">${esc(w.ko)}</span> <span class="tr">[${esc(w.tr)}]</span></div><div class="ru">${esc(w.ru)}</div>`+
 (w.extra?`<div class="mut" style="font-size:15px">${esc(w.extra)}</div>`:'')+(w.ex||[]).slice(0,1).map(e=>`<div class="mut" style="font-size:16px;margin-top:3px"><span data-say="${esc(e.ko)}">${esc(e.ko)}</span> — ${esc(e.ru)}</div>`).join('')+'</div>').join('')+
 `<div class="tbtns">${btn('wstart','Начать',1)}</div></div>`;}
function updT(focus){const s=SS(),st=STG[s.stage],rv=S.app==='rev';
 $('tst').hidden=rv;$('tnx').hidden=rv;$('tls').hidden=rv;
 $('tst').innerHTML=STAGES.map(x=>`<button class="chip${x.id===s.stage?' on':''}" data-st="${x.id}">${x.label}</button>`).join('')+(rv?'':`<button class="chip" data-ws="1">Итог темы</button>`);
 {const o=$('tst').querySelector('.on');if(o)o.scrollIntoView({inline:'nearest',block:'nearest'});}
 $('tdir').textContent=s.dir==='rk'?'РУС → ГРЕ':'ГРЕ → РУС';$('tcnt').textContent='Блок '+s.bn;
 const fi=FLOW.indexOf(s.stage);$('tnx').disabled=fi<0;
 $('tsp').textContent=TLOCAL?'Прогресс сохраняется только на этом устройстве':(rv?'Весь словарь, кроме текущей темы':'Текущая тема: блоки '+CURB.join(', '));
 const ta=$('ta');
 if(!rv&&st.kind==='sec'&&s.dir==='rk'&&!s.seen&&s.bn===1&&s.pos===0&&!s.rep&&!Object.keys(s.res||{}).length){$('tcard').hidden=true;$('tsum').hidden=false;$('tsum').innerHTML=introHTML(s,st);ta.blur();hh();return;}
 if(s.ph==='sum'){$('tcard').hidden=true;$('tsum').hidden=false;$('tsum').innerHTML=sumHTML(s,st);ta.blur();hh();return;}
 $('tcard').hidden=false;$('tsum').hidden=true;$('tsum').innerHTML='';
 const it=s.q[s.pos],w=BY[it.id],c=s.cur;
 $('tmeta').textContent=(it.rep?'Повтор · ':'')+(s.pos+1)+' / '+s.q.length;
 if(s.dir==='rk'){
  $('tp').className='tp';$('tp').textContent=w.ru;$('tp').removeAttribute('data-say');
  $('thint').textContent=hintRK(w);ta.hidden=false;
  if(c.st==='ask'){ta.value=c.v||'';ta.className='';$('tout').innerHTML='';$('tbtns').innerHTML=btn('chk','Проверить',1)+btn('dk','Не знаю');if(focus)ta.focus();}
  else{ta.value=c.v||'';ta.className=c.r==='bad'?'bad':'ok';
   const res=c.dk?'<div class="tres bad">Не знаю</div>':c.ok?'<div class="tres ok">Верно</div>':(c.r==='ok'?'<div class="tres ok">Опечатка — засчитано</div>':'<div class="tres bad">Ошибка</div>');
   $('tout').innerHTML=res+`<div class="tans" data-say="${esc(w.ko)}">${esc(w.ko)} <span class="tr">[${esc(w.tr)}]</span></div>`+(!c.ok&&!c.dk?(LANG.code==='ko'?diffHTML(kn(c.v),kn(w.ko)):`<div class="gv bad">${markDiff(KNP(w.ko),KNP(c.v),'gdx')}</div><div class="gfix">${markDiff(KNP(c.v),KNP(w.ko))}</div>`)+(c.note?`<div class="gnote">${esc(c.note)}</div>`:''):'');
   $('tbtns').innerHTML=(c.dk||c.ok?'':btn('typo','Опечатка',0,c.r==='ok','g'))+btn('next','Дальше',1);}}
 else{
  $('tp').className='tp k';$('tp').textContent=w.ko;$('tp').dataset.say=w.ko;$('thint').textContent='';ta.hidden=true;ta.blur();
  if(c.st==='ask'){$('tout').innerHTML='';$('tbtns').innerHTML=btn('show','Показать',1);}
  else{$('tout').innerHTML=`<div class="tr2">[${esc(w.tr)}]</div>`+W.filter(x=>x.ko===w.ko).map(x=>`<div class="tru">${esc(x.ru)}</div>`).join('');
   $('tbtns').innerHTML=btn('kok','Знал',1)+btn('kno','Не знал');}}
 hh();}
const SYSN={sino:'한자어 — китайское',native:'고유어 — исконное'};
function hintRK(w){return w.cat==='num'&&w.sub?SYSN[w.sub]:(RUC[w.ru]>1?(SUBN[w.sub]||CATN[w.cat]):'');}
const otherSys=(w,v)=>W.find(x=>x!==w&&x.ru===w.ru&&kn(x.ko)===kn(v));
const ruT=r=>new Set(r.replace(/\([^)]*\)/g,'').split(/[;,]/).map(s=>s.trim().toLowerCase()).filter(Boolean));
const otherSyn=(w,v)=>{const A=ruT(w.ru);return W.find(x=>x!==w&&kn(x.ko)===kn(v)&&[...ruT(x.ru)].some(t=>A.has(t)));};
function check(){const s=SS(),c=s.cur,w=BY[s.q[s.pos].id],v=$('ta').value;if(c.st!=='ask'||!kn(v))return;
 const o=otherSys(w,v);if(o){$('tout').innerHTML=`<div class="tres bad">${esc(o.ko)} — это ${esc(SUBN[o.sub]||'')}, нужно ${esc(SUBN[w.sub]||'')}</div>`;$('ta').select();return;}
 const y=otherSyn(w,v);if(y){$('tout').innerHTML=`<div class="tres bad">${esc(y.ko)} — это «${esc(y.ru)}». Загадано другое слово — «${esc(w.ru)}».</div>`;$('ta').select();return;}
 c.v=v;c.ok=[w.ko,...(w.alt||[])].some(x=>kn(v)===kn(x))?1:0;c.r=c.ok?'ok':'bad';c.note=c.ok?'':(LANG.wnote?LANG.wnote(v,w.ko):'');c.dk=0;c.st='shown';saveST();updT();}
function act(a){const s=SS(),c=s.cur;
 if(a==='wstart'){s.seen=1;saveST();scrollTo(0,0);return updT(true);}
 if(a==='chk')return check();
 if(a==='next'){adv(s,c.r);return updT(true);}
 if(a==='kok'||a==='kno'){adv(s,a==='kok'?'ok':'bad');return updT();}
 if(a==='nb'){nextBlock(s);saveST();scrollTo(0,0);return updT(true);}
 if(a==='ns'){s.blocks=null;nextBlock(s);saveST();scrollTo(0,0);return updT(true);}
 if(a==='dk'){c.st='shown';c.dk=1;c.ok=0;c.r='bad';c.v='';}
 else if(a==='typo')c.r=c.r==='ok'?'bad':'ok';
 else if(a==='show')c.st='shown';
 saveST();updT();}
function bindT(){
 $('tcard').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)return act(b.dataset.a);const t=e.target.closest('[data-say]');if(t)say(t.dataset.say);});
 $('tls').onclick=openList;
 $('tsum').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)return act(b.dataset.a);const t=e.target.closest('[data-say]');if(t)say(t.dataset.say);});
 $('ta').addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const c=SS().cur;if(c.st==='ask')setTimeout(check,40);else act('next');});
 $('ta').addEventListener('input',()=>{const c=SS().cur;if(c&&c.st==='shown')$('ta').value=c.v||'';});}
$('tst').onclick=e=>{if(e.target.closest('[data-ws]')&&TREADY)return wSum();const b=e.target.closest('[data-st]');if(b&&TREADY)goStage(b.dataset.st);};
function wSum(){const T=(ST.tw&&ST.tw[THEME])||{},f=w=>`${w.ko} [${w.tr}] — ${w.ru}`;
 const th=CURW.flat(),tw=th.filter(w=>T[w.id]&&T[w.id].on),rw=REG.filter(WK);
 const st=w=>ST.stats[w.id]||[0,0,0],tot=th.reduce((a,w)=>{const s=st(w);return [a[0]+s[0],a[1]+s[1],a[2]+s[2]];},[0,0,0]);
 const done=STAGES.filter(x=>ST.sess&&ST.sess.by&&ST.sess.by[x.id]).map(x=>x.label);
 const t=`ИТОГ СЛОВАРНОЙ ТЕМЫ: блоки ${CURB.join(', ')} (${th.length} слов)
Этапы: ${done.join(', ')||'—'}
Ответы по словам темы: верно ${tot[0]}, подсмотрел ${tot[1]}, ошибка ${tot[2]}
Плохо помню — слова темы (${tw.length}):
${tw.map(f).join('\n')||'—'}
Плохо помню — остальной словарь (${rw.length}):
${rw.map(f).join('\n')||'—'}`;
 document.querySelectorAll('#tst .chip').forEach(x=>x.classList.toggle('on',!!x.dataset.ws));
 $('tcard').hidden=true;$('tsum').hidden=false;$('ta').blur();
 $('tsum').innerHTML=`<div class="trn"><div class="tmeta">Итог словарной темы</div><div class="tp">${th.length-tw.length} из ${th.length}</div>
 <p class="gp">Слово темы попадает в «плохо помню» после ошибки или подсказки и выходит после двух верных ответов подряд. Чувствуешь себя уверенно — открывай следующую тему; если нет — повтори этапы.</p>
 <textarea id="wsum" readonly rows="12">${esc(t)}</textarea>${courseNextHTML()}<div class="tbtns"><button class="tb" data-wc="1">Скопировать</button></div></div>`;hh();}
$('list').addEventListener('click',e=>{const b=e.target.closest('#tsum [data-wc]');if(!b)return;const t=$('wsum');t.select();
 try{navigator.clipboard.writeText(t.value).then(()=>{b.textContent='Скопировано';},()=>{b.textContent='Выдели и скопируй вручную';});}catch(x){b.textContent='Выдели и скопируй вручную';}});
$('tdir').onclick=()=>{if(!TREADY)return;if(S.app==='rev'&&(S.rtab==='n'||S.rtab==='c'))return xDir();if(S.app==='rev'&&S.rtab==='g')return grDir();if(S.app==='rev'){ST.rd=ST.rd==='rk'?'kr':ST.rd==='kr'?'au':'rk';saveST();$('list').innerHTML='';scrollTo(0,0);return render();}const s=SS(),n=sessFor(s.stage,s.dir==='rk'?'kr':'rk');if(S.app==='rev')ST.rsess=n;else ST.sess.by[s.stage]=n;saveST();updT(true);};
function openList(){const s=SS(),st=STG[s.stage],L=st.kind==='sec'?CURW[st.i]:CURW.flat();
 showSheet(`<div class="top"><div class="gtitle">${st.kind==='sec'?esc(st.label):'Слова темы'}</div><button class="x" id="cx" aria-label="Закрыть">×</button></div>`+
  L.map(w=>`<div class="lw">${esc(w.ru)} — <span class="lwk">${esc(w.ko)}</span></div>`).join(''));}
$('tnx').onclick=()=>{if(!TREADY)return;const fi=FLOW.indexOf(SS().stage);if(fi>=0&&fi<FLOW.length-1)goStage(FLOW[fi+1]);else if(fi===FLOW.length-1){wSum();scrollTo(0,0);}};
function renderT(){tabHi();if(xMode())return renderX();if(exMode())return renderEX();$('tdir').hidden=false;$('jump').innerHTML='';
 if(!TREADY){$('list').innerHTML='<div class="empty">Загрузка…</div>';hh();return;}
 if(!initSess()){$('list').innerHTML='<div class="empty">'+(S.app==='rev'?'Повторять пока нечего: пройденных слов ещё нет.':'Текущей словарной темы нет. Урок грамматики — вкладка «Грамматика» выше.')+'</div>';$('trainbars').hidden=false;$('tdir').hidden=true;$('tnx').hidden=true;$('tst').hidden=true;$('tcnt').textContent='';hh();return;}
 $('trainbars').hidden=false;
 if(!$('tcard')){$('list').innerHTML=`<div class="trn" id="tcard"><div class="thd"><div class="tmeta" id="tmeta"></div><button class="chip" id="tls">Список</button></div><div class="tp" id="tp"></div><div class="thint" id="thint"></div><input id="ta" lang="${LANG.code}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" aria-label="Ответ"><div id="tout"></div><div class="tbtns" id="tbtns"></div></div><div id="tsum" hidden></div>`;bindT();}
 updT(false);}
/* ===== Грамматика: упражнения (повторение + урок) ===== */
const DR=D.drill||{weak:[],skip:[]},GSKIP=new Set(DR.skip||[]);
const CURG=GBY[D.meta.currentGrammar]||null;
const RB=(()=>{const O=Object.fromEntries((D.blocks||[]).map(x=>[x.id,x.order]));return [...new Set(REG.map(w=>w.block).filter(b=>typeof b==='number'))].sort((a,b)=>(O[b]??b)-(O[a]??a)).slice(0,4);})(),RECENT=new Set(REG.filter(w=>RB.includes(w.block)).map(w=>w.id));
function GL(g){return g?(g.label||('Тема '+g.n)):'Тема ?';} function GS2(g){return g.short||g.n;}
const GTOP=G.filter(g=>g.n>0&&!g.open&&!g.norev).sort((a,b)=>a.n-b.n);
const gMod=g=>{const nw=new Set(g['new']||[]);return (g.usage||[]).filter(u=>!nw.has(u.id));};
const GR={gen:{},pf:{},ck:{},err:{},why:{},qa:{},tick:null,qrun:false,qf:{}};
let SMPP=null;
function SMP(){if(!SMPP)SMPP=(!OFF&&HASC)?window.claude.use('sample').catch(()=>null):Promise.resolve(null);return SMPP;}
const lsg=(k,d)=>{try{return LSX.getItem(k)||d;}catch(e){return d;}};
S.rtab=lsg('rtab','w');S.ttab=lsg('ttab','w');
const tabKey=()=>S.app==='rev'?'rtab':'ttab';
function tabHi(){if((S.app!=='rev'||LANG.noX)&&(S.ttab==='n'||S.ttab==='c'))S.ttab='w';if(LANG.noX&&(S.rtab==='n'||S.rtab==='c'))S.rtab='w';$('rtab').querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x.dataset.v===S[tabKey()]);x.hidden=(S.app!=='rev'||LANG.noX)&&(x.dataset.v==='n'||x.dataset.v==='c');});}
const exMode=()=>(S.app==='rev'||S.app==='train')&&S[tabKey()]==='g';
const rot=(a,o,n)=>a.length?Array.from({length:n},(_,k)=>a[(o+k)%a.length]):[];
const sec2=ms=>Math.round((Date.now()-ms)/1000)+' с';
const FORBID=(()=>{let f='-는데 / -(으)ㄴ데 (фон, контраст); 때문에, -기 때문에, -잖아요, -거든요; 합니다-форма (кроме готовых формул этикета); -(으)세요 (кроме готовых формул этикета); -고 싶다; -(으)ㄹ 거예요; -(으)ㄹ게요, -(으)ㄹ래요; -(으)ㅂ시다, -(으)ㄹ까요; -(으)러 가다; -고 (соединение); -지만; -아서/어서; -(으)니까; -(으)면; 그래서, 그리고, 하지만, 그런데; (으)로 (направление, средство, язык) — тема 33; -(으)ㄹ 수 있다; -아야 되다; -아/어 보다 («попробовать») — тема 35; -아도 되다; -고 있다; причастия (-(으)ㄴ/는/ㄹ перед существительным); -(으)ㄴ 후에, -기 전에, -(으)ㄹ 때; 에게/한테; 부터/까지; 의 и 제/내/제가 (притяжательные, 저+가) — тема 15; 께서, -시-; 반말 (кроме формул); 보다, 처럼, 제일/가장; -네요, -군요, -지요; 쯤, 동안, 마다; формы ㅂ-불규칙 (쉬워요, 더워요, 도와요 и т.п.) — со словами на ㅂ (кроме 입다, 좁다, 넓다) только -지 않다; время по часам, минуты, даты, дни недели (시, 분, 월, 일, 요일, 년) — тема 16; формы ㅅ-불규칙 (나아요, 지어요) — с 낫다, 짓다 только -지 않다; 누가 и 뭐가 (вопрос «кто? / что?» в роли подлежащего: 누가 왔어요?, 뭐가 있어요?) — не пройдено; из вопросительных как подлежащее — нельзя, 누구 только в 누구예요? и как дополнение; слова и выражения текущей, ещё не закрытой словарной темы (в словаре их нет); наречия 많이, 잘, 같이; сложные предложения — только простые фразы (можно две короткие подряд).';const has=id=>(D.grammar||[]).some(g=>g.id===id);
 const T={pr1:["누가 и 뭐가 (вопрос «кто? / что?» в роли подлежащего: 누가 왔어요?, 뭐가 있어요?) — не пройдено; из вопросительных как подлежащее — нельзя, 누구 только в 누구예요? и как дополнение; "],g15:['에게/한테; ','부터/까지; ','의 и 제/내/제가 (притяжательные, 저+가) — тема 15; '],g16:['время по часам, минуты, даты, дни недели (시, 분, 월, 일, 요일, 년) — тема 16; '],g17:['쯤, 동안, 마다; '],g18:['формы ㅂ-불규칙 (쉬워요, 더워요, 도와요 и т.п.) — со словами на ㅂ (кроме 입다, 좁다, 넓다) только -지 않다; '],g19:['формы ㅅ-불규칙 (나아요, 지어요) — с 낫다, 짓다 только -지 않다; '],g20:['합니다-форма (кроме готовых формул этикета); '],g22:['-(으)ㄹ 거예요; '],g23:['-고 싶다; '],g24:['-(으)ㄹ게요, -(으)ㄹ래요; '],g25:['-(으)세요 (кроме готовых формул этикета); '],g26:['-(으)ㅂ시다, -(으)ㄹ까요; '],g27:['-(으)러 가다; '],g28:['-고 (соединение); '],g29:['-지만; '],g30:['-아서/어서; '],g31:['-(으)니까; '],g32:['-(으)면; '],g34:['-(으)ㄹ 수 있다; '],g36:['-아도 되다; '],g37:['-고 있다; '],g41:['-(으)ㄴ 후에, -기 전에, -(으)ㄹ 때; '],g42:['보다, 처럼, 제일/가장; '],g43:['-네요, -군요, -지요; '],g44:['께서, -시-; '],g45:['반말 (кроме формул); '],g47:['-는데 / -(으)ㄴ데 (фон, контраст); '],g48:['때문에, -기 때문에, -잖아요, -거든요; '],g40:['причастие -(으)ㄹ перед существительным (тема 40); '],g33:['그래서, 그리고, 하지만, 그런데; ','(으)로 (направление, средство, язык) — тема 33; '],g35:['-아야 되다; ','-아/어 보다 («попробовать») — тема 35; ']};
 if(has('g16')&&D.drill)D.drill.skip=[];
 if(has('g39'))f=f.replace('причастия (-(으)ㄴ/는/ㄹ перед существительным); ','причастие -(으)ㄹ перед существительным (тема 40); ');
 for(const g in T)if(has(g)&&!(g==='pr1'&&(D.grammar.find(x=>x.id==='pr1')||{}).open))for(const c of T[g])f=f.split(c).join('');
 if(has('g28'))f=f.replace('сложные предложения — только простые фразы','сложные предложения — только через '+['-고'].concat(has('g29')?['-지만']:[]).concat(has('g30')?['-아서/어서']:[]).concat(has('g31')?['-(으)니까']:[]).concat(has('g32')?['-(으)면']:[]).concat(has('g33')?['связки 그리고/그래서/하지만/그런데 между фразами']:[]).join(', ')+' или две простые фразы');
 {const A=['많이','잘','같이'].filter(a=>!(D.words||[]).some(w=>w.ko===a));f=f.replace('наречия 많이, 잘, 같이; ',A.length?'наречия '+A.join(', ')+'; ':'');}
 return f;})();
function partU(g,pl){if(!pl||!g.parts)return null;const P=g.parts.filter(p=>pl.has(p.id));
 return {s:new Set(P.flatMap(p=>p.sections||[])),u:new Set(P.flatMap(p=>p.usage||[]))};}
function topicTxt(g,pl){const nw=new Set(g['new']||[]),f=partU(g,pl);
 const sc=(g.sections||[]).filter(s=>!nw.has(s.id)&&(!f||f.s.has(s.id))).map(s=>s.title.replace(/^\d+\.\s*/,'')).join('; ');
 const us=gMod(g).filter(u=>!f||f.u.has(u.id));
 return `${g.id} · ${GL(g)}. ${g.title}\n  разделы: ${sc}\n  модели: `+us.map(u=>`${u.id} «${u.sit}»: ${u.phrase}`).join(' | ');}
function flagTxt(ex){ex=ex||new Set();const o=[];for(const x of [...G,...M]){const nw=new Set((x['new']||[]).filter(f=>!ex.has(x.id+':'+f)));
 for(const u of (x.usage||[]))if(nw.has(u.id))o.push(`${u.phrase} («${u.sit}»)`);
 for(const u of (x.sections||[]))if(nw.has(u.id))o.push((u.ex||[]).map(e=>e.ko).join(' / ')+` («${u.title.replace(/^\d+\.\s*/,'')}»)`);}
 return [...new Set(o)].join('; ');}
function vocTxt(){return W.filter(w=>!GSKIP.has(w.id)&&!CURS.has(w.id)).map(w=>`${w.ko} — ${w.ru}`).join('\n');}
const kow=id=>BY[id]?BY[id].ko:id;
function slotTxt(sl){return sl.map((x,k)=>{const g=GBY[x.t],u=(g.usage||[]).find(u=>u.id===x.u)||{};return `${k+1}. ${x.t} (тема ${g.n}), модель ${x.u}: «${u.sit}» — ${u.phrase}`;}).join('\n');}
function mkGen(o){const rk=o.dir==='rk';
 return `Ты составляешь упражнение по корейскому для русскоязычного ученика уровня A1 (TOPIK 1). Нужно ${o.n} фраз для перевода ${rk?'с русского на греческий':'с греческого на русский'}.
${o.lead?'\n'+o.lead+'\n':''}
ЖЁСТКИЕ ПРАВИЛА
1. Грамматика — только то, что есть в списке «ПРОЙДЕНО». Всё остальное запрещено, даже если кажется простым. Прямо запрещено: ${o.unflag&&o.unflag.has('g2:u9')?FORBID.replace("누가 и 뭐가 (вопрос «кто? / что?» в роли подлежащего: 누가 왔어요?, 뭐가 있어요?) — не пройдено; из вопросительных как подлежащее — нельзя, 누구 только в 누구예요? и как дополнение; ",''):FORBID}
2. Запрещены модели «не отработано»: ${flagTxt(o.unflag)||'—'}.
3. Лексика — только слова из «СЛОВАРЯ» и их формы по пройденной грамматике. Никаких других слов. Имена — только 민수 и 지민, в русской фразе с пометкой «(имя)». Частицы в эталоне не опускать (кроме формул вроде «커피 한 잔 주세요»).
4. Выражения этикета из словаря — только целиком, без изменения формы, и только в ситуации, которая однозначно определяет выбор; ситуацию опиши в русской фразе коротко в скобках: «(ты уходишь, хозяин остаётся дома)». Не приклеивай формулу к несвязанной фразе.
5. ${(D.grammar||[]).some(g=>g.id==='g21')?'Регистр по ситуации: по умолчанию 해요; 합니다 — когда говорящий выступает в роли (выступление, объявление, прогноз, доклад на совещании, сотрудник клиенту), и тогда ситуация в скобках русской фразы. Этикетные формулы — в 합니다 и внутри 해요-речи.'+((D.grammar||[]).some(g=>g.id==='g26')?' -(으)ㅂ시다 — только группе и равным, ситуация в скобках («(коллегам)»); старшему — -(으)ㄹ까요?.':''):(D.grammar||[]).some(g=>g.id==='g20')?'Вежливый стиль 해요. 합니다-форма — только во фразах на модели темы 20; тогда в русской фразе пометка в скобках: «(официально)», «(на совещании)», «(в объявлении)».':'Вежливый стиль 해요.'}
6. На весь блок не больше 3 вхождений слов 친구, 집, 먹다, 커피, 학교. Люди — члены семьи, 사장님, 이웃, 손님, 의사, 회사원; места — 도서관, 공원, 가게, 식당, 회사.
7. Одно и то же знаменательное слово — не больше чем в двух фразах блока.
8. Русская фраза естественная и однозначно ведёт к корейской модели: контраст 은/는 — через «а», 도 — «тоже / и», 만 — «только», 못 — «не могу / не смог», 안 — «не». Для 형/누나/오빠/언니 пол говорящего в скобках: (говорит мужчина). Омонимы уточняй в скобках: «чай», «машина».
9. Никаких подсказок: корейских слов, частиц или транскрипции в русской фразе нет.
10. Фразы разные по ситуации и лицу: вопросы, ответы с 네/아니요, утверждения, рассказ о прошлом. 10а. Если в эталоне выбор 은/는 или 이/가 существенен, русская фраза должна его определять (вопрос «кто/что?» и ответ на него, явный контраст «а я…», «а мясо…»). 11. Скобки в русской фразе — ТОЛЬКО пояснение (ситуация, пол говорящего, омоним). Их содержимое НЕ переводится и в эталон ko и alt НЕ входит; всё, что нужно перевести, — вне скобок. Факт, который естественно просится в перевод («в этой фирме десять человек»), в скобки не ставь: либо вынеси в переводимую часть, либо сократи пояснение до ситуации («(о коллеге)»). 12. «А вы? / а ты?» (N은/는요?) и любое обращение к собеседнику: в скобках укажи, кто собеседник («(спрашиваешь учителя)», «(спрашиваешь 지민 (имя))»); эталон — обращение по этому статусу или имени. Слов «ты/вы» в корейском эталоне нет; 친구 как обращение к самому другу не используется (к другу — по имени). 13. Пояснение в скобках должно соответствовать переводимой фразе и не описывать чужие реплики, которые надо «догадаться» перевести. Если в задании две реплики (вопрос и ответ), обе пишутся явно через тире: «— В сумке есть зонт? — Нет, спасибо.»; эталон содержит ровно их. 15. Задание из нескольких фраз — одна связная мини-ситуация: вторая фраза логически продолжает первую (вопрос → ответ на него, утверждение → уточнение). Несвязанные фразы в одно задание не объединять. 16. Контекст — минимальный: одна короткая скобка и только если без неё выбор формы неоднозначен. Описание ситуации и указания («спроси…», «скажи…», «ты посмотрел фильм…») — ТОЛЬКО в скобках; вне скобок — ровно то, что надо перевести. Плохо: «Ты встретил знакомого. Спроси, как его зовут.» Хорошо: «(Новому знакомому) Как вас зовут?» 17. Счёт: исконные числа — с 개, 명, 마리, 잔, 권, 살, 시 (사과 여섯 개, 두 명, 세 살); китайские — с 원, 층, 분, 번, в номерах и датах (육천 원, 삼 층). ${o.dir==='rk'?'14. Необязательную частицу (в этой фразе верно и с ней, и без неё) пиши в эталоне ko в круглых скобках: 커피(를) 주세요, 우유(가) 있어요?, 이 도서관(은) 주소가 뭐예요?, 어디(에) 가요? Обязательные частицы — без скобок (몇 층에 있어요?, 저는 커피, 친구는 차 — контраст). Скобки только вокруг частицы, не вокруг слов.':'14. В ko скобок нет: полная естественная фраза.'}

ПЛАН БЛОКА — фраза k строится на модели из пункта k (тема обязательна, ситуация может отличаться от образца):
${slotTxt(o.sl)}

СЛОВА БЛОКА — каждое использовать хотя бы в одной фразе: ${o.w.map(kow).join(', ')||'—'}
${o.c.length?'Слова последней закрытой словарной темы — использовать каждое: '+o.c.map(kow).join(', '):''}
${o.weak?'Слабое место ученика — дополнительно учесть в одной из фраз:\n'+o.weak+'\n':''}
ОТВЕТ — только JSON-массив из ${o.n} объектов по порядку плана:
{"ru":"русская фраза","ko":"корейский эталон","alt":["другие верные варианты, если заметно отличаются"],"t":"g3","u":"u2","w":["слова из «СЛОВ БЛОКА» и выражений, вошедшие во фразу, в словарной форме"]}

ПРОЙДЕНО
${o.allowed}

СЛОВАРЬ
${vocTxt()}`;}
function chkPrompt(s,i){const rk=s.dir==='rk',it=s.bl[i],a=s.ans[i]||[];
 const L=it.map((x,k)=>`${k+1}. Задание: ${rk?x.ru:x.ko} | Эталон: ${rk?x.ko:x.ru}${rk&&x.alt&&x.alt.length?' | Допустимо: '+x.alt.join(' / '):''} | Ответ ученика: ${((a[k]||'').trim().replace(/^-$/,''))||'(не знает)'}`).join('\n');
 return `Проверь ответы ученика (корейский, уровень A1). Направление: ${rk?'русский → корейский':'корейский → русский'}.

${rk?`Оценки:
- "ok" — верно. Засчитывай любой грамматически правильный вариант, передающий смысл задания: другой порядок слов, опущенные 저는/тема, 뭐 ↔ 무엇, 하고 ↔ 와/과, естественное в разговоре выпадение частицы, синоним. Буквального совпадения с эталоном не требуй. Отсутствие точки, «?» и лишние пробелы — не ошибка. Текст в скобках в задании — пояснение, он не переводится: его отсутствие в ответе — не ошибка. Выбор 은/는 vs 이/가: если контекст задания не делает выбор однозначным (нет вопроса «кто/что?», нет контраста, нет вопросительного слова), засчитывай оба; ошибка — только когда выбор определён (누가/뭐가 и ответ на них — 이/가; явный контраст — 은/는). Скобки в эталоне вокруг частицы — частица необязательна: ответ с ней и без неё верен. Ученик тоже может писать частицу в скобках (저(는), 커피(를)): это верно, если в этой фразе верны оба варианта; если частица в скобках на деле обязательна или неуместна — ошибка, объясни. В fix сохраняй скобки ученика, если они верны. Если в задании «а вы?/а ты?» собеседник не указан, засчитывай любое уместное обращение по статусу или имени (선생님은요?, 사장님은요?, 지민은요?). Если эталон содержит перевод текста из скобок, сверяй ответ только с частью эталона, соответствующей тексту вне скобок.
- "typo" — описка: случайно не та буква (чамо), грамматика и слово явно верные. Запись по произношению (머거요, 이써요, 한구거) — НЕ описка, это "bad".
- "bad" — ошибка: частица (в т.ч. потеря 에/에서 перед 도/만, путаница 은/는 ↔ 이/가 там, где нужен контраст или новое), форма глагола, время, связка, 에 ↔ 에서, не то слово, не тот уровень вежливости, потерян смысл («а», «тоже», «только», «не могу»), запись по произношению, пустой ответ.`:`Оценки:
- "ok" — смысл передан верно; порядок слов, синонимы и стиль русского перевода не важны. Опечатки в русском не важны. Имена в любой кириллической передаче (지민 — Чимин, Джимин) — не ошибка и не упоминаются в пояснении.
- "typo" — не используется.
- "bad" — неверно понято слово, время, отрицание, «тоже/только/не могу», кто что делает; пустой ответ.`}

Для каждого пункта объект:
{"v":"ok|typo|bad","fix":"${rk?'ответ ученика, в котором исправлены ТОЛЬКО ошибки; всё допустимое (порядок слов, опущенные или добавленные 저는 и частицы, синонимы, другой вариант записи) оставь в точности как у ученика — не подгоняй под эталон':'верный перевод'}","note":"только для bad: одно короткое предложение по-русски, в чём ошибка; иначе пустая строка","e":"только для bad: particle | form | tense | word | order | spelling | meaning | empty"}

${rk?'Пример fix: задание «Мне кофе. А вам? (спрашиваешь учителя)», эталон «저는 커피 주세요. 선생님은요?», ответ «커피를 주세요. 친구는요?» → fix «커피를 주세요. 선생님은요?» (исправлено только обращение; 커피를 и отсутствие 저는 допустимы и сохранены).\n\n':''}Ответ — только JSON-массив из ${it.length} объектов в том же порядке.

${L}`;}
const EN={particle:'частица',form:'форма',tense:'время',word:'слово',order:'порядок слов',spelling:'написание',meaning:'смысл',empty:'нет ответа'};Object.assign(EN,{allo:'форма частицы / окончания',pron:'запись по произношению',yo:'без 요',trap:'типичная ошибка',self:'отмечено вручную',brk:'скобки в ответе',unk:'не распознано'});
function passedTxt(){const lim=CURG?CURG.n:99;return GTOP.filter(g=>g.n<lim).map(g=>`${g.n}. ${g.title}`).join('; ');}
function whyPrompt(s,i,k){const x=s.bl[i][k],r=s.res[i][k],a=((s.ans[i]||[])[k]||'').trim(),rk=s.dir==='rk',g=GBY[x.t];
 return `Ученик учит корейский с нуля (уровень A1), родной язык русский. Пройденная грамматика: ${passedTxt()}${CURG&&s.kind==='les'?`; сейчас изучает: ${GL(CURG)}. ${CURG.title}`:''}.
Объясни по-русски коротко (3–6 предложений, без заголовков и списков), почему ответ неверен и как правильно. Опирайся только на пройденную грамматику и знакомые слова; не вводи новых конструкций. Если ответ ученика на самом деле допустим — прямо так и скажи.

Задание (${rk?'перевести на греческий':'перевести на русский'}): ${rk?x.ru:x.ko}
Эталон: ${rk?x.ko:x.ru}${x.alt&&x.alt.length?' (также: '+x.alt.join(' / ')+')':''}
Ответ ученика: ${a&&a!=='-'?a:'(не ответил)'}
Исправление: ${r.fix||'—'}
Замечание проверки: ${r.note||'—'}
Тема упражнения: ${g?GL(g)+'. '+g.title:'—'}`;}
const ECODE={not_granted:'Нет разрешения на запросы к Claude. Обнови страницу и разреши запрос.',rate_limited:'Слишком много запросов подряд. Подожди минуту.',
 invalid_json:'Ответ не разобрался.',prompt_too_large:'Запрос слишком большой.',session_expired:'Сессия истекла. Обнови страницу.',
 sampling_disabled:'Запросы к Claude отключены для этого аккаунта.',not_declared:'Страница опубликована без доступа к Claude.',refused:'Claude отказался отвечать.',
 empty_completion:'Пустой ответ.',get no_sample(){return OFF?'Автономный режим: задания от Claude недоступны. Банк готовых заданий подключается позже.':'Запросы к Claude работают только при открытии страницы в Claude (приложение или claude.ai).';}};
const emsg=e=>ECODE[e&&e.code]||('Ошибка запроса'+(e&&e.code?' ('+e.code+')':'')+'.');
function normIt(x,t,u){return {ru:String(x.ru).trim(),ko:String(x.ko).trim(),alt:Array.isArray(x.alt)?x.alt.filter(a=>typeof a==='string'&&a.trim()):[],t:GBY[x.t]?x.t:t,u:x.u||u||'',w:Array.isArray(x.w)?x.w.map(String):[],traps:Array.isArray(x.traps)?x.traps:[],strict:!!x.strict,say:x.say||''};}
function valid(r,sl){if(!Array.isArray(r))throw {code:'invalid_json'};const n=sl.length;
 const it=r.filter(x=>x&&typeof x.ru==='string'&&typeof x.ko==='string'&&x.ru.trim()&&x.ko.trim()).slice(0,n).map((x,k)=>normIt(x,(sl[k]||{}).t,(sl[k]||{}).u));
 if(it.length<Math.ceil(n/2))throw {code:'invalid_json'};return it;}

/* --- Повторение: сессии и план --- */
function GS(){if(ST.gr&&!ST.grs){ST.grs={[ST.gr.dir||'rk']:ST.gr};ST.grd=ST.gr.dir||'rk';ST.grstat=ST.gr.stats||{};}delete ST.gr;
 ST.grs=ST.grs||{};ST.grd=ST.grd||'rk';ST.grstat=ST.grstat||{};return ST.grs[ST.grd];}
function fixRun(b){for(let i=2;i<b.length;i++)if(b[i].t===b[i-1].t&&b[i].t===b[i-2].t){const j=b.findIndex((x,k)=>k>i&&x.t!==b[i].t);if(j>0)[b[i],b[j]]=[b[j],b[i]];}return b;}
function planSeries(sel){const T=GTOP.filter(g=>gMod(g).length&&!(g.nokr&&ST.grd==='kr')&&(!sel||sel.includes(g.n))&&(!OFF||BANK.has(g.id)));if(!T.length)return [];
 let sl=[];T.forEach(g=>sl.push(g.id,g.id));
 const wt=T.map(g=>gMod(g).length),tot=wt.reduce((a,b)=>a+b,0);
 while(sl.length<100){let r=Math.random()*tot,i=0;while(r>=wt[i]){r-=wt[i];i++;}sl.push(T[i].id);}
 const mq={},mi={};T.forEach(g=>mq[g.id]=shuf(gMod(g).map(u=>u.id)));
 const bl=chunk(shuf(sl).map(t=>{const k=mi[t]=(mi[t]||0)+1;return {t,u:mq[t][(k-1)%mq[t].length]};}),10).map(fixRun);
 for(let i=1;i<bl.length;i++){const tl=bl[i-1].slice(-2).map(x=>x.t),b=bl[i];if(tl.includes(b[0].t)){const j=b.findIndex(x=>!tl.includes(x.t));if(j>0)[b[0],b[j]]=[b[j],b[0]];}}
 const sv=ST.last;ST.last=(GS()&&GS().lastW)||[];const pk=pick(W.filter(w=>!CURS.has(w.id)&&!RECENT.has(w.id)&&!GSKIP.has(w.id)),100,new Set());ST.last=sv;
 const wb=bl.map(()=>[]);spread(pk).forEach((id,i)=>wb[Math.floor(i/10)].push(id));
 const cur=shuf([...RECENT]),cb=bl.map(()=>[]);cur.forEach((id,i)=>cb[i%10].push(id));
 shuf([...Array(10).keys()]).slice(0,5).forEach((b,k)=>{const id=cur[k];if(id&&!cb[b].includes(id))cb[b].push(id);});
 const wk=bl.map(()=>[]);(DR.weak||[]).forEach((x,k)=>[1,4,7].forEach(b=>{const i=(b+k)%10;wk[i].push(x.id);}));
 return bl.map((b,i)=>({sl:b,w:wb[i],c:cb[i],wk:wk[i]}));}
function newSeries(){const o=GS()||{},d=ST.grd;
 ST.grs[d]={id:Date.now(),kind:'rev',dir:d,plan:planSeries(d==='au'?GAU().sel:null),bi:0,bl:{},ans:{},res:{},lastW:o.lastW||[]};saveST();}

/* --- Урок: этапы и сессии --- */
const PARTS=CURG&&CURG.parts?CURG.parts:[];const PREVG=CURG?GTOP.filter(g=>g.n<CURG.n&&(!OFF||BANK.has(g.id))).length:0;
const LSTG=[...PARTS.map((p,k)=>({id:p.id,kind:'part',label:'Часть '+(k+1),size:5,dir:'rk',extra:1,p})),
 {id:'all',kind:'all',label:'Вся тема',size:8,dir:'rk',extra:1},
 ...(PREVG?[{id:'mixrk',kind:'mix',label:'Смешанные РУС→ГРЕ',size:10,dir:'rk',extra:2}]:[]),
 ...(CURG&&(CURG.nokr||!PREVG)?[]:[{id:'mixkr',kind:'mix',label:'Смешанные ГРЕ→РУС',size:10,dir:'kr',extra:2}]),
 {id:'end',kind:'end',label:'Итог'}];
const LBY=Object.fromEntries(LSTG.map(x=>[x.id,x]));
function LES(){if(!CURG||!PARTS.length)return null;if(!ST.les||ST.les.g!==CURG.id){ST.lesArc=ST.lesArc||{};if(ST.les&&ST.les.g)ST.lesArc[ST.les.g]=ST.les;ST.les=ST.lesArc[CURG.id]||{g:CURG.id,stage:PARTS[0].id,view:'th',by:{},qa:{},started:false,wp:0,cp:0};delete ST.lesArc[CURG.id];}
 if(!LBY[ST.les.stage]){ST.les.stage=PARTS[0].id;ST.les.view='th';}return ST.les;}
function lesS(id){const L=LES(),st=LBY[id];if(!L||!st||st.kind==='end')return null;
 return L.by[id]||(L.by[id]={id:'L'+id+'-'+Date.now(),kind:'les',stage:id,dir:st.dir,bi:0,bl:{},ans:{},res:{}});}
const LS=()=>{const L=LES();return L?lesS(L.stage):null;};
function lesStatic(s,i){const st=LBY[s.stage],a=st.kind==='part'?(st.p.ex||[]):st.kind==='all'?(CURG.allEx||[]):[];
 const b=a[i];return b?b.map(x=>{const y=normIt(x,CURG.id,x.u);if(/[()\[\]|]/.test(y.ko)){const t=y.ko;y.ko=BANK.show(t);y.alt=[t,...(y.alt||[])];}return y;}):null;}
function lesPool(st){const pl=st.kind==='part'?new Set([st.p.id]):null,f=partU(CURG,pl);return gMod(CURG).filter(u=>!f||f.u.has(u.id)).map(u=>({t:CURG.id,u:u.id}));}
function lesGen(s,i){const st=LBY[s.stage],L=LES(),own=lesPool(st);let sl;
 if(st.kind==='mix'){const old=GTOP.filter(g=>g.n<CURG.n&&gMod(g).length);
  sl=[...rot(own,i*5,5),...shuf(old).slice(0,5).map(g=>{const m=gMod(g);return {t:g.id,u:m[Math.random()*m.length|0].id};})];sl=shuf(sl);}
 else sl=rot(own,i*st.size,st.size);
 const nc=RECENT.size?(st.size===5?2:3):0,cur=[...RECENT].sort();const c=rot(cur,L.cp,nc);L.cp+=nc;
 const pool=W.filter(w=>!CURS.has(w.id)&&!RECENT.has(w.id)&&!GSKIP.has(w.id)).map(w=>w.id);if(!L.wq||!L.wq.length)L.wq=shuf(pool);
 const w=L.wq.splice(0,st.size-nc);
 const k=PARTS.indexOf(st.p);const pl=st.kind==='part'?new Set(PARTS.slice(0,k+1).map(p=>p.id)):null;
 const UNF=new Set((CURG.parts||[]).filter(p=>!pl||pl.has(p.id)).flatMap(p=>p.unflag||[]));
 const lead=`Это ${CURG.norev?'практикум (живые ситуации на пройденной грамматике; формулы этикета — только в ситуации, указанной в скобках русской фразы)':'урок по теме '+CURG.n} «${CURG.title}», этап «${st.kind==='part'?st.label+': '+st.p.title:st.label}». `+
  (st.kind==='mix'?'Половина фраз — на модели текущей темы, половина — повторение старых тем (по плану).':'Все фразы отрабатывают модели текущей темы из плана; другие пройденные темы — только как фон.');
 return {sl,prompt:mkGen({dir:s.dir,n:sl.length,sl,w,c,weak:'',lead,unflag:UNF,allowed:GTOP.filter(g=>g.n<CURG.n).map(g=>topicTxt(g)).join('\n')+'\n'+topicTxt(CURG,pl)})};}

/* --- Общий движок блоков --- */
function exById(sid){return Object.values(ST.grs||{}).find(x=>x.id===sid)||Object.values((ST.les&&ST.les.by)||{}).find(x=>x.id===sid);}
function EXA(){if(!exMode())return null;if(S.app==='rev')return GS();const L=LES();return L&&L.view==='ex'?LS():null;}
const exMax=s=>s.kind==='rev'?s.plan.length:1e9;
function exReq(s,i){if(s.kind==='rev'){const p=s.plan[i],wk=(p.wk||[]).map(id=>(DR.weak||[]).find(x=>x.id===id)).filter(Boolean).map(x=>'- '+x.task).join('\n');
  return {sl:p.sl,prompt:mkGen({dir:s.dir==='au'?'kr':s.dir,lead:s.dir==='au'?AULEAD:'',n:10,sl:p.sl,w:p.w.filter(id=>!CURS.has(id)),c:p.c.filter(id=>!CURS.has(id)),weak:wk,allowed:GTOP.map(g=>topicTxt(g)).join('\n')})};}
 return lesGen(s,i);}
function genBlock(s,i){if(!s||s.bl[i]||i>=exMax(s))return Promise.resolve();
 if(s.kind==='les'){const st=lesStatic(s,i);if(st){s.bl[i]=st;s.ans[i]=s.ans[i]||[];saveST();return Promise.resolve();}}
 if(OFF){const key=s.id+'|'+i,r=bankBlock(s,i);if(r&&r.length){delete GR.err[key];s.bl[i]=r;s.ans[i]=s.ans[i]||[];saveST();}
  else GR.err[key]=s.kind==='rev'?'В банке нет заданий для тем этого блока. Начни новую серию — в неё войдут только темы из банка.':'В банке нет заданий для этого этапа.';
  if(EXA()===s)setTimeout(exUpd);return Promise.resolve();}
 const key=s.id+'|'+i;if(GR.gen[key])return GR.gen[key].p;const sid=s.id;delete GR.err[key];
 const o={t0:Date.now()};GR.gen[key]=o;if(EXA()===s&&i===s.bi)exUpd();
 o.p=(async()=>{try{const sm=await SMP();if(!sm)throw {code:'no_sample'};const q=exReq(s,i);
   const r=await sm.json(q.prompt,{cache:false});if(exById(sid)!==s)return;s.bl[i]=valid(r,q.sl);s.ans[i]=s.ans[i]||[];saveST();
  }catch(e){if(exById(sid)===s)GR.err[key]=emsg(e);throw e;}
  finally{delete GR.gen[key];if(EXA()===s&&(i===s.bi||s.res[s.bi]))exUpd();}})();
 o.p.catch(()=>{});return o.p;}
/* --- Автономный режим: блоки из банка, проверка кодом --- */
function bankBlock(s,i){const u=new Set(s.used||[]);let r=null;
 if(s.kind==='rev'){const p=s.plan[i];r=p?BANK.rev(p.sl,u):null;}
 else{const st=LBY[s.stage];if(!st||!CURG)return null;
  if(st.kind==='part')r=BANK.part(CURG.id,st.p.id,i);
  else if(st.kind==='all')r=BANK.whole(CURG.id,u,8);
  else if(st.kind==='mix')r=BANK.mix(CURG.id,GTOP.filter(g=>g.n<CURG.n).map(g=>g.id),u);}
 s.used=[...u];return r;}
function offChk(s,i){exSave();const a=s.ans[i]||[];
 s.res[i]=s.bl[i].map((x,k)=>{const u=(a[k]||'').trim();
  if(!u||u==='-')return {v:'bad',fix:'',note:'',e:'empty'};
  if(s.dir==='kr')return {v:'unk',fix:'',note:'',e:''};
  const r=CHK.check(x,u);
  if(r.v==='unk')return {v:'unk',fix:r.best||'',note:'',e:'',dsp:1};
  return {v:r.v,fix:r.v==='bad'?(r.best||''):'',note:r.note||'',e:r.v==='bad'?r.kind:''};});
 s.res[i].forEach((r,k)=>{if(r.v!=='unk')grStat(s.bl[i][k].t,r.v!=='bad',1);});saveST();exUpd();}
function exSelf(k,v){const s=EXA();if(!s||!s.res[s.bi])return;const r=s.res[s.bi][k],x=s.bl[s.bi][k];if(!r||r.v!=='unk')return;
 r.v=v;r.man=1;if(v==='bad'){r.note='Отмечено вручную.';r.e='self';}
 grStat(x.t,v!=='bad',1);
 if(r.dsp&&s.dir!=='kr')(ST.disp=ST.disp||[]).push({ts:Date.now(),t:x.t,u:x.u||'',bid:x.bid||'',ru:x.ru,ko:x.ko,a:((s.ans[s.bi]||[])[k]||'').trim(),v});
 saveST();exUpd();}
function ruH(t){return esc(t).replace(/\((?:[^()]|\([^()]*\))*\)/g,m=>`<span class="ctx">${m}</span>`);}
function unkHTML(s,i,k,x,r,u,rk){const ref=rk?(r.fix||x.ko):x.ru;
 return `<div class="gi"><div class="gq sm${rk?'':' k'}"${rk?'':` data-say="${esc(x.ko)}"`}><span class="gk">${k+1}</span>${rk?ruH(x.ru):esc(x.ko)}</div>
 <div class="gv unk">${rk?markDiff(ref,u,'gdx'):esc(u)} <span class="gvt">${rk?'не распознано':'сверь сам'}</span></div>
 <div class="gref"${rk?` data-say="${esc(x.say||ref)}"`:''}>${rk?'Ближайший эталон: '+markDiff(u,ref):'Эталон: '+esc(ref)}</div>
 ${rk?`<div class="gunk">Автоматически не распознано. Если твой вариант тоже верен — засчитай.</div>`:''}
 <div class="gft"><span class="gtt">${GL(GBY[x.t])}</span><span><button class="chip gfl" data-a="gself" data-v="ok" data-k="${k}">${rk?'Засчитать':'Верно'}</button> <button class="chip gfl" data-a="gself" data-v="bad" data-k="${k}">${rk?'Моя ошибка':'Неверно'}</button></span></div></div>`;}
async function chkBlock(){const s=EXA();if(!s)return;const i=s.bi,sid=s.id,key=sid+'|c'+i;if(GR.ck[key]||!s.bl[i]||s.res[i])return;if(s.dir==='au'){exSave();return auChk(s,i);}
 if(OFF)return offChk(s,i);
 exSave();GR.ck[key]={t0:Date.now()};delete GR.err[key];exUpd();
 try{const sm=await SMP();if(!sm)throw {code:'no_sample'};
  const r=await sm.json(chkPrompt(s,i),{cache:false});
  if(exById(sid)!==s)return;if(!Array.isArray(r)||r.length<s.bl[i].length)throw {code:'invalid_json'};
  s.res[i]=s.bl[i].map((x,k)=>{const o=r[k]||{},u=((s.ans[i]||[])[k]||'').trim(),emp=!u||u==='-';const v=emp?'bad':(['ok','typo','bad'].includes(o.v)?o.v:'bad');
   return {v,fix:String(o.fix||''),note:v==='bad'?String(o.note||''):'',e:emp?'empty':String(o.e||'')};});
  s.res[i].forEach((r,k)=>grStat(s.bl[i][k].t,r.v!=='bad',1));saveST();
 }catch(e){if(exById(sid)===s)GR.err[key]=emsg(e);}
 finally{delete GR.ck[key];if(EXA()===s)exUpd();}}
async function exWhy(k){const s=EXA();if(!s)return;const i=s.bi,r=s.res[i]&&s.res[i][k],key=s.id+'|'+i+'|'+k;if(!r||r.why||GR.why[key])return;
 GR.why[key]=1;delete r.whyErr;exUpd();
 try{const sm=await SMP();if(!sm)throw {code:'no_sample'};const a=await sm(whyPrompt(s,i,k),{cache:false});r.why=String(a.text||'').trim();saveST();}
 catch(e){r.whyErr=emsg(e);}finally{delete GR.why[key];if(EXA()===s)exUpd();}}
function grStat(t,ok,d){GS();const x=ST.grstat[t]||(ST.grstat[t]=[0,0]);x[ok?0:1]+=d;}
function exFlip(k){const s=EXA(),r=s.res[s.bi][k],t=s.bl[s.bi][k].t,was=r.v!=='bad';
 r.v=was?'bad':'ok';r.man=1;if(r.v==='bad'&&!r.note)r.note='Отмечено вручную.';grStat(t,was,-1);grStat(t,!was,1);saveST();exUpd();}
function exSave(){const s=EXA();if(!s||!s.bl[s.bi]||s.res[s.bi]||!$('gcard'))return;const v=[...document.querySelectorAll('#gcard .gin')].map(x=>x.value);if(v.length)s.ans[s.bi]=v;saveST();}
function grCov(s){const ids=new Set(),ts=new Set();
 for(let i=0;i<s.plan.length;i++){const it=s.bl[i];if(!it||!s.res[i])continue;const m={};[...s.plan[i].w,...s.plan[i].c].forEach(id=>{if(BY[id])m[kn(BY[id].ko)]=id;});
  it.forEach(x=>{ts.add(x.t);x.w.forEach(k=>{const id=m[kn(k)];if(id)ids.add(id);});});}
 return {w:ids.size,t:ts.size};}
function markDiff(a,b,cl){const A=[...a],B=[...b],n=A.length,m=B.length,L=Array.from({length:n+1},()=>new Int16Array(m+1));
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=A[i]===B[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
 const keep=new Array(m).fill(false);let i=0,j=0;while(i<n&&j<m){if(A[i]===B[j]){keep[j]=true;i++;j++;}else if(L[i+1][j]>=L[i][j+1])i++;else j++;}
 let o='',on=false;B.forEach((c,k)=>{const L2=/[\p{L}\p{N}]/u.test(c),d=!keep[k]&&L2;if(d&&!on){o+=`<span class="${cl||'gdm'}">`;on=true;}if(!d&&on&&(L2||!c.trim()===false)){o+='</span>';on=false;}o+=esc(c);});return o+(on?'</span>':'');}
function fitTA(){document.querySelectorAll('#gcard textarea.gin').forEach(t=>{t.style.height='auto';t.style.height=t.scrollHeight+2+'px';});}
const tk=t0=>`<span id="gtk" data-t0="${t0}">${sec2(t0)}</span>`;
function blockHTML(s,title,foot){if(s.kind==='les'&&!s.bl[s.bi]){const x=lesStatic(s,s.bi);if(x){s.bl[s.bi]=x;s.ans[s.bi]=s.ans[s.bi]||[];saveST();}}
 const i=s.bi,it=s.bl[i],rs=s.res[i],rk=s.dir==='rk',gk=s.id+'|'+i,ck=s.id+'|c'+i,ge=GR.err[gk],gc=GR.ck[ck],ce=GR.err[ck];
 if(!it){const g=GR.gen[gk];if(!g&&!ge)setTimeout(()=>genBlock(s,i));
  return ge&&!g?`<div class="tres bad">${esc(ge)}</div><div class="tbtns">${OFF&&s.kind==='rev'?btn('gnewser','Новая серия',1):btn('ggen','Повторить',1)}</div>`
   :`<div class="tmeta">${title}</div><p class="gp">Составляю фразы… ${g?tk(g.t0):''}</p>`;}
 const nk=s.id+'|'+(i+1);
 if(i+1<exMax(s)&&!s.bl[i+1]&&!GR.gen[nk]&&!GR.pf[nk]){GR.pf[nk]=1;setTimeout(()=>genBlock(s,i+1));}
 const a=s.ans[i]||[];let h='';
 if(s.dir==='au')return auBlockHTML(s,it,rs,a,title,foot,gc,ce);
 if(!rs){h=`<div class="tmeta">${title} · ${rk?((GBY[it[0].t]||{}).task_rk||'переведи на греческий'):((GBY[it[0].t]||{}).task_kr||'переведи на русский')}</div>`+it.map((x,k)=>
   `<div class="gi"><div class="gq${rk?'':' k'}"${rk?'':` data-say="${esc(x.ko)}"`}><span class="gk">${k+1}</span>${rk?ruH(x.ru):esc(x.ko)}</div>
   <textarea class="gin" rows="1" data-k="${k}" lang="${rk?LANG.code:'ru'}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="${k<it.length-1?'next':'done'}"${gc?' disabled':''}>${esc(a[k]||'')}</textarea></div>`).join('');
  const n=it.filter((x,k)=>(a[k]||'').trim()).length;
  h+=ce?`<div class="tres bad">${esc(ce)}</div>`:'';
  h+=gc?`<p class="gp">Проверяю… ${tk(gc.t0)}</p>`:`<div class="tbtns"><button class="tb pri" data-a="gchk" id="gchk"${n<it.length?' disabled':''}>Проверить · ${n}/${it.length}</button></div><p class="hint">Не знаешь — поставь «-».</p>`;
  return h;}
 const ok=rs.filter(r=>r.v==='ok'||r.v==='typo').length,nu=rs.filter(r=>r.v==='unk').length;
 h=`<div class="tmeta">${title} · проверено</div><div class="tp">${ok} из ${rs.length}${nu?` · ждут решения: ${nu}`:''}</div>`+it.map((x,k)=>{const r=rs[k],u=(a[k]||'').trim(),bad=r.v==='bad';
  if(r.v==='unk')return unkHTML(s,i,k,x,r,u,rk);
  const ref=rk?x.ko:x.ru,fx=r.fix||ref,wk=s.id+'|'+i+'|'+k;
  return `<div class="gi"><div class="gq sm${rk?'':' k'}"${rk?'':` data-say="${esc(x.ko)}"`}><span class="gk">${k+1}</span>${rk?ruH(x.ru):esc(x.ko)}</div>
  <div class="gv ${bad?'bad':'ok'}">${bad&&rk&&u&&u!=='-'?markDiff(fx,u,'gdx'):esc(u||'—')} <span class="gvt">${bad?'ошибка':r.v==='typo'?'описка — засчитано':'верно'}</span></div>`+
  (bad?`<div class="gfix"${rk?` data-say="${esc(x.say||fx)}"`:''}>${rk&&u&&u!=='-'?markDiff(u,fx):esc(fx)}</div>${r.note?`<div class="gnote">${esc(r.note)}</div>`:''}${rk&&r.fix&&kn(ref)!==kn(fx)?`<div class="gref" data-say="${esc(ref)}">Можно и так: ${esc(ref)}</div>`:''}`
   :`<div class="gref"${rk?` data-say="${esc(x.say||ref)}"`:''}>Эталон: ${esc(rk?tplK(x):ref)}${rk?' ▶':''}</div>`)+
  (r.why?`<div class="gwhy">${txt(r.why)}</div>`:GR.why[wk]?`<p class="gnote">Объясняю…</p>`:r.whyErr?`<div class="gnote">${esc(r.whyErr)}</div>`:'')+
  `<div class="gft"><span class="gtt">${GL(GBY[x.t])}</span><span>${bad&&!OFF&&!r.why&&!GR.why[wk]?`<button class="chip gfl" data-a="gwhy" data-k="${k}">Почему?</button> `:''}<button class="chip gfl" data-a="gfl" data-k="${k}">${bad?'Засчитать':'Не засчитывать'}</button></span></div></div>`;}).join('');
 return h+foot;}
function tplK(x){const t=x.bid&&x.alt&&x.alt[0]&&x.alt[0].includes('(')?x.alt[0]:x.ko;return String(t).replace(/\[([^\]|]*)(\|[^\]]*)?\]/g,'$1');}
function exUpd(){if(!exMode()||!$('gcard'))return;clearInterval(GR.tick);GR.tick=null;
 const h=S.app==='rev'?revHTML():lesHTML();$('gcard').innerHTML=h;fitTA();
 if($('gtk'))GR.tick=setInterval(()=>{const e=$('gtk');if(e)e.textContent=sec2(+e.dataset.t0);else{clearInterval(GR.tick);GR.tick=null;}},1000);hh();}
function revHTML(){const s=GS();
 $('tdir').hidden=false;$('tdir').textContent=ST.grd==='kr'?'ГРЕ → РУС':ST.grd==='au'?'🔊 НА СЛУХ':'РУС → ГРЕ';if(ST.grd==='au')return auRevHTML(s);$('tcnt').textContent=s?'Блок '+(s.bi+1)+' / '+s.plan.length:'';
 if(s&&!s.plan.length)return '<p class="gp">Для этого направления пока нет пройденных тем. Переключи направление кнопкой выше.</p>';if(!s)return `<div class="tmeta">Грамматика тем 1–${GTOP.length?GTOP[GTOP.length-1].n:0} · весь словарь</div>
  <p class="gp">Серия — 10 блоков по 10 фраз. Каждая тема минимум дважды, слова — срезом по всему словарю, выражения текущей темы — в каждом блоке.</p>
  <p class="gp mut">${OFF?'Автономный режим: фразы — из банка, проверка — без Claude. Темы в банке: '+(GTOP.filter(g=>BANK.has(g.id)).map(g=>GL(g)).join(', ')||'пока нет'):'Фразы составляет и проверяет Claude. Первый запрос попросит разрешение; расход — из твоих лимитов. Следующий блок готовится, пока ты отвечаешь.'}</p>
  <div class="tbtns">${btn('gstart','Начать серию',1)}</div>`;
 const i=s.bi,last=i>=s.plan.length-1;let f='';
 if(s.res[i]){if(last){const c=grCov(s);f+=`<p class="tcov">Серия завершена. Охват: ${c.w} слов из ${W.length}, ${c.t} тем из ${GTOP.length}.</p>`;}
  const nx=!last&&!s.bl[i+1];f+=`<div class="tbtns">${btn('gnext',last?'Новая серия':(nx&&GR.gen[s.id+'|'+(i+1)]?'Следующий блок · готовится':'Следующий блок'),1)}</div>`;}
 return blockHTML(s,'Блок '+(i+1),f);}
function revNext(){const s=GS();exSave();
 if(s.bi>=s.plan.length-1){s.lastW=[...new Set(s.plan.flatMap(p=>p.w))];newSeries();}else{s.bi++;saveST();}scrollTo(0,0);exUpd();}

/* --- Урок: экраны --- */
function lesTheory(st){const g=CURG,p=st.p,k=PARTS.indexOf(p),nw=new Set(g['new']||[]),L=LES();
 let h=`<div class="tmeta">${GL(g)} · часть ${k+1} из ${PARTS.length}</div><div class="gtitle">${esc(p.title)}</div>`;
 if(p.intro)h+=gsec('Суть',txt(p.intro));
 const sch=(p.schema||[]).map(i=>(g.schema||[])[i]).filter(Boolean);if(sch.length)h+=gsec('Схема',sch.map(tbl).join(''));
 const ss=(g.sections||[]).filter(s=>(p.sections||[]).includes(s.id)),us=(g.usage||[]).filter(u=>(p.usage||[]).includes(u.id));
 for(const s of ss)h+=gsec(esc(s.title),txt(s.body)+exL(s.ex));
 if(us.length)h+=gsec('Употребление',useL(us,nw));
 const qa=(L.qa[p.id]||[]),qk=GR.qa[p.id];
 h+=gsec('Вопрос по теории',qa.map(x=>`<div class="gqa"><div class="gqq">${esc(x.q)}</div>${x.a?`<div class="gwhy">${txt(x.a)}</div>`:x.err?`<div class="gnote">${esc(x.err)}</div>`:''}</div>`).join('')+
  (qk?`<p class="gnote">Отвечаю…</p>`:`<textarea id="gqin" rows="3" placeholder="Напиши вопрос сюда — например: почему здесь 도, а не 는?"></textarea><div class="tbtns">${btn('gask','Отправить вопрос')}</div>`));
 h+=`<p><button class="rel" data-g="${esc(g.id)}">${g.norev?'Весь практикум':'Вся тема '+g.n} целиком</button></p><div class="tbtns">${btn('lex','К упражнениям',1)}</div>`;return h;}
async function lesAsk(){const L=LES(),st=LBY[L.stage],p=st.p,q=($('gqin').value||'').trim();if(!q||GR.qa[p.id])return;
 const arr=L.qa[p.id]||(L.qa[p.id]=[]),it={q};arr.push(it);GR.qa[p.id]=1;saveST();exUpd();
 const g=CURG,ss=(g.sections||[]).filter(s=>(p.sections||[]).includes(s.id)),us=(g.usage||[]).filter(u=>(p.usage||[]).includes(u.id));
 const ctx=ss.map(s=>s.title+'\n'+s.body+'\n'+(s.ex||[]).map(e=>e.ko+' — '+e.ru).join('\n')).join('\n\n')+'\n\n'+us.map(u=>u.sit+': '+u.phrase+(u.note?' — '+u.note:'')).join('\n');
 try{const sm=await SMP();if(!sm)throw {code:'no_sample'};
  const a=await sm(`Ученик учит корейский с нуля (A1), родной язык русский. Пройдено: ${passedTxt()}. Сейчас изучает: ${GL(g)} «${g.title}», часть «${p.title}».
Ответь по-русски на его вопрос по этой части: коротко и конкретно (до 8 предложений, без заголовков), с 1–3 примерами на знакомых словах. Не вводи конструкций из будущих тем; если вопрос о них — скажи, что это будет позже, одной фразой.

ТЕОРИЯ ЧАСТИ
${ctx}

ВОПРОС
${q}`,{cache:false});it.a=String(a.text||'').trim();}
 catch(e){it.err=emsg(e);}finally{delete GR.qa[p.id];saveST();if(exMode())exUpd();}}
/* «Открыть следующую тему» — на экране итога текущей темы (ученик решает сам; двойное нажатие) */
let CNX=0;
function courseNextHTML(){if(typeof COURSE!=='object'||!COURSE.on||COURSE.view)return '';
 const nx=COURSE.steps.slice(COURSE.idx+1).find(x=>COURSE.loaded(x));
 if(!nx)return `<p class="gp" style="color:var(--mut)">Следующая тема появится с новой версией приложения.</p>`;
 return `<div class="tbtns"><button class="tb ${CNX?'warn':'pri'}" data-cnext="1">${CNX?'Точно? Нажми ещё раз':'Тема пройдена — открыть следующую'}</button></div><p class="gp" style="color:var(--mut)">Дальше: ${esc(COURSE.title(nx))}</p>`;}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cnext]');if(!b)return;e.preventDefault();e.stopPropagation();
 if(!CNX){CNX=1;b.textContent='Точно? Нажми ещё раз';b.classList.remove('pri');b.classList.add('warn');setTimeout(()=>{if(CNX){CNX=0;if(b.isConnected){b.textContent='Тема пройдена — открыть следующую';b.classList.remove('warn');b.classList.add('pri');}}},4000);return;}
 CNX=0;const nx=COURSE.steps.slice(COURSE.idx+1).find(x=>COURSE.loaded(x));if(!nx)return;COURSE.setView(null);COURSE.set(nx.id);reloadApp();},true);
function lesSummary(){const L=LES(),rows=[],bad=[];
 for(const st of LSTG){if(st.kind==='end')continue;const s=L.by[st.id];if(!s)continue;let n=0,ok=0,tot=0;
  for(const i in s.res){n++;s.res[i].forEach((r,k)=>{tot++;if(r.v==='ok'||r.v==='typo')ok++;else if(r.v==='bad')bad.push({st,i:+i,x:(s.bl[i]&&s.bl[i][k])||{ru:'(текст задания не сохранён)',ko:'—',t:'',u:''},r,a:((s.ans[i]||[])[k]||'').trim(),s});});}
  if(n)rows.push(`${st.label}: ${n} бл., ${ok}/${tot}`);}
 const grp=(f)=>{const m={};bad.forEach(b=>{const k=f(b);if(!k)return;(m[k]=m[k]||{n:0,bl:new Set()}).n++;m[k].bl.add(b.st.id+b.i);});return m;};
 const byE=grp(b=>EN[b.r.e]||b.r.e||'другое'),byU=grp(b=>b.x.t===CURG.id&&b.x.u?b.x.u:'');
 const uName=u=>{const x=(CURG.usage||[]).find(y=>y.id===u);return x?`«${x.sit}» (${x.phrase})`:u;};
 const cand=[...Object.entries(byU).filter(([k,v])=>v.bl.size>=2).map(([k,v])=>`модель ${uName(k)} — ${v.n} ош. в ${v.bl.size} блоках`),
  ...Object.entries(byE).filter(([k,v])=>v.bl.size>=2).map(([k,v])=>`тип «${k}» — ${v.n} ош. в ${v.bl.size} блоках`)];
 const t=`ИТОГ ГРАММАТИКИ: ${GL(CURG)} «${CURG.title}»
Этапы: ${rows.join('; ')||'—'}
Ошибки по типам: ${Object.entries(byE).map(([k,v])=>`${k} — ${v.n}`).join('; ')||'нет'}
Ошибки:
${bad.map(b=>`- [${b.st.label}] ${b.s.dir==='rk'?b.x.ru:b.x.ko} → ${b.a||'—'} | верно: ${b.r.fix||(b.s.dir==='rk'?b.x.ko:b.x.ru)}${b.r.note?' | '+b.r.note:''}`).join('\n')||'—'}`;
 return `<div class="tmeta">${GL(CURG)} · итог</div><div class="gtitle">${esc(CURG.title)}</div>
 <p class="gp">Посмотри итог и ошибки. Чувствуешь себя уверенно — открывай следующую тему; если нет — вернись к этапам, где были ошибки.</p>
 <textarea id="gsum" readonly rows="12">${esc(t)}</textarea>${courseNextHTML()}<div class="tbtns">${btn('gcopy','Скопировать',0)}</div>`;}
function lesHTML(){const L=LES();$('tdir').hidden=true;
 if(!L){$('tst').hidden=true;$('tcnt').textContent='';return `<div class="empty">Текущей грамматической темы с частями нет.</div>`;}
 $('tst').hidden=false;
 $('tst').innerHTML=LSTG.map(x=>`<button class="chip${x.id===L.stage?' on':''}" data-ls="${x.id}">${esc(x.label)}</button>`).join('');
 {const o=$('tst').querySelector('.on');if(o&&o.scrollIntoView)o.scrollIntoView({inline:'nearest',block:'nearest'});}
 const st=LBY[L.stage],s=lesS(L.stage);$('tcnt').textContent=s&&L.view==='ex'?'Блок '+(s.bi+1):'';
 if(!L.started)return `<div class="tmeta">${GL(CURG)}</div><div class="gtitle">${esc(CURG.title)}</div>${txt(CURG.meaning)}
  <p class="gp">Этапы: ${PARTS.map((p,k)=>`часть ${k+1} «${esc(p.title)}»`).join(', ')} → вся тема${PREVG?' → смешанные РУС→ГРЕ'+(CURG.nokr?'':' → ГРЕ→РУС'):''} → итог.</p>
  <p class="gp mut">${OFF?'Автономный режим: упражнения — из банка, проверка — без Claude. «Почему?» и вопросы по теории недоступны.':'«Начать тему» ставит в очередь упражнения ко всем этапам. Готовые блоки сохраняются сразу; генерация идёт, пока страница открыта, и продолжается при следующем открытии.'}</p>
  <div class="tbtns">${btn('lstart','Начать тему',1)}</div>`;
 if(st.kind==='end')return lesSummary();
 if(st.kind==='part'&&L.view==='th')return lesTheory(st);
 const fi=LSTG.indexOf(st),nx=LSTG[fi+1];
 let f='';if(s.res[s.bi]){f=`<div class="tbtns">${btn('gnext','Ещё блок')}${nx?btn('lnext','Дальше: '+nx.label,1):''}</div>`;}
 const top=st.kind==='part'?`<div class="tbtns ltop">${btn('lth','Теория части')}</div>`:'';
 return top+blockHTML(s,(st.kind==='part'?st.label+' · ':st.label+' · ')+'блок '+(s.bi+1),f);}
function lesGo(id,view){const L=LES();exSave();L.stage=id;L.view=view||(LBY[id].kind==='part'?'th':'ex');lesS(id);saveST();scrollTo(0,0);exUpd();}
function lesPump(){const L=LES();if(!L||!L.started||GR.qrun)return;
 for(const st of LSTG){if(st.kind==='end')continue;const s=lesS(st.id);let ns=0;while(lesStatic(s,ns))ns++;
  const tgt=ns+st.extra;for(let i=0;i<tgt;i++){if(s.bl[i])continue;if(i<ns){genBlock(s,i);continue;}
   const key=s.id+'|'+i;if(GR.gen[key]||GR.qf[key])continue;
   GR.qrun=true;genBlock(s,i).catch(()=>{GR.qf[key]=1;}).finally(()=>{GR.qrun=false;setTimeout(lesPump,300);});return;}}}
function renderEX(){$('jump').innerHTML='';$('trainbars').hidden=false;$('tnx').hidden=true;
 if(S.app==='rev'){$('tst').hidden=true;$('tsp').textContent=TLOCAL?'Прогресс сохраняется только на этом устройстве':'Грамматика 1–'+(GTOP.length?GTOP[GTOP.length-1].n:0)+' · весь словарь';}
 else $('tsp').textContent=CURG?'Грамматика: '+GL(CURG).toLowerCase()+' · '+CURG.title:'Грамматика';
 if(!TREADY){$('list').innerHTML='<div class="empty">Загрузка…</div>';hh();return;}
 if(!$('gcard'))$('list').innerHTML='<div class="trn" id="gcard"></div>';
 exUpd();lesPump();}
$('tst').addEventListener('click',e=>{const b=e.target.closest('[data-ls]');if(b&&TREADY&&exMode())lesGo(b.dataset.ls);});
$('list').addEventListener('click',e=>{if(!$('gcard'))return;const b=e.target.closest('#gcard [data-a]');
 if(b){const a=b.dataset.a,s=EXA();
  if(a==='gstart'){GS();if(ST.grd==='au'&&!GAU().sel.length)return;newSeries();return exUpd();}
  if(a==='gaureset'){exSave();delete ST.grs.au;saveST();scrollTo(0,0);return exUpd();}
  if(a==='ggen'){if(s){GR.pf[s.id+'|'+s.bi]=0;genBlock(s,s.bi);}return;}
  if(a==='gchk')return chkBlock();
  if(a==='gnext'){if(S.app==='rev')return revNext();exSave();s.bi++;saveST();scrollTo(0,0);return exUpd();}
  if(a==='gfl')return exFlip(+b.dataset.k);
  if(a==='gself')return exSelf(+b.dataset.k,b.dataset.v);
  if(a==='gnewser'){newSeries();scrollTo(0,0);return exUpd();}
  if(a==='gwhy')return exWhy(+b.dataset.k);
  if(a==='lstart'){const L=LES();L.started=true;L.view='th';saveST();exUpd();return lesPump();}
  if(a==='lex')return lesGo(LES().stage,'ex');
  if(a==='lth')return lesGo(LES().stage,'th');
  if(a==='lnext'){const L=LES(),fi=LSTG.findIndex(x=>x.id===L.stage);return lesGo(LSTG[fi+1].id);}
  if(a==='gask')return lesAsk();
  if(a==='gcopy'){const t=$('gsum');t.select();try{navigator.clipboard.writeText(t.value).then(()=>{b.textContent='Скопировано';},()=>{b.textContent='Выдели и скопируй вручную';});}catch(x){b.textContent='Выдели и скопируй вручную';}return;}
  return;}
 const t=e.target.closest('#gcard [data-say]');if(t)say(t.dataset.say);});
$('list').addEventListener('input',e=>{const x=e.target.closest('#gcard .gin');if(!x)return;x.style.height='auto';x.style.height=x.scrollHeight+2+'px';const s=EXA();if(!s)return;
 (s.ans[s.bi]=s.ans[s.bi]||[])[+x.dataset.k]=x.value;const n=s.bl[s.bi].filter((q,k)=>(s.ans[s.bi][k]||'').trim()).length,c=$('gchk');
 if(c){c.disabled=n<s.bl[s.bi].length;c.textContent='Проверить · '+n+'/'+s.bl[s.bi].length;}});
$('list').addEventListener('change',e=>{if(e.target.closest('#gcard .gin'))saveST();});
$('list').addEventListener('keydown',e=>{const x=e.target.closest('#gcard .gin');if(!x||e.key!=='Enter')return;e.preventDefault();
 const n=document.querySelector(`#gcard .gin[data-k="${+x.dataset.k+1}"]`);if(n)n.focus();else{x.blur();const c=$('gchk');if(c&&!c.disabled)chkBlock();}});
function grDir(){if(!TREADY)return;exSave();GS();ST.grd=ST.grd==='rk'?'kr':ST.grd==='kr'?'au':'rk';saveST();scrollTo(0,0);$('list').innerHTML='';renderEX();}
$('rtab').onclick=e=>{const b=e.target.closest('button');if(!b)return;exSave();const k=tabKey();S[k]=b.dataset.v;try{LSX.setItem(k,S[k]);}catch(x){}
 tabHi();$('list').innerHTML='';render();scrollTo(0,0);};

/* ===== Повторение: числа, формы, слова на слух (движок X) ===== */
const XN=[['price','Цены'],['cnt','Счёт'],['age','Возраст'],['floor','Этажи'],['tel','Телефон']].concat((D.grammar||[]).some(g=>g.id==='g16')?[['time','Время'],['date','Даты']]:[]);
const XC=[['pres','настоящее'],['past','прошедшее'],['an','안 + настоящее'],['anp','안 + прошедшее'],['ji','-지 않아요'],['mot','못 + настоящее']].concat((D.grammar||[]).some(g=>g.id==='g20')?[['hp','합니다 · наст.'],['hpp','합니다 · прош.']]:[]).concat((D.grammar||[]).some(g=>g.id==='g22')?[['fut','-(으)ㄹ 거예요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g23')?[['want','-고 싶어요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g24')?[['ge','-(으)ㄹ게요'],['rae','-(으)ㄹ래요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g25')?[['se','-(으)세요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g26')?[['psi','-(으)ㅂ시다'],['kka','-(으)ㄹ까요?']]:[]).concat((D.grammar||[]).some(g=>g.id==='g27')?[['reo','-(으)러 가요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g28')?[['go','-고']]:[]).concat((D.grammar||[]).some(g=>g.id==='g29')?[['jm','-지만'],['jmp','прош. + 지만']]:[]).concat((D.grammar||[]).some(g=>g.id==='g30')?[['as','-아서/어서']]:[]).concat((D.grammar||[]).some(g=>g.id==='g31')?[['ni','-(으)니까']]:[]).concat((D.grammar||[]).some(g=>g.id==='g32')?[['my','-(으)면']]:[]).concat((D.grammar||[]).some(g=>g.id==='g34')?[['su','-(으)ㄹ 수 있어요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g35')?[['aya','-아야 돼요'],['bo','-아/어 보세요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g36')?[['ado','-아/어도 돼요'],['mya','-(으)면 안 돼요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g37')?[['gi','-고 있어요']]:[]).concat((D.grammar||[]).some(g=>g.id==='g39')?[['pt','опр. наст. (큰 / 먹는)'],['ptp','опр. прош. (먹은)']]:[]).concat((D.grammar||[]).some(g=>g.id==='g40')?[['ptf','опр. буд. (먹을)']]:[]).concat((D.grammar||[]).some(g=>g.id==='g41')?[['hu','-(으)ㄴ 후에'],['ki','-기 전에'],['ttae','-(으)ㄹ 때']]:[]);
const XDIR={nrk:'ЦИФРЫ → ГРЕ',nkr:'ГРЕ → ЦИФРЫ',nau:'🔊 НА СЛУХ',ckr:'ПО СЛОВАРНОЙ',crk:'ПО ПЕРЕВОДУ'};
function XS(){if(ST.xv!==1){ST.xv=1;ST.drs={};const o=ST.au||{};ST.au={st:(o.st&&typeof o.st==='object')?o.st:{},done:Array.isArray(o.done)?o.done:[],by:{},cur:null};}
 ST.drs=ST.drs||{};ST.nd=ST.nd||'nrk';ST.cd=ST.cd||'ckr';ST.drsel=ST.drsel||{};ST.drsel.n=ST.drsel.n||XN.map(x=>x[0]);ST.drsel.c=ST.drsel.c||XC.map(x=>x[0]);
 ST.drst=ST.drst||{};ST.cjst=ST.cjst||{};ST.au=ST.au||{st:{},done:[],by:{},cur:null};ST.au.by=ST.au.by||{};ST.au.st=ST.au.st||{};ST.au.done=ST.au.done||[];
 if(!XDIR[ST.nd]||ST.nd[0]!=='n')ST.nd='nrk';if(ST.cd!=='ckr'&&ST.cd!=='crk')ST.cd='ckr';
 for(const [g,L] of [['n',XN],['c',XC]]){const ks=L.map(x=>x[0]);let v=Array.isArray(ST.drsel[g])?ST.drsel[g].filter(k=>ks.includes(k)):[];ST.drsel[g]=v.length?v:ks;}
 for(const k in ST.drs){const x=ST.drs[k];if(!x||!Array.isArray(x.q)||!x.cur)delete ST.drs[k];}}
const xMode=()=>S.app==='rev'&&(S.rtab==='n'||S.rtab==='c'||(S.rtab==='w'&&ST.rd==='au'));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),one=a=>a[Math.floor(Math.random()*a.length)];
const hasB=s=>{const c=s.charCodeAt(s.length-1)-0xAC00;return c>=0&&c<11172&&c%28>0;};
const rateHTML=()=>`<div class="drate"><span>Скорость <b id="drv">${rate().toFixed(2)}</b></span><input type="range" id="drng" min="0.1" max="1.2" step="0.05" value="${rate()}"></div>`;
/* --- числа --- */
const SD=['','일','이','삼','사','오','육','칠','팔','구'];
function sino4(n){let o='';for(const [v,t] of [[1000,'천'],[100,'백'],[10,'십']]){const d=Math.floor(n/v)%10;if(d)o+=(d===1?'':SD[d])+t;}return o+SD[n%10];}
function sino(n){if(!n)return '영';const m=Math.floor(n/10000),r=n%10000;let o='';if(m)o+=(m===1?'':sino4(m))+'만';if(r)o+=(o?' ':'')+sino4(r);return o;}
const NT=['','열','스물','서른','마흔','쉰','예순','일흔','여든','아흔'],NO=['','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉'],NOC=['','한','두','세','네','다섯','여섯','일곱','여덟','아홉'];
function nat(n,c){if(c&&n===20)return '스무';return NT[Math.floor(n/10)]+(c?NOC:NO)[n%10];}
const NCNT={'개':['사과','가방','우산','계란','컵','접시','바나나','의자'],'명':['사람','학생','친구','아이'],'마리':['고양이','개'],'잔':['커피','물','주스','우유'],'권':['책','잡지']};
const kru=ko=>{const w=W.find(x=>x.ko===ko&&x.cat==='noun');return w?w.ru.split(/[;,(]/)[0].trim():ko;};
function numItem(cat,dir){let n,ko,dig,p,ph='',alt=[];
 if(cat==='price'){const r=Math.random();n=r<.2?rnd(1,9)*100:r<.45?rnd(10,99)*100:r<.7?rnd(10,99)*1000+(Math.random()<.3?500:0):r<.9?rnd(10,99)*10000:rnd(10,50)*100000;
  ko=sino(n)+' 원';dig=String(n);p=n.toLocaleString('en-US')+'원';}
 else if(cat==='cnt'){n=Math.random()<.6?rnd(1,10):rnd(11,99);const c=one(Object.keys(NCNT)),nn=one(NCNT[c]);ko=nn+' '+nat(n,1)+' '+c;alt=[nat(n,1)+' '+c];dig=String(n);
  p=kru(nn)+' × '+n;ph='с существительным или без';}
 else if(cat==='age'){n=rnd(1,99);ko=nat(n,1)+' 살';dig=String(n);p=n+' лет (возраст)';}
 else if(cat==='floor'){n=rnd(1,30);ko=sino(n)+' 층';dig=String(n);p=n+' этаж';}
 else if(cat==='time'){const hh=rnd(1,12),mm=one([0,0,30,30,rnd(1,59),rnd(1,11)*5]),p2=String(mm).padStart(2,'0');
  ko=nat(hh,1)+' 시'+(mm?' '+sino(mm)+' 분':'');if(mm===30)alt=[nat(hh,1)+' 시 반'];dig=String(hh)+p2;p=hh+':'+p2;ph='час — исконные, минуты — китайские';}
 else if(cat==='date'){const mo=rnd(1,12),dd=rnd(1,[31,28,31,30,31,30,31,31,30,31,30,31][mo-1]),MN=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  ko=(mo===6?'유월':mo===10?'시월':sino(mo)+'월')+' '+sino(dd)+' 일';dig=String(dd)+String(mo);p=dd+' '+MN[mo-1];ph='месяц, потом число; 6 — 유월, 10 — 시월';}
 else{const g=[String(rnd(1000,9999)),String(rnd(0,9999)).padStart(4,'0')],rd=s=>[...s].map(d=>d==='0'?'공':SD[+d]).join('');
  ko=['공일공',rd(g[0]),rd(g[1])].join(' ');dig='010'+g.join('');p='010-'+g.join('-');}
 const say=cat==='tel'?ko.split(' ').join(', '):ko,nm=XN.find(x=>x[0]===cat)[1];
 if(dir==='nrk')return {p,ph:ph||nm,a:[ko,...alt],m:'ko',sk:'n:'+cat,st:'drst',info:`<div class="tr2">${esc(p)}</div>`};
 const dh=cat==='time'?' (часы и минуты, напр. 3:30)':cat==='date'?' (число.месяц, напр. 5.10)':'';
 return {p:dir==='nkr'?ko:'',k:dir==='nkr',au:dir==='nau',say,ph:nm+' · запиши цифрами'+dh,a:[dig],m:'dig',sk:'n:'+cat,st:'drst',
  info:`<div class="tans" data-say="${esc(say)}">${esc(ko)}</div><div class="tr2">${esc(p)}</div>`};}
function numBlock(dir){const cs=ST.drsel.n.length?ST.drsel.n:XN.map(x=>x[0]);return Array.from({length:10},()=>numItem(one(cs),dir));}
/* --- формы --- */
const NONEG=new Set(['있다','없다','알다','모르다','아니다','맛있다','재미있다','재미없다','맛없다','잘하다','못하다']),BPU=new Set(((D.grammar||[]).some(g=>g.id==='g18')?[]:['새롭다','쉽다','어렵다','덥다','춥다','뜨겁다','차갑다','맵다','무겁다','가볍다','가깝다','귀엽다','아름답다','즐겁다','반갑다','고맙다','무섭다','시끄럽다','더럽다','돕다','굽다']).concat((D.grammar||[]).some(g=>g.id==='g19')?[]:['낫다','짓다']));
const CJW=()=>W.filter(w=>w.forms&&w.forms.pres&&!w.forms.pres.includes('/')&&w.ko!=='이다'&&w.ko!=='그렇다'&&!BPU.has(w.ko)&&!CURS.has(w.id));
function cjTypes(w){return ST.drsel.c.filter(t=>t==='pt'||t==='ttae'||((t==='hu'||t==='ki')&&w.cat==='verb'&&!/(있|없)다$/.test(w.ko))||(t==='ptf'&&w.cat==='verb'&&!/(있|없)다$/.test(w.ko))||(t==='ptp'&&w.cat==='verb'&&!/(있|없)다$/.test(w.ko))||(t==='as'&&!/에요$/.test(w.forms.pres||''))||t==='ni'||t==='my'||t==='pres'||t==='past'||t==='go'||t==='jm'||t==='jmp'||t==='hp'||t==='hpp'||t==='fut'||((t==='want'||t==='ge'||t==='rae'||t==='se'||t==='psi'||t==='kka'||(t==='reo'&&!REOX.has(w.ko))||t==='su'||((t==='gi'&&!['있다','없다','알다','모르다'].includes(w.ko))||(t==='aya'||t==='bo'||t==='ado'||t==='mya')&&!/에요$/.test(w.forms.pres||'')))&&w.cat==='verb')||(t!=='as'&&t!=='ni'&&t!=='my'&&t!=='su'&&t!=='aya'&&t!=='bo'&&t!=='ado'&&t!=='mya'&&t!=='gi'&&t!=='pt'&&t!=='ptp'&&t!=='ptf'&&t!=='hu'&&t!=='ki'&&t!=='ttae'&&t!=='want'&&t!=='ge'&&t!=='rae'&&t!=='se'&&t!=='psi'&&t!=='kka'&&t!=='reo'&&!NONEG.has(w.ko)&&(t!=='mot'||w.cat==='verb')));}
function hForm(w,p){if(p)return w.forms.past.slice(0,-2)+'습니다';const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28;
 if(t===0)return s.slice(0,-1)+String.fromCharCode(0xAC00+c+17)+'니다';if(t===8)return s.slice(0,-1)+String.fromCharCode(0xAC00+c-8+17)+'니다';return s+'습니다';}
function niForm(w){const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28,b=s.slice(0,-1),irr=!String(w.forms.pres||'').startsWith(s),C=n=>String.fromCharCode(0xAC00+n);
 if(t===0)return s+'니까';if(t===8)return b+C(c-8)+'니까';if(irr&&t===17)return b+C(c-17)+'우니까';if(irr&&t===7)return b+C(c+1)+'으니까';if(irr&&t===19)return b+C(c-19)+'으니까';return s+'으니까';}
function myForm(w){const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28,b=s.slice(0,-1),irr=!String(w.forms.pres||'').startsWith(s),C=n=>String.fromCharCode(0xAC00+n);
 if(t===0||t===8)return s+'면';if(irr&&t===17)return b+C(c-17)+'우면';if(irr&&t===7)return b+C(c+1)+'으면';if(irr&&t===19)return b+C(c-19)+'으면';return s+'으면';}
function ptForm(w,past){const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28,b=s.slice(0,-1),irr=!String(w.forms.pres||'').startsWith(s),C=n=>String.fromCharCode(0xAC00+n);
 if(/(있|없)$/.test(s))return s+'는';
 if(w.cat==='verb'&&!past)return t===8?b+C(c-8)+'는':s+'는';
 if(t===0)return b+C(c+4);if(t===8)return b+C(c-8+4);if(irr&&t===17)return b+C(c-17)+'운';if(irr&&t===7)return b+C(c+1)+'은';if(irr&&t===19)return b+C(c-19)+'은';return s+'은';}
function fForm(w){const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28,b=s.slice(0,-1),irr=!String(w.forms.pres||'').startsWith(s),C=n=>String.fromCharCode(0xAC00+n);
 if(t===0)return b+C(c+8);if(t===8)return s;if(irr&&t===17)return b+C(c-17)+'울';if(irr&&t===7)return b+C(c-7+8)+'을';if(irr&&t===19)return b+C(c-19)+'을';return s+'을';}
function seForm(w){const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28,b=s.slice(0,-1),irr=!String(w.forms.pres||'').startsWith(s),C=n=>String.fromCharCode(0xAC00+n);
 if(t===0)return s+'세요';if(t===8)return b+C(c-8)+'세요';if(irr&&t===17)return b+C(c-17)+'우세요';if(irr&&t===7)return b+C(c-7+8)+'으세요';if(irr&&t===19)return b+C(c-19)+'으세요';return s+'으세요';}
const REOX=new Set(['가다','오다','다니다','나가다','들어가다','들어오다']);
function reoForm(w){const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28,b=s.slice(0,-1),irr=!String(w.forms.pres||'').startsWith(s),C=n=>String.fromCharCode(0xAC00+n);
 if(t===0||t===8)return s+'러';if(irr&&t===17)return b+C(c-17)+'우러';if(irr&&t===7)return b+C(c-7+8)+'으러';if(irr&&t===19)return b+C(c-19)+'으러';return s+'으러';}
function psForm(w){const s=w.ko.slice(0,-1),l=s.slice(-1),c=l.charCodeAt(0)-0xAC00,t=c%28,b=s.slice(0,-1),irr=!String(w.forms.pres||'').startsWith(s),C=n=>String.fromCharCode(0xAC00+n);
 if(t===0)return b+C(c+17)+'시다';if(t===8)return b+C(c-8+17)+'시다';if(irr&&t===17)return b+C(c-17)+'웁시다';if(irr&&t===7)return b+C(c-7+8)+'읍시다';if(irr&&t===19)return b+C(c-19)+'읍시다';return s+'읍시다';}
function cjAns(w,t){const f=w.forms,h=w.ko.length>2&&w.ko.endsWith('하다'),nn=h?w.ko.slice(0,-2):'',ob=h?nn+(hasB(nn)?'을':'를'):'';
 if(t==='pres')return [f.pres];if(t==='past')return [f.past];if(t==='hp'||t==='hpp')return [hForm(w,t==='hpp')];if(t==='fut')return [fForm(w)+' 거예요'];if(t==='want')return [w.ko.slice(0,-1)+'고 싶어요'];if(t==='ge')return [fForm(w)+'게요'];if(t==='rae')return [fForm(w)+'래요'];if(t==='se')return [seForm(w)];if(t==='psi')return [psForm(w)];if(t==='kka')return [fForm(w)+'까요?'];if(t==='reo')return [reoForm(w)+' 가요'];if(t==='go')return [w.ko.slice(0,-1)+'고'];if(t==='jm')return [w.ko.slice(0,-1)+'지만'];if(t==='jmp')return [f.past.slice(0,-2)+'지만'];if(t==='as')return [f.pres.slice(0,-1)+'서'];if(t==='ni')return [niForm(w)];if(t==='my')return [myForm(w)];if(t==='su')return [fForm(w)+' 수 있어요'];if(t==='aya')return [f.pres.slice(0,-1)+'야 돼요',f.pres.slice(0,-1)+'야 해요'];if(t==='pt')return [ptForm(w,0)];if(t==='ptf')return [fForm(w)];if(t==='hu')return [ptForm(w,1)+' 후에'];if(t==='ki')return [w.ko.slice(0,-1)+'기 전에'];if(t==='ttae')return [fForm(w)+' 때'];if(t==='ptp')return [ptForm(w,1)];if(t==='gi')return [w.ko.slice(0,-1)+'고 있어요'];if(t==='ado')return [f.pres.slice(0,-1)+'도 돼요'];if(t==='mya')return [myForm(w)+' 안 돼요'];if(t==='bo')return [f.pres.slice(0,-1)+' 보세요',f.pres.slice(0,-1)+'보세요'];if(t==='ji')return [w.ko.slice(0,-1)+'지 않아요'];
 const neg=t==='mot'?'못':'안',v=t==='anp'?(h?'했어요':f.past):(h?'해요':f.pres);return h?[nn+' '+neg+' '+v,ob+' '+neg+' '+v]:[neg+' '+v];}
function cjBlock(dir){const pool=CJW().filter(w=>cjTypes(w).length),bad=pool.filter(w=>(ST.cjst[w.id]||[0,0])[1]>0),used=new Set(),out=[];
 for(let k=0;k<10&&used.size<pool.length;k++){let w,g=0;do{w=(bad.length&&Math.random()<.3)?one(bad):one(pool);g++;}while(used.has(w.id)&&g<50);if(used.has(w.id))continue;used.add(w.id);
  const t=one(cjTypes(w)),tl=XC.find(x=>x[0]===t)[1];
  out.push({p:(dir==='ckr'?w.ko:w.ru)+' · '+tl,k:false,ph:dir==='crk'?(CATN[w.cat]||''):'',a:cjAns(w,t),m:'ko',sk:w.id,st:'cjst',info:`<div class="tr2">${esc(w.ko)} — ${esc(w.ru)}</div>`});}
 return out;}
/* --- слова на слух: курс тем --- */
const ACAT=['pron','question','noun','time','adv','num','counter','answer','verb','adj','expr'];
const AUT=(()=>{let T=null;return ()=>{if(T)return T;const seen=new Set(),ok=w=>{if(w.ko==='이다'||BPU.has(w.ko)||CURS.has(w.id))return false;const k=kn(w.ko);if(seen.has(k))return false;seen.add(k);return true;};
 const base=W.filter(w=>w.block==='base'||w.block==='yesno'),ord=[...ACAT.flatMap(c=>base.filter(w=>w.cat===c)),...base.filter(w=>!ACAT.includes(w.cat))].filter(ok);
 T=[];const n=Math.ceil(ord.length/20),sz=Math.ceil(ord.length/n);
 for(let i=0;i<n;i++){const ws=ord.slice(i*sz,(i+1)*sz).map(w=>w.id);T.push({id:'b'+(i+1),label:'База '+(i+1),secs:chunk(ws,5),ws});}
 const nb=[...new Set(W.map(w=>w.block).filter(b=>typeof b==='number'&&!CURB.includes(b)))].sort((a,b)=>a-b);
 for(const g of chunk(nb,4)){const secs=g.map(b=>W.filter(w=>w.block===b).filter(ok).map(w=>w.id)).filter(x=>x.length);if(!secs.length)continue;
  T.push({id:'k'+g[0],label:'Блоки '+g[0]+(g.length>1?'–'+g[g.length-1]:''),secs,ws:secs.flat()});}
 return T;};})();
const auTh=id=>AUT().find(t=>t.id===id);
function auStages(t){const A=ST.au,s=t.secs.map((x,i)=>({id:'s'+i,label:'Раздел '+(i+1),kind:'sec',i}));s.push({id:'all',label:'Вся тема',kind:'all'});
 if(A.done.some(d=>d!==t.id&&auTh(d)))s.push({id:'mix',label:'Смешанные',kind:'mix'});s.push({id:'sum',label:'Итог',kind:'sum'});return s;}
function auForm(w,kind){const f=w.forms;if(!f)return w.ko;const v=Object.values(f).filter(x=>typeof x==='string'&&!x.includes('/'));
 if(!v.length)return w.ko;return kind==='sec'?(f.pres||v[0]):kind==='all'?(f.past||v[0]):one(v);}
function auItem(id,kind){const w=BY[id],f=auForm(w,kind),all=W.filter(x=>x.ko===w.ko);
 return {au:true,say:f,a:[f],m:'ko',sk:w.ko,st:'au',ph:'запиши по-гречески',info:(f!==w.ko?`<div class="tr2">${esc(w.ko)} — словарная форма</div>`:'')+`<div class="tr2">[${esc(w.tr)}]</div>`+all.map(x=>`<div class="tru">${esc(x.ru)}</div>`).join('')};}
function auSeries(t,st){if(st.kind==='sec')return [shuf(t.secs[st.i])];if(st.kind==='all')return chunk(shuf(t.ws),10);
 const A=ST.au,bad=id=>((A.st[BY[id].ko]||[0,0])[1]||0)>0,other=A.done.filter(d=>d!==t.id).map(auTh).filter(Boolean).flatMap(x=>x.ws).filter(id=>BY[id]);
 const own=[...t.ws.filter(bad),...shuf(t.ws.filter(id=>!bad(id)))],oth=[...shuf(other.filter(bad)),...shuf(other.filter(id=>!bad(id)))].slice(0,own.length);
 const ob=chunk(shuf(own),5),xb=chunk(oth,5);return ob.map((b,i)=>shuf([...b,...(xb[i]||[])]));}
/* --- сессии --- */
function xKey(){if(S.rtab==='n')return ST.nd;if(S.rtab==='c')return ST.cd;const A=ST.au;return A.cur?'a|'+A.cur+'|'+(A.by[A.cur]||{}).stage:null;}
function xSess(){XS();if(S.rtab==='n'||S.rtab==='c'){const k=xKey();if(!ST.drs[k])ST.drs[k]=xLoad({k,bn:0});return ST.drs[k];}
 const A=ST.au;if(!A.cur||!auTh(A.cur))return null;const b=A.by[A.cur]||(A.by[A.cur]={stage:'s0',s:{}}),t=auTh(A.cur),sts=auStages(t);if(!sts.some(x=>x.id===b.stage))b.stage=sts[0].id;
 if(b.stage==='sum')return {sum:1};if(!b.s[b.stage])b.s[b.stage]=xLoad({k:xKey(),bn:0,blocks:null,bi:-1});return b.s[b.stage];}
function xLoad(s){let it;const k=s.k;
 if(k[0]==='n')it=numBlock(k);else if(k[0]==='c')it=cjBlock(k);
 else{const [,tid,sid]=k.split('|'),t=auTh(tid),st=auStages(t).find(x=>x.id===sid);if(!s.blocks||s.bi>=s.blocks.length-1){s.blocks=auSeries(t,st);s.bi=-1;}s.bi++;it=s.blocks[s.bi].map(id=>auItem(id,st.kind));s.end=s.bi===s.blocks.length-1;s.kind=st.kind;}
 s.bn=(s.bn||0)+1;s.q=it.map((x,i)=>Object.assign({i},x));s.pos=0;s.res={};s.rep=0;s.ph='q';s.cur={st:'ask',v:''};return s;}
function xRec(it,r){if(it.rep)return;const T=it.st==='au'?ST.au.st:ST[it.st];const x=T[it.sk]||(T[it.sk]=[0,0]);x[r==='ok'?0:1]++;}
function xAdv(s){const it=s.q[s.pos];if(!it.rep){s.res[it.i]=s.cur.r;xRec(it,s.cur.r);}s.pos++;
 if(s.pos>=s.q.length&&!s.rep){s.rep=1;s.q.push(...s.q.filter(x=>!x.rep&&s.res[x.i]==='bad').map(x=>Object.assign({},x,{rep:1})));}
 if(s.pos>=s.q.length)s.ph='sum';else s.cur={st:'ask',v:''};saveST();}
const dn=s=>String(s||'').normalize('NFC').replace(/[.,!?~'’"“”…·:;()]/g,'').replace(/\s+/g,' ').trim();
function xCheck(){const s=xSess(),it=s&&s.q&&s.q[s.pos],c=s&&s.cur,ta=$('xa');if(!it||c.st!=='ask')return;const v=ta.value;
 if(it.m==='dig'){const d=v.replace(/\D/g,'');if(!d)return;c.v=v;c.ok=d===it.a[0]?1:0;}
 else{if(!kn(v))return;c.v=v;c.ok=it.a.some(a=>kn(a)===kn(v))?1:0;}
 c.r=c.ok?'ok':'bad';c.dk=0;c.st='shown';saveST();xUpd();}
function xAct(a){if(a==='xreset'){if(S.rtab==='w'){ST.au.cur=null;ST.au.by={};}else delete ST.drs[xKey()];saveST();return xUpd();}const s=xSess();if(!s)return;const c=s.cur;
 if(a==='chk')return xCheck();
 if(a==='next'){xAdv(s);return xUpd(true);}
 if(a==='dk'){c.st='shown';c.dk=1;c.ok=0;c.r='bad';c.v='';saveST();return xUpd();}
 if(a==='typo'){c.r=c.r==='ok'?'bad':'ok';saveST();return xUpd();}
 if(a==='nb'){if(s.k[0]==='a'&&s.end)s.blocks=null;xLoad(s);saveST();scrollTo(0,0);return xUpd(true);}
 if(a==='say'){const it=s.q[s.pos];unlockTTS();return say(it.say);}
 if(a==='themes'){ST.au.cur=null;saveST();return xUpd();}
 if(a==='nxst'){const A=ST.au,b=A.by[A.cur],sts=auStages(auTh(A.cur)),i=sts.findIndex(x=>x.id===b.stage);if(i<sts.length-1)return xStage(sts[i+1].id);}}
function xStage(id){const A=ST.au,b=A.by[A.cur];b.stage=id;if(id==='sum'&&!A.done.includes(A.cur))A.done.push(A.cur);saveST();scrollTo(0,0);xUpd(true);}
/* --- экран --- */
function xChips(){if(S.rtab==='n')return `<div class="dsit">`+XN.map(([k,n])=>`<button class="chip${ST.drsel.n.includes(k)?' on':''}" data-xs="n|${k}">${n}</button>`).join('')+'</div>';
 if(S.rtab==='c')return `<div class="dsit">`+XC.map(([k,n])=>`<button class="chip${ST.drsel.c.includes(k)?' on':''}" data-xs="c|${k}">${n}</button>`).join('')+'</div>';return '';}
function auListHTML(){const A=ST.au,T=AUT();
 return `<div class="tmeta">Слова на слух · курс тем</div><p class="gp">Звучит слово — запиши по-гречески. Глаголы и 형용사 звучат в спрягаемой форме: разделы — настоящее, «Вся тема» — прошедшее, смешанные — любая форма. Тема пройдена, когда открыт «Итог».</p>`+
  T.map(t=>{const st=t.ws.map(id=>A.st[BY[id].ko]||[0,0]),ok=st.reduce((a,x)=>a+x[0],0),bd=st.reduce((a,x)=>a+x[1],0);
   return `<div class="al" data-xt="${t.id}"><div class="asp">${A.done.includes(t.id)?'✓ пройдена':'не пройдена'}${ok+bd?` · верно ${ok}, ошибок ${bd}`:''}</div><div class="bme">${esc(t.label)} <span class="mut" style="font-size:18px">· ${t.ws.length} слов</span></div></div>`;}).join('');}
function auSumHTML(t){const A=ST.au,rows=t.ws.map(id=>[id,A.st[BY[id].ko]||[0,0]]),bad=rows.filter(r=>r[1][1]>0).sort((a,b)=>b[1][1]-a[1][1]);
 const ok=rows.reduce((a,r)=>a+r[1][0],0),bd=rows.reduce((a,r)=>a+r[1][1],0);
 return `<div class="tmeta">${esc(t.label)} · итог</div><div class="tp">верно ${ok} · ошибок ${bd}</div><p class="gp">Тема отмечена пройденной — её слова пойдут в «Смешанные» других тем.</p>`+
  (bad.length?`<div class="sh2">Слова с ошибками на слух</div>`+bad.map(([id,x])=>`<div class="sw"><span class="swk" data-say="${esc(BY[id].ko)}">${esc(BY[id].ko)}</span> <span class="mut">${esc(BY[id].ru)} · ошибок ${x[1]}</span></div>`).join(''):'<p class="gp">Ошибок нет.</p>')+
  `<div class="tbtns">${btn('themes','К списку тем',1)}</div>`;}
function xItemHTML(s){const it=s.q[s.pos],c=s.cur,ko=it.m==='ko';let h=`<div class="tmeta">${it.rep?'Повтор · ':''}${s.pos+1} / ${s.q.length}</div>`;
 if(it.au){h+=`<div class="tbtns">${btn('say','🔊 Слушать',1)}</div>`;if(!c.pl){c.pl=1;setTimeout(()=>{try{say(it.say);}catch(e){}},150);}}
 else h+=`<div class="tp${it.k?' k':''}"${it.k?` data-say="${esc(it.say||it.p)}"`:''}>${esc(it.p)}</div>`;
 h+=it.ph?`<div class="thint">${esc(it.ph)}</div>`:'';
 h+=`<input id="xa" class="${c.st==='ask'?'':(c.r==='bad'?'bad':'ok')}" lang="${ko?LANG.code:'en'}"${ko?'':' inputmode="numeric"'} autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" value="${esc(c.v||'')}">`;
 if(c.st==='ask')return h+`<div class="tbtns">${btn('chk','Проверить',1)}${btn('dk','Не знаю')}</div>`;
 const res=c.dk?'<div class="tres bad">Не знаю</div>':c.ok?'<div class="tres ok">Верно</div>':(c.r==='ok'?'<div class="tres ok">Опечатка — засчитано</div>':'<div class="tres bad">Ошибка</div>');
 h+=res+(ko?`<div class="tans" data-say="${esc(it.say||it.a[0])}">${esc(it.a[0])}</div>`+(it.a.length>1?`<div class="tr2">или: ${it.a.slice(1).map(esc).join(' · ')}</div>`:''):`<div class="tans">${esc(it.a[0].replace(/^010(\d{4})(\d{4})$/,'010-$1-$2'))}</div>`);
 if(ko&&!c.ok&&!c.dk){const b=it.a.slice().sort((p,q)=>Math.abs(kn(p).length-kn(c.v).length)-Math.abs(kn(q).length-kn(c.v).length))[0];h+=diffHTML(kn(c.v),kn(b));}
 h+=it.info||'';
 return h+`<div class="tbtns">${ko&&!c.dk&&!c.ok?btn('typo','Опечатка',0,c.r==='ok','g'):''}${btn('next','Дальше',1)}</div>`;}
function xSumHTML(s){const its=s.q.filter(x=>!x.rep),ok=its.filter(x=>s.res[x.i]==='ok').length,bd=its.filter(x=>s.res[x.i]==='bad');
 let h=`<div class="tmeta">Блок ${s.bn} завершён</div><div class="tp">${ok} из ${its.length}</div>`+
  (bd.length?`<div class="sh2">Ошибки</div>`+bd.map(x=>`<div class="sw"><span class="swk" data-say="${esc(x.say||x.a[0])}">${esc(x.a[0])}</span> <span class="mut">${esc(x.p||'')}</span></div>`).join(''):'');
 if(s.k[0]==='a'&&s.end){const A=ST.au,sts=auStages(auTh(A.cur)),i=sts.findIndex(x=>x.id===A.by[A.cur].stage);
  h+=`<p class="tcov">${s.kind==='sec'?'Раздел пройден':'Этап пройден'}.</p><div class="tbtns">${btn('nb','Ещё раз')}${i<sts.length-1?btn('nxst','Дальше: '+sts[i+1].label,1):''}</div>`;}
 else h+=`<div class="tbtns">${btn('nb','Следующий блок',1)}</div>`;return h;}
function xHTML(){XS();let h='';
 if(S.rtab==='w'){const A=ST.au;h+=rateHTML();if(!A.cur||!auTh(A.cur))return h+auListHTML();
  const t=auTh(A.cur),b=A.by[A.cur]||{},sts=auStages(t);
  h+=`<div class="thd"><div class="tmeta">${esc(t.label)}</div><button class="chip" data-x="themes">Темы</button></div><div class="dsit" style="margin-top:8px">`+
   sts.map(x=>`<button class="chip${x.id===b.stage?' on':''}" data-xg="${x.id}">${x.label}</button>`).join('')+'</div>';
  const s=xSess();if(s.sum)return h+auSumHTML(t);return h+(s.ph==='sum'?xSumHTML(s):xItemHTML(s));}
 const s=xSess();h+=xChips()+(ST.nd==='nau'&&S.rtab==='n'?rateHTML():'');return h+(s.ph==='sum'?xSumHTML(s):xItemHTML(s));}
function xUpd(focus){if(!xMode()||!$('xcard'))return;try{xUpd0(focus);}catch(e){$('xcard').innerHTML=`<div class="tres bad">Сбой: ${esc(e&&e.message||String(e))}</div><div class="tbtns">${btn('xreset','Сбросить этот режим',1)}</div>`;hh();}}
function xUpd0(focus){if(S.app==='rev')dsegUpd();const s=S.rtab==='w'?null:xSess();
 $('tdir').textContent=S.rtab==='w'?'🔊 НА СЛУХ':XDIR[xKey()];$('tcnt').textContent=s?'Блок '+s.bn:'';
 $('xcard').innerHTML=xHTML();const x=$('xa');if(x){const c=(xSess()||{}).cur;if(focus&&c&&c.st==='ask')x.focus();}hh();}
function renderX(){tabHi();$('jump').innerHTML='';$('trainbars').hidden=false;$('tdir').hidden=false;$('tst').hidden=true;$('tnx').hidden=true;
 $('tsp').textContent=TLOCAL?'Прогресс сохраняется только на этом устройстве':(S.rtab==='n'?'Числа: цены, счёт, возраст, этажи, телефон':S.rtab==='c'?'Формы глаголов и 형용사':'Весь словарь, кроме текущей темы');
 if(!TREADY){$('list').innerHTML='<div class="empty">Загрузка…</div>';hh();return;}
 if(!$('xcard'))$('list').innerHTML='<div class="trn" id="xcard"></div>';xUpd(false);}
function xDir(){XS();if(S.rtab==='n')ST.nd=ST.nd==='nrk'?'nkr':ST.nd==='nkr'?'nau':'nrk';else ST.cd=ST.cd==='ckr'?'crk':'ckr';saveST();xUpd(true);}
$('list').addEventListener('click',e=>{if(!$('xcard'))return;
 const xs=e.target.closest('#xcard [data-xs]');if(xs){const [g,k]=xs.dataset.xs.split('|'),L=ST.drsel[g],i=L.indexOf(k);if(i>=0){if(L.length>1)L.splice(i,1);}else L.push(k);
  for(const d of (g==='n'?['nrk','nkr','nau']:['ckr','crk'])){const s=ST.drs[d];if(s&&s.ph==='q'&&s.pos===0&&!s.rep&&s.cur.st==='ask'){ST.drs[d].bn--;xLoad(ST.drs[d]);}}saveST();return xUpd();}
 const xt=e.target.closest('#xcard [data-xt]');if(xt){ST.au.cur=xt.dataset.xt;saveST();scrollTo(0,0);return xUpd(true);}
 const xg=e.target.closest('#xcard [data-xg]');if(xg)return xStage(xg.dataset.xg);
 const th=e.target.closest('#xcard [data-x]');if(th)return xAct(th.dataset.x);
 const b=e.target.closest('#xcard [data-a]');if(b)return xAct(b.dataset.a);
 const t=e.target.closest('#xcard [data-say]');if(t)say(t.dataset.say);});
$('list').addEventListener('keydown',e=>{if(e.target.id!=='xa'||e.key!=='Enter')return;e.preventDefault();const s=xSess();if(!s||!s.cur)return;if(s.cur.st==='ask')setTimeout(xCheck,40);else xAct('next');});
$('list').addEventListener('input',e=>{if(e.target.id!=='xa')return;const s=xSess();if(s&&s.cur&&s.cur.st==='shown')e.target.value=s.cur.v||'';});

/* --- Грамматика на слух (диктант) --- */
const AULEAD='ДИКТАНТ НА СЛУХ: ученик слышит корейскую фразу (озвучка) и записывает её хангылем; ru — перевод для справки. Каждая фраза — одна короткая реплика, 3–8 слов, без двух реплик через тире и без пояснений в скобках. alt — другие верные записи той же фразы, если они возможны.';
function GAU(){if(!ST.grau||typeof ST.grau!=='object')ST.grau={};if(!Array.isArray(ST.grau.sel)||!ST.grau.sel.length)ST.grau.sel=GTOP.slice(0,3).map(g=>g.n);return ST.grau;}
function auRevHTML(s){const A=GAU();if(s&&!Array.isArray(s.plan)){delete ST.grs.au;s=null;}
 if(!s)return rateHTML()+`<div class="tmeta">Грамматика на слух · диктант</div><p class="gp">Звучит фраза — запиши её хангылем. Серия 10 блоков по 10 фраз по выбранным темам. Фразы составляет Claude, проверка — сразу, без запроса.</p>`+
  GTOP.map(g=>`<label class="gp" style="display:flex;gap:10px;align-items:center;font-size:20px"><input type="checkbox" data-gau="${g.n}"${A.sel.includes(g.n)?' checked':''} style="width:22px;height:22px;flex:none"> ${esc(GL(g))} · ${esc(g.title)}</label>`).join('')+
  `<div class="tbtns">${btn('gstart','Начать серию',1)}</div>`;
 const i=s.bi,last=i>=s.plan.length-1;let f='';
 if(s.res[i]){const nx=!last&&!s.bl[i+1];f+=`<div class="tbtns">${btn('gnext',last?'Новая серия':(nx&&GR.gen[s.id+'|'+(i+1)]?'Следующий блок · готовится':'Следующий блок'),1)}</div>`;}
 f+=`<div class="tbtns">${btn('gaureset','Сменить темы')}</div>`;
 return rateHTML()+`<p class="hint">Темы: ${A.sel.join(', ')}</p>`+blockHTML(s,'Блок '+(i+1),f);}
function auChk(s,i){const a=s.ans[i]||[];
 s.res[i]=s.bl[i].map((x,k)=>{const u=(a[k]||'').trim(),refs=[x.ko,...(x.alt||[])].flatMap(r=>/[()\[\]|]/.test(r)?CHK.expand(r):[r]);
  let v='bad';if(u&&u!=='-'){if(refs.some(r=>dn(r)===dn(u)))v='ok';else if(refs.some(r=>kn(r)===kn(u)))v='typo';}
  return {v,fix:'',note:v==='typo'?'Только пробелы.':'',e:''};});
 s.res[i].forEach((r,k)=>grStat(s.bl[i][k].t,r.v!=='bad',1));saveST();exUpd();}
function auBlockHTML(s,it,rs,a,title,foot,gc,ce){let h='';
 if(!rs){h=`<div class="tmeta">${title} · запиши услышанное</div>`+it.map((x,k)=>
   `<div class="gi"><div class="gq"><span class="gk">${k+1}</span><button class="chip" data-say="${esc(x.ko)}" style="font-size:18px;padding:8px 14px">🔊 Слушать</button></div>
   <textarea class="gin" rows="1" data-k="${k}" lang="${LANG.code}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="${k<it.length-1?'next':'done'}">${esc(a[k]||'')}</textarea></div>`).join('');
  const n=it.filter((x,k)=>(a[k]||'').trim()).length;
  return h+`<div class="tbtns"><button class="tb pri" data-a="gchk" id="gchk"${n<it.length?' disabled':''}>Проверить · ${n}/${it.length}</button></div><p class="hint">Не расслышал — поставь «-».</p>`;}
 const ok=rs.filter(r=>r.v!=='bad').length;
 h=`<div class="tmeta">${title} · проверено</div><div class="tp">${ok} из ${rs.length}</div>`+it.map((x,k)=>{const r=rs[k],u=(a[k]||'').trim(),bad=r.v==='bad';
  return `<div class="gi"><div class="gq sm"><span class="gk">${k+1}</span>${ruH(x.ru)}</div>
  <div class="gv ${bad?'bad':'ok'}">${bad&&u&&u!=='-'?markDiff(x.ko,u,'gdx'):esc(u||'—')} <span class="gvt">${bad?'ошибка':r.v==='typo'?'описка — засчитано':'верно'}</span></div>`+
  `<div class="gfix" data-say="${esc(x.ko)}">${bad&&u&&u!=='-'?markDiff(u,x.ko):esc(x.ko)} ▶</div>`+
  `<div class="gft"><span class="gtt">${GL(GBY[x.t])}</span><span><button class="chip gfl" data-a="gfl" data-k="${k}">${bad?'Засчитать':'Не засчитывать'}</button></span></div></div>`;}).join('');
 return h+foot;}
$('list').addEventListener('change',e=>{const c=e.target.closest('#gcard [data-gau]');if(!c)return;const A=GAU(),n=+c.dataset.gau,i=A.sel.indexOf(n);if(c.checked&&i<0)A.sel.push(n);if(!c.checked&&i>=0)A.sel.splice(i,1);A.sel.sort((a,b)=>a-b);saveST();});

/* --- Направление в «Повторении»: сегмент вместо переключателя по кругу --- */
const DSEG={w:[['rk','РУС→ГРЕ'],['kr','ГРЕ→РУС'],['au','🔊 На слух']],g:[['rk','РУС→ГРЕ'],['kr','ГРЕ→РУС'],['au','🔊 На слух']],
 n:[['nrk','Цифры→ГРЕ'],['nkr','ГРЕ→цифры'],['nau','🔊 На слух']],c:[['ckr','По словарной'],['crk','По переводу']]};
function dsegCur(){const t=S.rtab||'w';if(t==='w')return ST.rd||'rk';if(t==='g')return ST.grd||'rk';XS();return t==='n'?ST.nd:ST.cd;}
function dsegUpd(){const t=S.rtab||'w',L=DSEG[t]||DSEG.w,c=dsegCur();$('dseg').innerHTML=L.map(([k,n])=>`<button data-d="${k}" class="${k===c?'on':''}">${n}</button>`).join('');}
$('dseg').onclick=e=>{const b=e.target.closest('button');if(!b||!TREADY)return;const t=S.rtab||'w',v=b.dataset.d;if(v===dsegCur())return;
 if(t==='w')ST.rd=v;else if(t==='g'){exSave();GS();ST.grd=v;}else if(t==='n')ST.nd=v;else ST.cd=v;
 saveST();$('list').innerHTML='';scrollTo(0,0);render();};
/* ===== Диалог ===== */
const DSIT=[['any','Любая'],['meet','Знакомство'],['shop','Магазин'],['cafe','Кафе'],['plan','Договориться'],['num','Телефон и адрес'],['day','Разговор о дне'],['fam','Семья']];
const DSITD={meet:'знакомство: приветствие, имя, откуда, кем работает, возраст',shop:'покупка в магазине: есть ли товар, цена, сколько штук, «вот, пожалуйста», прощание',
 cafe:'заказ в кафе или ресторане: позвать официанта, заказать напитки и еду со счётными словами, «вкусно», прощание',plan:'договориться с другом или коллегой о встрече или совместном деле: 해요 как предложение («пойдём»), согласие 좋아요, «понял» 알았어요, отказ 못',
 num:'обмен телефонами, на каком этаже, номер комнаты; адрес — только спросить или попросить записать (주소가 뭐예요?, 여기에 써요), не диктовать: настоящий корейский адрес пройденной лексикой не выразить',day:'разговор знакомых о том, что делал вчера, что делаешь сегодня, куда идёшь',fam:'разговор о семье: кто есть в семье, сколько лет, кем работают, где живут и что делают'};
const DTIER='default';
const DG={tick:null,ul:0};
function DS(){const d=ST.dlg||(ST.dlg={});d.sit=d.sit||'any';if(d.tab!=='vo')d.tab='tr';if(d.auto==null)d.auto=1;if(d.talk)delete d.talk;if(d.au)delete d.au;return d;}
const rate=()=>+ST.rate||0.8;
function unlockTTS(){try{if(window.speechSynthesis&&!DG.ul){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);DG.ul=1;}}catch(e){}}
function dSitPick(){const d=DS();if(d.sit!=='any')return d.sit;const ks=DSIT.map(x=>x[0]).filter(k=>k!=='any'&&k!==d.lastSit);const k=ks[Math.floor(Math.random()*ks.length)];d.lastSit=k;return k;}
function dUnflag(){const u=new Set();if(CURG&&CURG.parts)for(const p of CURG.parts)for(const f of (p.unflag||[]))u.add(f);return u;}
function dForbid(uf){return uf.has('g2:u9')?FORBID.replace("누가 и 뭐가 (вопрос «кто? / что?» в роли подлежащего: 누가 왔어요?, 뭐가 있어요?) — не пройдено; из вопросительных как подлежащее — нельзя, 누구 только в 누구예요? и как дополнение; ",''):FORBID;}
function dRules(){const uf=dUnflag();
 const allowed=GTOP.map(g=>topicTxt(g)).concat(CURG?[topicTxt(CURG)]:[]).join('\n');
 return `Ученик учит корейский с нуля (уровень A1, TOPIK 1), родной язык русский. Ученик — мужчина.
ОГРАНИЧЕНИЯ ДЛЯ ВСЕХ ГРЕЕЙСКИХ РЕПЛИК
1. Грамматика — только из списка «ПРОЙДЕНО». Прямо запрещено: ${dForbid(uf)}
2. Запрещены модели «не отработано»: ${flagTxt(uf)||'—'}.
3. Лексика — только слова из «СЛОВАРЯ» и их формы по пройденной грамматике. Исключение: 러시아 (Россия). Имена — только 민수 (мужчина) и 지민 (женщина); если собеседник назван по имени, в описании сцены, роли и репликах имя одно и то же.
4. Стиль 해요. Этикетные формулы из словаря — целиком, без изменения формы, только в подходящий момент. 반말-формулы (안녕, 고마워, 미안해) не используй: разговор ведётся на 해요, приветствие — 안녕하세요.
5. Реплики короткие, как в настоящем разговоре, а не как в учебнике: 1–2 простых предложения. Общепринятые разговорные упрощения разрешены и предпочтительны там, где носители так чаще говорят: опущенные 저는/тема, выпадение 이/가 и 을/를, 어디 가요? без 에, ответ-обрывок без связки (число, существительное: 오 층, 커피), N(이)요 для обрывка (칠팔구공이요, 커피요), дефис в номере как 에. Полную учебную форму используй, только если в такой ситуации она естественнее.

ПРОЙДЕНО
${allowed}

СЛОВАРЬ
${vocTxt()}`;}
/* --- Переписка (tr) и Разговор (vo): диалог по репликам --- */
const TRGM={tr:{gen:0,err:null,busy:0,cerr:null,draft:''},vo:{gen:0,err:null,busy:0,cerr:null,draft:''}};
const dm=m=>m||(DS().tab==='vo'?'vo':'tr');
function TRS(m){m=dm(m);const d=DS();const t=d[m]||(d[m]={});t.q=t.q||[];if(t.n==null)t.n=0;return t;}
function trPrompt(k,m){const T=TRS(m),seen=[...(T.cur?[T.cur]:[]),...T.q].map(x=>x.scene).filter(Boolean).slice(0,6);
 return `Составь связный диалог на корейском для упражнения «перевод по репликам».
Ситуация: ${DSITD[k]}.
Два участника: собеседник (роль "p") и ученик (роль "me", говорит от своего лица). Ученик переводит реплики собеседника с греческого на русский, а свои реплики — с русского на греческий.
Диалог 8–12 реплик, логичный и последовательный: каждая реплика отвечает на предыдущую или естественно продолжает разговор, есть начало и завершение. Реплики чередуются; начать может любой.${seen.length?'\nНе повторяй сюжеты: '+seen.join('; '):''}

ТРЕБОВАНИЯ К РЕПЛИКАМ УЧЕНИКА ("me")
- Поле ru — естественная русская фраза, которая однозначно ведёт к корейскому эталону на пройденной грамматике: контраст 은/는 — через «а», 도 — «тоже / и», 만 — «только», 못 — «не могу / не смог», 안 — «не».
- Пояснения — только в скобках в поле ru: ситуация, к кому обращается, пол для 형/누나/오빠/언니, омоним. Коротко, не больше 8 слов, и НЕ повторяй в скобках то, что сказано в самой фразе. Текст в скобках не переводится и в эталон не входит. Никаких корейских слов и подсказок в ru.\n- Каждая реплика — то, что реально говорят в такой ситуации. Не калькируй русское: если мысль нельзя естественно сказать пройденной лексикой, выбери другую реплику.
- ko — эталон в том виде, как это чаще всего сказали бы в живом разговоре (с разговорными упрощениями, если они там обычны); alt — другие верные варианты, обязательно включая полную учебную форму, если эталон упрощён.
ПОЯСНЕНИЕ tip (для реплик обоих участников): если корейская реплика отличается от полной учебной формы разговорным упрощением, в tip одно-два коротких предложения по-русски: полная форма, что опущено или изменено и почему в разговоре так говорят. Ученик учится именно этому. Если упрощений нет — "".
ТРЕБОВАНИЯ К РЕПЛИКАМ СОБЕСЕДНИКА ("p"): ko — реплика, ru — точный естественный перевод.
Если у собеседника есть имя, оно одно и то же в scene, partner и репликах; 민수 — мужчина, 지민 — женщина.

${dRules()}

ФОРМАТ — только JSON без пояснений:
{"scene":"1–2 предложения по-русски: где, кто собеседник, кто ученик","partner":"роль собеседника по-русски, 1–3 слова","lines":[{"s":"p","ko":"…","ru":"…","tip":""},{"s":"me","ru":"… (пояснение)","ko":"…","alt":["…"],"tip":""}]}`;}
function trValid(r,k){if(!r||!Array.isArray(r.lines))throw {code:'invalid_json'};
 const lines=r.lines.filter(x=>x&&typeof x.ko==='string'&&x.ko.trim()&&typeof x.ru==='string'&&x.ru.trim()).map(x=>({s:x.s==='me'?'me':'p',ko:x.ko.trim(),ru:x.ru.trim(),alt:Array.isArray(x.alt)?x.alt.filter(a=>typeof a==='string'&&a.trim()):[],tip:typeof x.tip==='string'?x.tip.trim():''}));
 if(lines.length<4)throw {code:'invalid_json'};
 return {id:Date.now()+Math.random(),sit:k,scene:String(r.scene||'').trim(),partner:String(r.partner||'').trim(),lines,i:0,res:{}};}
/* --- Готовые диалоги (автономный режим): D.dlg, открываются по курсу (after = номер грамматической темы) --- */
function dPool(k){const av=new Set(GTOP.map(g=>g.id).concat(CURG?[CURG.id]:[]));return (D.dlg||[]).filter(x=>av.has('g'+x.after)&&(k==='any'||x.sit===k));}
function trFillOff(m){const TRG=TRGM[m],T=TRS(m),k=DS().sit;TRG.err=null;const P=dPool(k);
 if(!P.length){TRG.err=k==='any'?'Готовых диалогов на пройденном материале пока нет.':'В этой ситуации пока нет диалогов на пройденном материале — выбери другую или «Любая».';T.want=0;return trUpd(0,m);}
 const busy=new Set([T.cur&&T.cur.bid].filter(Boolean));let seen=T.seen||(T.seen=[]);
 let F=P.filter(x=>!seen.includes(x.id)&&!busy.has(x.id));
 if(!F.length){T.seen=seen=seen.filter(id=>!P.some(x=>x.id===id));F=P.filter(x=>!busy.has(x.id));if(!F.length)F=P;}
 const x=F[Math.floor(Math.random()*F.length)];seen.push(x.id);
 T.q.push({id:Date.now()+Math.random(),bid:x.id,sit:x.sit,scene:x.scene,partner:x.partner,i:0,res:{},
  lines:x.lines.map(L=>({s:L.s,ko:L.s==='me'?BANK.show(L.ko):L.ko,tpl:L.ko,ru:L.ru,alt:L.alt||[],traps:L.traps||[],tip:L.tip||''}))});saveST();
 if(!T.cur&&T.want){T.want=0;trTake(m);}else trUpd(0,m);}
function trCheckOff(c,k,txt,m){const L=c.lines[k];
 if(L.s!=='me'){c.res[k]={t:txt,v:'self',fix:'',note:'',tip:''};return trAdv(m);}
 const r=CHK.check({ru:L.ru,ko:L.tpl||L.ko,alt:L.alt||[],traps:L.traps||[],u:''},txt);
 if(r.v==='unk')c.res[k]={t:txt,v:'bad',unk:1,fix:'',note:'Не распознано. Сравни с эталоном: если твой вариант верный — «Засчитать» (ответ попадёт в «Спорные»).',tip:''};
 else c.res[k]={t:txt,v:r.v,fix:r.v==='ok'?'':(r.best||''),note:r.note||'',tip:''};
 return trAdv(m);}
async function trFill(m){m=dm(m);const TRG=TRGM[m],T=TRS(m);if(TRG.gen||T.q.length>=1)return;if(OFF)return trFillOff(m);TRG.gen=Date.now();TRG.err=null;trUpd();
 try{const sm=await SMP();if(!sm)throw {code:'no_sample'};const k=dSitPick();
  const r=await sm.json(trPrompt(k,m),{cache:false,modelTier:DTIER});T.q.push(trValid(r,k));saveST();
 }catch(e){TRG.err=emsg(e);}finally{TRG.gen=0;if(!T.cur&&T.q.length&&T.want){T.want=0;trTake(m);}else trUpd(0,m);}}
function trTake(m){m=dm(m);const TRG=TRGM[m],T=TRS(m);const c=T.q.shift();if(!c){T.want=1;saveST();return trFill(m);}T.cur=c;TRG.draft='';TRG.cerr=null;if(DS().tab===m&&$('din'))$('din').value='';saveST();trUpd(true,m);trAuto(m);trFill(m);}
function trNew(){unlockTTS();const m=dm(),T=TRS(m);if(T.cur&&T.cur.i>=T.cur.lines.length)T.n++;T.cur=null;trTake(m);}
function trAuto(m){m=dm(m);if(m!=='tr'||DS().tab!==m)return;const c=TRS(m).cur;if(c&&DS().auto){const L=c.lines[c.i];if(L&&L.s==='p')say(L.ko);}}
function trChkPrompt(c,k,a){const L=c.lines[k],rk=L.s==='me';
 const ctx=c.lines.slice(0,k).map(x=>(x.s==='p'?'Собеседник: ':'Ученик: ')+x.ko+' ('+x.ru+')').join('\n');
 return `Проверь перевод реплики в диалоге (ученик учит корейский, уровень A1, родной язык русский).
Ситуация: ${c.scene}
${ctx?'Предыдущие реплики:\n'+ctx+'\n':''}
Задание — ${rk?'перевести свою реплику с русского на греческий':'перевести реплику собеседника с греческого на русский'}: ${rk?L.ru:L.ko}
Эталон: ${rk?L.ko:L.ru}${rk&&L.alt.length?' | Допустимо: '+L.alt.join(' / '):''}
Ответ ученика: ${a}

${rk?`Оценки:
- "ok" — верно. Засчитывай любой грамматически правильный вариант, передающий смысл: другой порядок слов, синоним, 뭐 ↔ 무엇, 하고 ↔ 와/과, и полную учебную форму, и общепринятые разговорные упрощения (опущенные 저는/тема, выпадение 이/가 и 을/를, 어디 가요? без 에, ответ-обрывок без связки (число, существительное: 오 층, 커피), N(이)요 для обрывка (칠팔구공이요, 커피요), дефис в номере как 에). Упрощение, нормальное для живой речи, — НЕ ошибка и не повод для fix или note. Буквального совпадения с эталоном не требуй. Верный корейский за пределами пройденного (слово или форма, которых ученик ещё не учил, но употреблённые правильно и уместно: 호 для номера комнаты, 제 вместо 저의 и т.п.) — это \"ok\", а не ошибка; в tip можно отметить, что так тоже говорят. Эталон — не единственный правильный ответ. Не заменяй в fix допустимое на эталонное (은/는 ↔ 이/가, где уместны оба, порядок слов, синонимы). Пунктуация и пробелы — не ошибка. Текст в скобках в задании не переводится.
- "typo" — случайная описка (не та буква), грамматика и слово явно верные. Запись по произношению (머거요, 이써요) — не описка, а "bad".
- "bad" — ошибка частицы (в т.ч. 에/에서 перед 도/만, 은/는 ↔ 이/가 там, где нужен контраст или новое), формы, времени, связки, 에 ↔ 에서, не то слово, не тот уровень вежливости, потерян смысл («а», «тоже», «только», «не могу»).`:`Оценки:
- "ok" — смысл передан верно в контексте диалога; порядок слов, синонимы, стиль русского перевода и опечатки в русском не важны. Имена в любой кириллической передаче — не ошибка.
- "typo" — не используется.
- "bad" — неверно понято слово, время, отрицание, «тоже/только/не могу», вопрос/утверждение, кто что делает.`}

Ответ — только JSON: {"v":"ok|typo|bad","fix":"${rk?'ответ ученика, где исправлены ТОЛЬКО ошибки; всё допустимое оставь как у ученика':'верный перевод'}","note":"только для bad: одно короткое предложение по-русски, в чём ошибка; иначе пустая строка"${rk?',\"tip\": если ответ верный, но в живом разговоре носитель в этой ситуации обычно сказал бы иначе (короче или естественнее) — «как говорят: <вариант>» и одно короткое предложение по-русски, что упрощено и почему так говорят; иначе \"\"':''}}`;}
async function trCheck(txt){const m=dm(),TRG=TRGM[m],T=TRS(m),c=T.cur;txt=(txt||'').trim();if(!c||!txt||TRG.busy||c.i>=c.lines.length)return;unlockTTS();
 const k=c.i;TRG.draft=txt;
 if(txt==='-'){c.res[k]={t:'-',v:'skip',fix:'',note:''};return trAdv(m);}
 if(c.bid)return trCheckOff(c,k,txt,m);
 TRG.busy=Date.now();TRG.cerr=null;trUpd(0,m);const id=c.id;
 try{const sm=await SMP();if(!sm)throw {code:'no_sample'};const r=await sm.json(trChkPrompt(c,k,txt),{cache:false,modelTier:DTIER});
  if(!TRS(m).cur||TRS(m).cur.id!==id)return;const v=['ok','typo','bad'].includes(r&&r.v)?r.v:'bad';
  c.res[k]={t:txt,v,fix:v==='ok'?'':String(r.fix||'').trim(),note:v==='bad'?String(r.note||'').trim():'',tip:v!=='bad'?String(r.tip||'').trim():''};TRG.busy=0;trAdv(m);
 }catch(e){TRG.cerr=emsg(e);}finally{TRG.busy=0;trUpd(true,m);}}
function trAdv(m){const TRG=TRGM[m],c=TRS(m).cur;c.i++;TRG.draft='';if(DS().tab===m&&$('din'))$('din').value='';saveST();trUpd(true,m);trAuto(m);}
function trFlip(k){const c=TRS().cur,r=c&&c.res[k];if(!r||r.v==='skip'||r.v==='self')return;r.v=r.v==='bad'?'ok':'bad';
 if(r.unk&&c.bid){const L=c.lines[k];(ST.disp=ST.disp||[]).push({ts:Date.now(),t:'dlg',u:c.bid+':'+k,bid:c.bid,ru:L.ru,ko:L.tpl||L.ko,a:r.t,v:r.v});r.unk=0;}
 saveST();trUpd();}
function trHTML(){const d=DS(),m=dm(),VO=m==='vo',TRG=TRGM[m],T=TRS(m),c=T.cur;let h=sitHTML();
 h+=`<div class="tbtns ltop"><button class="tb" data-d="rnew">Новый диалог</button>`+(VO?'':`<button class="tb${d.auto?' on g':''}" data-d="auto">🔊 Авто${d.auto?': вкл':': выкл'}</button>`)+`</div>`;
 if(VO)h+=`<div class="drate"><span>Скорость <b id="drv">${rate().toFixed(2)}</b></span><input type="range" id="drng" min="0.1" max="1.2" step="0.05" value="${rate()}"></div>`;
 if(!c){if((T.want||TRG.gen)&&!TRG.err)h+=`<div class="dsc">Готовлю диалог… <span id="dtk" data-t0="${TRG.gen||Date.now()}">${sec2(TRG.gen||Date.now())}</span></div>`;
  else h+=`<div class="dsc">${VO?'Живой разговор: реплики собеседника только слышишь (кнопка «Слушать», сколько угодно раз) и пишешь перевод на русский; свои реплики получаешь по-русски и переводишь на греческий. Текст реплики собеседника открывается после ответа.':'Переписка: реплики собеседника видишь текстом и переводишь с греческого на русский, свои — с русского на греческий.'} ${OFF?'Свои реплики проверяются автоматически, реплики собеседника — сам, по эталону.':'Каждый перевод проверяется.'} «Не знаю» или «-» — показать эталон.</div><div class="tbtns"><button class="tb pri" data-d="rnew">Начать</button></div>`;
  if(TRG.err)h+=`<div class="dsc" style="color:var(--weak)">${esc(TRG.err)}</div><div class="tbtns"><button class="tb" data-d="rretry">Повторить</button></div>`;
  return h;}
 const nm=(DSIT.find(x=>x[0]===c.sit)||['',''])[1];
 h+=`<div class="dsc"><b>${esc(nm)}</b> · ${esc(c.scene)}</div>`;
 for(let k=0;k<=Math.min(c.i,c.lines.length-1);k++){const L=c.lines[k],r=c.res[k],me=L.s==='me',cur=k===c.i;
  h+=`<div class="bub${me?' me':''}"><div class="bwho">${me?'Ты':esc(c.partner||'Собеседник')} · ${me?'рус → кор':'кор → рус'}</div>`+
   (me?`<div class="bme">${esc(L.ru)}</div>`:(VO&&!r?`<button class="tb pri dlis" data-dsay="${esc(L.ko)}">🔊 Слушать</button>`:`<div class="bko" data-dsay="${esc(L.ko)}">${esc(L.ko)} <span class="bsp">▶</span></div>`));
  if(r){const v=DVN[r.v];
   h+=`<div class="bnote" style="margin-top:8px">Твой ответ${v?` · <span class="gv ${v[1]}" style="font-size:inherit">${v[0]}</span>`:''}</div><div class="${me?'bme':'bru'}" style="color:var(--fg)">${esc(r.t==='-'?'— (не знаю)':r.t)}</div>`+
    (r.fix?`<div class="bfix"${me?` data-dsay="${esc(r.fix)}"`:''}>→ ${esc(r.fix)}</div>`:'')+(r.note?`<div class="bnote">${esc(r.note)}</div>`:'')+
    (me?`<div class="bfix" style="color:var(--mut)" data-dsay="${esc(L.ko)}">Эталон: ${esc(L.ko)} ▶</div>`:`<div class="bru">Эталон: ${esc(L.ru)}</div>`)+
    (r.tip?`<div class="btip">${esc(r.tip)}</div>`:'')+(L.tip?`<div class="btip"><b>Живая речь:</b> ${esc(L.tip)}</div>`:'')+
    (r.v==='self'?`<div class="tbtns"><button class="chip dtr" data-d="rself" data-v="ok" data-k="${k}">Перевёл верно</button><button class="chip dtr" data-d="rself" data-v="bad" data-k="${k}">Ошибся</button></div>`:r.v!=='skip'?`<button class="chip dtr" data-d="rflip" data-k="${k}">${r.v==='bad'?'Засчитать':'Не засчитывать'}</button>`:'');}
  h+='</div>';}
 if(c.i>=c.lines.length){const rs=Object.values(c.res),ok=rs.filter(r=>r.v==='ok'||r.v==='typo').length;
  h+=`<div class="gp">Диалог окончен · верно ${ok} из ${rs.length}</div><div class="tbtns"><button class="tb pri" data-d="rnew">Новый диалог</button></div>`;
  if(TRG.gen)h+=`<div class="hint">Готовлю следующий…</div>`;return h;}
 const me=c.lines[c.i].s==='me';
 if(TRG.busy)h+=`<div class="dsc">Проверяю… <span id="dtk" data-t0="${TRG.busy}">${sec2(TRG.busy)}</span></div>`;
 else if(TRG.cerr)h+=`<div class="dsc" style="color:var(--weak)">${esc(TRG.cerr)}</div>`;
 h+=`<textarea class="gin" id="din" rows="1" placeholder="${me?'Перевод на греческий':'Перевод на русский'}" autocomplete="off" autocapitalize="off" spellcheck="false"${TRG.busy?' disabled':''}>${esc(TRG.draft)}</textarea>
<div class="tbtns"><button class="tb" data-d="ridk"${TRG.busy?' disabled':''}>Не знаю</button><button class="tb pri" data-d="rsend"${TRG.busy?' disabled':''}>${TRG.cerr?'Повторить':'Проверить'}</button></div>`;
 return h;}
function trUpd(sc,m){if(DS().tab===dm(m))dUpd(sc);}

/* --- Общее --- */
function sitHTML(){const d=DS();return `<div class="dsit">`+DSIT.map(([k,n])=>`<button class="chip${d.sit===k?' on':''}" data-dsit="${k}">${n}</button>`).join('')+'</div>';}
function dTabHi(){const d=DS();$('dtab').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===d.tab));}
function dUpd(scroll){if(S.app!=='dlg'||!$('dcard'))return;const d=DS(),G=TRGM[dm()],ta=$('din');if(ta)G.draft=ta.value;const f=document.activeElement===ta;
 $('dcard').innerHTML=trHTML();const n=$('din');if(n){n.style.height='auto';n.style.height=n.scrollHeight+2+'px';if(f)n.focus();}
 if(DG.tick){clearInterval(DG.tick);DG.tick=null;}if($('dtk'))DG.tick=setInterval(()=>{const e=$('dtk');if(e)e.textContent=sec2(+e.dataset.t0);else{clearInterval(DG.tick);DG.tick=null;}},1000);
 if(scroll)requestAnimationFrame(()=>{const b=$('din')||$('dcard').lastElementChild;if(b)b.scrollIntoView({block:'end',behavior:'smooth'});});hh();}
function renderD(){$('jump').innerHTML='';$('tsp').textContent=TLOCAL?'Прогресс сохраняется только на этом устройстве':'Темы 1–'+(GTOP.length?GTOP[GTOP.length-1].n:0)+(CURG?' + '+GS2(CURG):'')+' · весь словарь';
 if(!TREADY){$('list').innerHTML='<div class="empty">Загрузка…</div>';hh();return;}
 dTabHi();if(!$('dcard'))$('list').innerHTML='<div class="trn" id="dcard"></div>';dUpd();}
function auStop(){try{speechSynthesis.cancel();}catch(e){}}
$('dtab').onclick=e=>{const b=e.target.closest('button');if(!b||!TREADY)return;const d=DS();if(d.tab===b.dataset.v)return;auStop();d.tab=b.dataset.v;saveST();dTabHi();dUpd();scrollTo(0,0);};
$('list').addEventListener('click',e=>{if(!$('dcard'))return;const d=DS();
 const st=e.target.closest('#dcard [data-dsit]');if(st){d.sit=st.dataset.dsit;TRGM[dm()].err=null;if(!TRGM[dm()].gen)TRS().q=[];saveST();return dUpd();}
 const b=e.target.closest('#dcard [data-d]');
 if(b){const a=b.dataset.d;
  if(a==='auto'){d.auto=d.auto?0:1;saveST();return dUpd();}
  if(a==='rnew')return trNew();
  if(a==='rretry'){TRGM[dm()].err=null;return trFill();}
  if(a==='rsend')return trCheck($('din')&&$('din').value);
  if(a==='ridk')return trCheck('-');
  if(a==='rflip')return trFlip(+b.dataset.k);
  if(a==='rself'){const c=TRS().cur,r=c&&c.res[+b.dataset.k];if(r&&r.v==='self'){r.v=b.dataset.v;saveST();dUpd();}return;}
  return;}
 const s=e.target.closest('#dcard [data-dsay]');if(s){unlockTTS();say(s.dataset.dsay);}});
$('list').addEventListener('input',e=>{if(e.target.id==='din'){const x=e.target;TRGM[dm()].draft=x.value;x.style.height='auto';x.style.height=x.scrollHeight+2+'px';}
 if(e.target.id==='drng'){ST.rate=+e.target.value;const v=$('drv');if(v)v.textContent=rate().toFixed(2);}});
$('list').addEventListener('change',e=>{if(e.target.id==='drng')saveST();});
$('list').addEventListener('keydown',e=>{if(e.target.id!=='din'||e.key!=='Enter'||e.shiftKey)return;e.preventDefault();trCheck(e.target.value);});
const DVN={ok:['верно','ok'],typo:['описка','ok'],bad:['ошибка','bad'],skip:['подсказка','bad']};

/* ===== Переключатель режима ===== */
function setApp(a){if(S.app==='dlg'&&a!=='dlg')auStop();S.app=a;S.q='';$('q').value='';try{LSX.setItem('app',a);}catch(e){}
 $('dictbars').hidden=a!=='dict';$('grambars').hidden=a!=='gram';const T=a==='train'||a==='rev',DL=a==='dlg';$('trainbars').hidden=!T;$('rtabbar').hidden=!T;$('dlgbars').hidden=!DL;const PG=a==='prog';$('q').hidden=T||DL||PG;$('tsp').hidden=!(T||DL||PG);
 $('mb').textContent=({dict:'Словарь',gram:'Грамматика',train:'Тема',rev:'Повторение',dlg:'Диалог',prog:'Прогресс'})[a]+' ▾';
 $('mm').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===a));
 $('q').placeholder=a==='gram'?'είμαι, артикль, ударение…':'Поиск: μητέρα, мать, митэра';
 render();scrollTo(0,0);}
$('mb').onclick=e=>{e.stopPropagation();$('mm').hidden=!$('mm').hidden;};
$('mm').onclick=e=>{const b=e.target.closest('button[data-m]');if(!b)return;$('mm').hidden=true;setApp(b.dataset.m);};
document.addEventListener('click',e=>{if(!e.target.closest('#mm'))$('mm').hidden=true;});
/* ===== Курс: экран ===== */
function reloadApp(){try{location.reload();}catch(e){}setTimeout(()=>{PGS.msg='Перезапусти приложение, чтобы изменения применились.';render();},1500);}
function courseHTML(){const st=COURSE.stat(),S=COURSE.steps,ci=COURSE.idx,ask=PGS.ask||'';
 const row=(s,i)=>{const t=COURSE.status(s),nm=esc(COURSE.title(s));let b='';
  const bt=(a,l,cls)=>`<button data-p="${a}" data-id="${s.id}" class="${cls||''}">${l}</button>`;
  if(t==='cur'){const nx=S.slice(i+1).find(x=>COURSE.loaded(x));b=bt('cdone',ask==='cdone'?'Точно? Нажми ещё раз':'Тема пройдена',ask==='cdone'?'warn':'pri');}
  else if(t==='done')b=bt('cview','Повторить')+bt('cset',ask==='cset:'+s.id?'Точно? Нажми ещё раз':'Сделать текущей',ask==='cset:'+s.id?'warn':'');
  else if(t==='ahead')b=bt('cset',ask==='cset:'+s.id?'Пропустить темы до неё? Нажми ещё раз':'Сделать текущей',ask==='cset:'+s.id?'warn':'');
  const ic={done:'✓',cur:'▶',ahead:'·',soon:'…'}[t];
  return `<div class="di" style="${t==='soon'?'color:var(--mut)':''}"><div class="k" style="font-size:20px">${ic} ${nm}${t==='soon'?' <span class="mut" style="font-size:16px">— готовится</span>':''}${COURSE.view===s.id?' <span class="mut" style="font-size:16px">— повтор</span>':''}</div>${b?`<div class="pb">${b}</div>`:''}</div>`;};
 let h=`<h3>Курс</h3><p><b>${st.pct}% курса</b> · пройдено тем: ${st.done} из ${st.total} · ${st.words} слов</p>`;
 const done=S.slice(0,ci),next=S.slice(ci+1);
 if(done.length)h+=PGS.cdone?done.map((s,k)=>row(s,k)).join('')+`<div class="pb"><button data-p="ctg" data-v="cdone">Свернуть пройденное</button></div>`
  :`<div class="pb"><button data-p="ctg" data-v="cdone">Пройдено: ${done.length} — показать</button></div>`;
 h+=row(S[ci],ci);
 const vis=PGS.cnext?next:next.slice(0,3);h+=vis.map((s,k)=>row(s,ci+1+k)).join('');
 if(next.length>3)h+=`<div class="pb"><button data-p="ctg" data-v="cnext">${PGS.cnext?'Свернуть':'Впереди ещё '+(next.length-3)+' — показать'}</button></div>`;
 return h;}
function courseClick(a,id){
 if(a==='ctg'){return;}
 if(a==='cview'){COURSE.setView(id);return reloadApp();}
 if(a==='cset'){if(PGS.ask!=='cset:'+id){PGS.ask='cset:'+id;render();setTimeout(()=>{if(PGS.ask==='cset:'+id){PGS.ask='';render();}},4000);return;}
  PGS.ask='';COURSE.setView(null);COURSE.set(id);return reloadApp();}
 if(a==='cdone'){if(PGS.ask!=='cdone'){PGS.ask='cdone';render();setTimeout(()=>{if(PGS.ask==='cdone'){PGS.ask='';render();}},4000);return;}
  PGS.ask='';const S=COURSE.steps,nx=S.slice(COURSE.idx+1).find(x=>COURSE.loaded(x));
  if(!nx){PGS.msg='Следующая тема готовится — появится с новой версией приложения.';return render();}
  COURSE.setView(null);COURSE.set(nx.id);return reloadApp();}}
function viewUI(){const b=$('viewbn');if(!COURSE.on||!COURSE.view){b.hidden=true;return;}const s=COURSE.steps[COURSE.idxOf(COURSE.view)];
 b.innerHTML=`<span>Повтор: ${esc(COURSE.title(s))}</span><button id="viewx">К текущей теме</button>`;b.hidden=false;
 $('viewx').onclick=()=>{COURSE.setView(null);reloadApp();};}
viewUI();
/* ===== Прогресс: доучить, спорные, резервная копия ===== */
const PGS={imp:null,msg:'',ask:'',txt:''};
const expKey=()=>'lastExp_'+LSK;
function lastExp(){try{return +LSX.getItem(expKey())||0;}catch(e){return 0;}}
function owner(){try{return LSX.getItem('owner')||'';}catch(e){return '';}}
const dt=t=>{const d=new Date(t);return d.toLocaleDateString('ru-RU')+' '+d.toTimeString().slice(0,5);};
const daysAgo=t=>Math.floor((Date.now()-t)/864e5);
function expData(){return {app:LANG.code+'-trainer',fmt:1,owner:owner(),ts:Date.now(),upd:ST.upd||0,st:JSON.parse(JSON.stringify(ST))};}
function renderP(){$('tcnt')&&($('tcnt').textContent='');const nw=W.filter(w=>WK(w)).length,dp=ST.disp||[],le=lastExp();
 let h=`<div id="pg"><div class="gtitle">Прогресс</div>`;
 if(COURSE.on)h+=courseHTML();
 h+=`<h3>Доучить</h3><p>${nw?`Слов «плохо помню»: <b>${nw}</b>. Ошибка ставит слово в список, два верных ответа подряд — снимают.`:'Список пуст.'}</p>`;
 if(nw)h+=`<div class="pb"><button data-p="weak" class="pri">Открыть список</button></div>`;
 h+=`<h3>Спорные ответы</h3><p class="mut">Ответы, которые проверка не распознала, с твоим решением. Их передают Claude, чтобы пополнить банк вариантами и ловушками.</p>`;
 if(!dp.length)h+=`<p>Пока нет.</p>`;
 else{h+=dp.slice(-30).reverse().map(x=>`<div class="di"><div>${esc(x.ru)}</div><div class="k">${esc(x.a)} <span class="gvt" style="color:${x.v==='ok'?'var(--ok)':'var(--weak)'}">${x.v==='ok'?'засчитано':'ошибка'}</span></div><div class="mut">эталон: ${esc(x.ko)} · ${esc(GL(GBY[x.t])||x.t)}</div></div>`).join('')+(dp.length>30?`<p class="mut">…и ещё ${dp.length-30}</p>`:'');
  h+=`<div class="pb"><button data-p="dcopy">Копировать для Claude (${dp.length})</button><button data-p="dclr" class="${PGS.ask==='dclr'?'warn':''}">${PGS.ask==='dclr'?'Точно очистить?':'Очистить'}</button></div>`;}
 if(OFFT)h+=`<h3>Тестовая копия</h3><p class="mut">Урок и повторение грамматики начнутся заново, с блоками из банка. Слова и «плохо помню» не трогаются.</p><div class="pb"><button data-p="treset" class="${PGS.ask==='treset'?'warn':''}">${PGS.ask==='treset'?'Точно начать заново?':'Начать урок и повторение заново'}</button></div>`;
 h+=`<h3>Резервная копия</h3><p>Последняя выгрузка: <b>${le?dt(le)+` (${daysAgo(le)} дн. назад)`:'не было'}</b></p>`;
 h+=`<p class="mut">Файл прогресса: слова «плохо помню», статистика, уроки, серии. Храни в iCloud / Drive / Telegram. Загрузка на другом устройстве переносит прогресс туда.${OFF?'':' Внутри Claude прогресс и так сохраняется в базе — выгрузка нужна как бэкап и для переноса в автономную версию.'}</p>`;
 h+=`<p>Владелец: <input type="text" id="pgown" value="${esc(owner())}" placeholder="имя" style="width:60%"></p>`;
 h+=`<div class="pb"><button data-p="exp" class="pri">Выгрузить</button><label style="display:inline-block"><input type="file" id="pgfile" accept=".json,application/json,text/plain" hidden><button data-p="impf" type="button">Загрузить файл</button></label><button data-p="impt">Вставить текстом</button></div>`;
 if(PGS.msg)h+=`<p>${PGS.msg}</p>`;
 if(PGS.txt==='exp')h+=`<p class="mut">Файл не отдаётся напрямую — скопируй текст ниже и сохрани в заметку или файл .json.</p><textarea id="pgta" rows="6" readonly>${esc(JSON.stringify(expData()))}</textarea><div class="pb"><button data-p="tcopy">Скопировать</button></div>`;
 if(PGS.txt==='imp')h+=`<p class="mut">Вставь текст выгрузки:</p><textarea id="pgin" rows="6"></textarea><div class="pb"><button data-p="tread" class="pri">Прочитать</button></div>`;
 if(PGS.imp){const d=PGS.imp,old=(d.upd||0)<(ST.upd||0),other=d.owner&&owner()&&d.owner!==owner();
  h+=`<div class="gi"><p>Файл: владелец <b>${esc(d.owner||'—')}</b>, выгружен ${dt(d.ts)}. «Плохо помню»: ${Object.values(d.st.weak||{}).filter(x=>x&&x.on).length}.</p>`+
   (old?`<p style="color:#b45309">Этот прогресс старше текущего на устройстве.</p>`:'')+(other?`<p style="color:#b45309">Файл другого владельца.</p>`:'')+
   `<p class="mut">Загрузка заменит ${OFFT?'тестовую копию':OFF?'прогресс на этом устройстве':'основной прогресс (и в базе Claude)'}.</p>
   <div class="pb"><button data-p="iok" class="${old||other?'warn':'pri'}">${old||other?'Всё равно загрузить':'Загрузить'}</button><button data-p="ino">Отмена</button></div></div>`;}
 if(window.APPV)h+=`<p class="mut" style="margin-top:28px">Версия приложения: ${esc(window.APPV)}</p>`;
 $('list').innerHTML=h+`</div>`;}
function pgRead(txt){try{const d=JSON.parse(txt);if(!d||d.app!==LANG.code+'-trainer'||!d.st||typeof d.st!=='object')throw 0;PGS.imp=d;PGS.msg='';PGS.txt='';}
 catch(e){PGS.imp=null;PGS.msg='Не удалось прочитать: это не файл прогресса.';}render();}
async function pgExport(){const d=expData(),js=JSON.stringify(d),name='greek_progress_'+new Date().toISOString().slice(0,10)+'.json';
 const done=()=>{try{LSX.setItem(expKey(),String(Date.now()));}catch(e){}PGS.msg='Выгружено.';render();};
 try{const f=new File([js],name,{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return done();}}catch(e){if(e&&e.name==='AbortError'){PGS.msg='Отменено.';return render();}}
 if(HASC){PGS.txt='exp';try{LSX.setItem(expKey(),String(Date.now()));}catch(e){}return render();}
 try{const u=URL.createObjectURL(new Blob([js],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);done();}
 catch(e){PGS.txt='exp';render();}}
$('list').addEventListener('click',e=>{const b=e.target.closest('#pg [data-p]');if(!b)return;const a=b.dataset.p;
 if(a==='ctg'){PGS[b.dataset.v]=!PGS[b.dataset.v];return render();}
 if(a==='cview'||a==='cset'||a==='cdone')return courseClick(a,b.dataset.id);
 if(a!=='dclr'&&a!=='treset')PGS.ask='';
 if(a==='treset'){if(PGS.ask!=='treset'){PGS.ask='treset';render();setTimeout(()=>{if(PGS.ask==='treset'){PGS.ask='';render();}},4000);return;}PGS.ask='';delete ST.les;delete ST.grs;saveST();PGS.msg='Урок и повторение начаты заново.';return render();}
 if(a==='weak'){S.weak=true;return setApp('dict');}
 if(a==='dcopy'){const t=(ST.disp||[]).map(x=>[x.t,x.u,x.bid,x.ru,x.ko,x.a,x.v].join(' | ')).join('\n');
  const txt='СПОРНЫЕ ОТВЕТЫ (тема | модель | id | задание | эталон | ответ | решение)\n'+t;
  try{navigator.clipboard.writeText(txt).then(()=>{b.textContent='Скопировано';},()=>{PGS.txt='';PGS.msg='';const w=$('list');w.insertAdjacentHTML('beforeend',`<textarea rows="6" style="width:100%">${esc(txt)}</textarea>`);});}catch(x){}return;}
 if(a==='dclr'){if(PGS.ask!=='dclr'){PGS.ask='dclr';render();setTimeout(()=>{if(PGS.ask==='dclr'){PGS.ask='';render();}},4000);return;}PGS.ask='';ST.disp=[];saveST();return render();}
 if(a==='exp')return pgExport();
 if(a==='impf'){const f=$('pgfile');f.value='';return f.click();}
 if(a==='impt'){PGS.txt='imp';PGS.imp=null;return render();}
 if(a==='tread')return pgRead($('pgin').value);
 if(a==='tcopy'){const t=$('pgta');t.select();try{navigator.clipboard.writeText(t.value).then(()=>{b.textContent='Скопировано';},()=>{b.textContent='Выдели и скопируй вручную';});}catch(x){b.textContent='Выдели и скопируй вручную';}return;}
 if(a==='ino'){PGS.imp=null;return render();}
 if(a==='iok'){const d=PGS.imp;ST=Object.assign({v:1,weak:{},stats:{},sess:null,last:[]},d.st);saveST();PGS.imp=null;PGS.msg='Прогресс загружен ('+dt(d.ts)+').';offUI();try{if(COURSE.sync(ST)){location.reload();return;}}catch(e){}return render();}});
$('list').addEventListener('change',e=>{if(e.target.id==='pgfile'){const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>pgRead(String(r.result||''));r.readAsText(f);}
 if(e.target.id==='pgown'){try{LSX.setItem('owner',e.target.value.trim());}catch(x){}}});
function firstRun(){try{let t=+LSX.getItem('firstRun')||0;if(!t){t=Date.now();LSX.setItem('firstRun',String(t));}return t;}catch(e){return Date.now();}}
function offUI(){const le=lastExp(),rem=OFF&&!OFFT&&(le?daysAgo(le)>=7:daysAgo(firstRun())>=7);
 $('offbn').textContent=OFFT?'Автономный режим · тест (прогресс отдельно от основного)':'Автономный режим'+(rem?' · прогресс не выгружался '+(le?daysAgo(le)+' дн.':'ни разу')+' → Прогресс':'');
 $('offbn').hidden=!(OFFT||rem);$('offb').hidden=!HASC;$('offb').textContent='Автономный режим: '+(OFFT?'вкл':'выкл');$('offb').classList.remove('ask');}
offUI();let OFFASK=0;
$('offb').onclick=async e=>{e.stopPropagation();
 if(!OFFASK){OFFASK=1;$('offb').textContent=OFFT?'Выключить? Нажми ещё раз':'Включить тест? Нажми ещё раз';$('offb').classList.add('ask');
  setTimeout(()=>{if(OFFASK){OFFASK=0;offUI();}},4000);return;}
 OFFASK=0;$('mm').hidden=true;const on=!OFFT;
 try{saveST();await SAVEQ;}catch(x){}
 let seeded=false;
 try{const db=DBH||(DBH=await window.claude.use('db'));await db.doc('trainer/mode').set({off:on});
  if(on){const t=await db.doc('trainer/state_off').get();if(!t.exists){const snap=JSON.parse(JSON.stringify(ST));await db.doc('trainer/state_off').set(snap);seeded=true;}}}catch(x){}
 try{if(on){if(seeded||!LSX.getItem('trainer_off'))LSX.setItem('trainer_off',JSON.stringify(ST));LSX.setItem('offmode','1');}else LSX.removeItem('offmode');}catch(x){}
 OFFT=on;OFF=!HASC||on;LSK=OFFT?'trainer_off':'trainer';SMPP=null;REF=null;TREADY=false;TLOCAL=false;
 ST={v:1,weak:{},stats:{},sess:null,last:[]};offUI();initST();};
const HASD=!!(D.dlg&&D.dlg.length);{const b=$('mm').querySelector('[data-m="dlg"]');if(b&&!HASD)b.hidden=true;}
let A0='dict';try{A0=LSX.getItem('app')||'dict';}catch(e){}if(A0==='dlg'&&!HASD)A0='dict';
setApp(['gram','train','rev','dlg'].includes(A0)?A0:'dict');

