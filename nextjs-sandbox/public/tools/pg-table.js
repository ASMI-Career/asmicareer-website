/* Gives every state's results table the same round colours as the Maharashtra table.
   It only adds CSS classes (r1..r5 per round column, r0 for the combined column); data and filters are untouched. */
(function(){
 try{
  var d=document,tb=d.getElementById('body'),tbl=tb&&tb.closest('table');
  if(!tb||!tbl)return;
  var map=null;
  function build(){
   map=[];var row=tbl.querySelector('thead tr');if(!row)return;
   var i=0;[].forEach.call(row.children,function(th){
    var m=(th.className||'').match(/\br([1-6])\b/),cs=th.colSpan||1,isRg=/\brg\b/.test(th.className);
    for(var k=0;k<cs;k++){map[i+k]=m?'r'+m[1]:(isRg?'r0':null)}
    i+=cs})}
  var busy=false;
  function paint(){
   busy=false;if(!map)build();
   [].forEach.call(tb.rows,function(tr){
    if(tr.cells.length<3)return;
    [].forEach.call(tr.cells,function(td,i){
     var c=map[i];if(!c||/\br[0-6]\b/.test(td.className))return;
     td.classList.add(c);if(c==='r0')td.classList.add('allr')});
    [].forEach.call(tr.querySelectorAll('td.n small'),function(s){if(/^\s*SML\b/.test(s.textContent))s.classList.add('smlp')})})}
  function sched(){if(busy)return;busy=true;requestAnimationFrame(paint)}
  new MutationObserver(sched).observe(tb,{childList:true});
  window.addEventListener('resize',function(){map=null;sched()});
  paint();
 }catch(e){}
})();

/* ---- Student-friendly layout: hero, icon filter tiles, results bar. Moves existing controls only; filters and data are untouched. ---- */
(function(){
 try{
  var d=document,panel=d.querySelector('section.panel');
  if(!panel||d.body.classList.contains('pgui'))return;
  var P={
   funnel:'<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
   user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/>',doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
   chart:'<path d="M5 20V11M12 20V4M19 20v-6M3 20h18"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
   target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',sort:'<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>',
   cap:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 1.5 5 4.5"/>',
   tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',bank:'<path d="M3 10l9-6 9 6M5 10v9M9.5 10v9M14.5 10v9M19 10v9M3 21h18"/>',
   steth:'<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
   pin:'<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',building:'<path d="M4 21V5l8-2v18M12 8h8v13M4 21h16M8 9h1M8 13h1M8 17h1M16 12h1M16 16h1"/>',
   download:'<path d="M12 3v12M7 11l5 5 5-5M4 21h16"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',reset:'<path d="M4 4v6h6M4.5 14a8 8 0 1 0 2-7.5L4 10"/>',
   list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',down:'<path d="M12 5v14M6 13l6 6 6-6"/>',check:'<path d="M20 6L9 17l-5-5"/>',rupee:'<path d="M6 4h12M6 9h12M9 4c4 0 6 2 6 5s-2 5-6 5l7 7"/>',flag:'<path d="M5 22V4M5 4h13l-2 4 2 4H5"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'
  };
  function svg(k){return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(P[k]||P.list)+'</svg>'}
  function ic(k,t){var i=d.createElement('i');i.className='ic';i.setAttribute('data-t',t);i.innerHTML=svg(k);return i}
  /* label text -> icon + colour */
  var KM=[[/fee/,'rupee',4],[/^state/,'flag',1],[/^show/,'eye',1],[/^round/,'target',2],[/^sort/,'sort',1],[/^(degree|course|stream)/,'cap',3],[/^(quota|category|pool)/,'users',4],
   [/^sub/,'tag',5],[/^college type/,'bank',6],[/^clinical/,'steth',7],[/^(branch|specialty|subject)/,'star',2],[/^city/,'pin',5],[/^college/,'building',6]];
  function kind(txt){txt=txt.toLowerCase();if(/^category/.test(txt))return ['tag',5];for(var i=0;i<KM.length;i++)if(KM[i][0].test(txt))return [KM[i][1],KM[i][2]];return ['list',1]}
  function lbl(el){ /* wrap the leading text node in <b class=lb> */
   for(var n=el.firstChild;n;n=n.nextSibling){if(n.nodeType===3&&n.nodeValue.trim()){var b=d.createElement('b');b.className='lb';b.textContent=n.nodeValue.trim();el.replaceChild(b,n);return b}}
   return el.querySelector('.lb')}
  /* state name for the hero, from the page the explorer sits in */
  var name='';
  try{name=(parent.document.getElementById('st').textContent||'')}catch(e){}
  if(!name)name=d.title||'';
  name=name.replace(/\|.*$/,'').replace(/\s*(NEET-PG|PG|NEET PG)?\s*cutoff explorer\s*$/i,'').trim();
  var wrap=d.querySelector('.wrap')||d.body;
  var hero=d.createElement('section');hero.className='hero2';hero.setAttribute('aria-label','About this explorer');
  var cards=[['target','1','Round-wise cutoffs','Closing AIR and SML'],['users','4','Every quota','State, NRI and more'],['check','3','Rank check','See what fits your rank'],['funnel','5','Easy filters','Find your options']];
  hero.innerHTML='<div class="h2c"><span class="h2b">NEET-PG 2025</span><h1 class="h2t">'+(name?name.replace(/</g,'&lt;')+' ':'')+'<b>Cutoff</b> <em>Explorer</em></h1><p class="h2p">Explore NEET-PG allotments and college-wise cutoffs'+(name?' for '+name.replace(/</g,'&lt;'):'')+'. Enter your rank, pick filters and see which seats are within your reach.</p><a class="h2call" href="tel:7410019075">'+svg('phone')+' Helpline 7410019075</a></div><div class="h2cards">'+cards.map(function(c){return '<div class="h2card" data-t="'+c[1]+'"><i class="ic" data-t="'+c[1]+'">'+svg(c[0])+'</i><b>'+c[2]+'</b><span>'+c[3]+'</span></div>'}).join('')+'</div>';
  wrap.insertBefore(hero,wrap.firstChild);
  d.body.classList.add('pgui');
  /* panel head with Reset all */
  var head=d.createElement('div');head.className='pp-head';
  head.innerHTML='<i class="ic big" data-t="1">'+svg('funnel')+'</i><div class="pp-t"><b>Search &amp; Filter</b><span>Set your preferences to find the best matching results</span></div>';
  var reset=d.getElementById('reset');
  if(reset){reset.classList.add('pp-reset');reset.innerHTML=svg('reset')+' Reset all';head.appendChild(reset)}
  panel.insertBefore(head,panel.firstChild);
  /* search box */
  var wide=panel.querySelector('label.wide');
  if(wide){var lb=lbl(wide);if(lb)lb.textContent='Search college, city or branch'}
  /* rank inputs side by side */
  var ranks=[].slice.call(panel.querySelectorAll(':scope>label.rank'));
  if(ranks.length){var rk=d.createElement('div');rk.className='rk';ranks[0].parentNode.insertBefore(rk,ranks[0]);
   ranks.forEach(function(r,i){lbl(r);r.insertBefore(ic(i?'doc':'user','1'),r.firstChild);rk.appendChild(r)})}
  var ctp=null;[].forEach.call(panel.children,function(c){if(!ctp&&!c.classList.contains('pp-head')&&/^\s*cutoff type/i.test(c.textContent||''))ctp=c});
  if(ctp){ctp.classList.add('pp-ct');lbl(ctp)}
  /* filter tiles */
  var fx=d.getElementById('fx'),fxg=panel.querySelector('.fxg');
  if(fxg){[].slice.call(fxg.children).forEach(function(el){
    if(el.classList.contains('actions'))return;
    var lb=lbl(el);if(!lb)return;var k=kind(lb.textContent);
    el.classList.add('tile');el.setAttribute('data-t',k[1]);el.insertBefore(ic(k[0],k[1]),el.firstChild)});
   var act=fxg.querySelector('.actions');
   if(!act){act=d.createElement('div');act.className='actions';fxg.appendChild(act)}
   var go=d.createElement('button');go.type='button';go.className='pp-go';go.innerHTML='View results '+svg('down');
   go.addEventListener('click',function(){var t=d.querySelector('.rbar')||d.querySelector('.tw');if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});
   act.appendChild(go)}
  if(fx&&(window.innerWidth>640))fx.setAttribute('open','')
  /* results bar */
  var count=d.getElementById('count'),legend=d.getElementById('legend'),dlp=d.getElementById('dlp'),dlmsg=d.getElementById('dlmsg'),meta=d.querySelector('.meta');
  if(count&&dlp){
   var bar=d.createElement('section');bar.className='rbar';bar.setAttribute('aria-label','Results');
   var l=d.createElement('div');l.className='rb-l';l.innerHTML='<i class="ic big" data-t="1">'+svg('users')+'</i>';
   var tx=d.createElement('div');tx.className='rb-t';tx.appendChild(count);l.appendChild(tx);
   var m=d.createElement('div');m.className='rb-m';m.innerHTML=svg('info')+'<span>Includes results matching your ranks and filters.</span>';
   var r=d.createElement('div');r.className='rb-r';
   var so=d.getElementById('sort')||d.getElementById('sortby'),sl=so&&so.closest('label');
   if(sl){sl.classList.remove('tile');sl.removeAttribute('data-t');var si=sl.querySelector(':scope>i.ic');if(si)si.remove();sl.classList.add('rb-sort');var sb=lbl(sl);if(sb)sb.textContent='Sort by:';r.appendChild(sl)}
   dlp.classList.add('rb-dl');dlp.innerHTML=svg('download')+' Download PDF';r.appendChild(dlp);
   bar.appendChild(l);bar.appendChild(m);bar.appendChild(r);
   (meta||count.parentNode).parentNode.insertBefore(bar,meta||count.parentNode);
   if(legend){legend.classList.add('rb-note');bar.parentNode.insertBefore(legend,bar.nextSibling)}
   if(meta)meta.classList.add('gone');
   if(dlmsg){var def=dlmsg.textContent;dlp.title=def;
    var sync=function(){dlmsg.hidden=(dlmsg.textContent===def)};sync();new MutationObserver(sync).observe(dlmsg,{childList:true,characterData:true,subtree:true})}}
 }catch(e){}
})();
