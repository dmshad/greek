/* ===== Язык приложения (lang/el) ===== */
const LANG=(()=>{
 // латинские буквы-двойники → греческие (только в строке, где уже есть греческие буквы)
 const LAT={a:'α',b:'β',e:'ε',h:'η',i:'ι',k:'κ',m:'μ',n:'ν',o:'ο',p:'ρ',t:'τ',x:'χ',y:'υ',z:'ζ',u:'υ',v:'ν'};
 const isG=s=>/[\u0370-\u03ff\u1f00-\u1fff]/.test(s);
 // сравнение: ударение строго; регистр не важен; ς = σ; латиница-двойники → греческие
 function fold(s){s=String(s||'').normalize('NFC').toLowerCase();
  if(isG(s))s=s.replace(/[a-z]/g,c=>LAT[c]||c);
  return s.replace(/ς/g,'σ').replace(/\u037e/g,';').replace(/\u0387/g,'·');}
 // для показа: конечная σ → ς
 const pretty=s=>String(s).replace(/σ(?![α-ωάέήίόύώϊϋΐΰ])/g,'ς');
 const bare=s=>String(s).normalize('NFD').replace(/\u0301/g,'').normalize('NFC');
 // звуковой скелет: буквы, которые звучат одинаково
 const snd=s=>bare(s).replace(/ει|οι|υι|η|υ/g,'ι').replace(/ω/g,'ο').replace(/αι/g,'ε');
 const W0=s=>String(s||'').normalize('NFC').replace(/[.,!?;:·'’"«»()\-–—\u037e]/g,' ').split(/\s+/).filter(Boolean);
 const words=s=>W0(fold(s));
 // слоги: безударные ι/υ/ει/οι перед гласной слога не образуют (γεια, μια, ποιος)
 const syl=w=>(bare(w).replace(/(ει|οι|ι|υ)(?=[αεοω]|ου)/g,'').match(/ου|αι|ει|οι|υι|αυ|ευ|[αεηιουωϊϋ]/g)||[]).length;
 const PAIR={'πού':'πού — «где», που — «который, что»','πώς':'πώς — «как», πως — «что» (союз)','ή':'ή — «или», η — артикль'};
 const accN=w=>(w.normalize('NFD').match(/\u0301/g)||[]).length;
 // пояснение к неверному ответу: ударение или «звучит так же, пишется иначе»
 const ARTS=new Set(['ο','η','το','οι','τα']);
 function wnote(v,ref){const A=words(v),B=words(ref),B0=W0(ref);if(!A.length)return '';
  // артикль у существительного
  if(B.length===A.length+1&&ARTS.has(B[0])&&A.join(' ')===B.slice(1).join(' '))return 'Существительное учим с артиклем: '+B0.join(' ')+'.';
  if(A.length===B.length&&A.length>1&&ARTS.has(A[0])&&ARTS.has(B[0])&&A[0]!==B[0]&&A.slice(1).join(' ')===B.slice(1).join(' '))return 'Неверный артикль: '+B0.join(' ')+'.';
  if(A.length!==B.length)return '';
  const acc=[],spl=[];
  for(let i=0;i<A.length;i++){const a=A[i],b0=B[i],b=B0.length===B.length?B0[i]:pretty(b0);if(a===b0)continue;
   if(bare(a)===bare(b0)){const pr=PAIR[a]||PAIR[b];
    if(pr)acc.push('разные слова: '+pr);
    else if(!accN(a)&&accN(b))acc.push('нет ударения в слове '+b);
    else if(accN(a)&&!accN(b)&&syl(b)<=1)acc.push('слово '+b+' односложное — пишется без ударения');
    else if(accN(a)&&!accN(b))acc.push('лишнее ударение: '+b);
    else acc.push('ударение не на том слоге: '+b);continue;}
   if(snd(a)===snd(b0)){spl.push(b);continue;}
   return '';}
  const o=[];if(acc.length){const t=acc.join('; ');o.push(t[0].toUpperCase()+t.slice(1)+'.');}
  if(spl.length)o.push('Звучит так же, но пишется иначе: '+spl.join(', ')+'.');
  return o.join(' ');}
 // ключ сортировки и первая буква для алфавитного указателя — без артикля
 const skey=s=>bare(fold(s).replace(/^(ο\/η|ο|η|το|οι|τα)\s+/,''));
 const ini=s=>(skey(s)[0]||'?').toUpperCase();
 return {code:'el',name:'Греческий',tts:'el-GR',short:'ГРЕ',fold,bare,pretty,wnote,ini,skey,noX:true};
})();
