/* Shared filter-panel enhancements for every state explorer (loaded by /tools/neet-pg-cutoff).
   It only rearranges the existing controls and clicks them; each explorer's own filtering logic is untouched. */
(function(){
 try{
  var d=document,panel=d.querySelector('section.panel'),fx=d.getElementById('fx'),g=fx&&fx.querySelector('.fxg');
  if(!panel||!fx||!g||g.classList.contains('pg-grouped'))return;
  function el(t,c,h){var e=d.createElement(t);if(c)e.className=c;if(h!==undefined)e.innerHTML=h;return e}
  var GROUPS=[['view','Rank and view'],['seat','Seat and course'],['branch','Branch'],['college','College and place'],['more','More filters']];
  var MAP={show:'view',round:'view',sort:'view',sortby:'view',qt:'seat',quota:'seat',pool:'seat',cat:'seat',sub:'seat',st:'seat',fee:'seat',btype:'branch',subj:'branch',ctype:'college',city:'college',state:'college',univ:'college',inst:'college'};
  function keyOf(n){var x=n.querySelector('[id]');var id=x?x.id.replace(/^ms-/,''):'';return MAP[id]||'more'}
  var items=[].slice.call(g.children),act=null,by={};
  items.forEach(function(n){if(n.classList.contains('actions')){act=n;return}(by[keyOf(n)]=by[keyOf(n)]||[]).push(n)});
  g.classList.add('pg-grouped');
  GROUPS.forEach(function(gr){if(!by[gr[0]])return;var b=el('div','pg-g g-'+gr[0],'<h4>'+gr[1]+'</h4>'),r=el('div','pg-gg');by[gr[0]].forEach(function(n){r.appendChild(n)});b.appendChild(r);g.appendChild(b)});
  if(act){var f=el('div','pg-foot');f.appendChild(act);g.appendChild(f)}

  /* quick branch picks */
  var subj=d.getElementById('ms-subj');
  var Q=[['General Medicine',/general medicine/i],['Radiology',/radio-?\s?diagnos|radiology/i],['Paediatrics',/^(?!.*surg)(?=.*(paediatric|pediatric|child))/i],['Orthopaedics',/orthop/i],['Anaesthesia',/anaesth|anesth/i],['Obstetrics & Gynaecology',/obst|gynae/i],['General Surgery',/general surgery/i],['Dermatology',/derm|venere|skin/i],['ENT',/\bENT\b|otorhino|oto-rhino|oto rhino/i],['Ophthalmology',/ophthal/i],['Psychiatry',/psychiatr/i]];
  var qrow=null;
  function boxes(re){return [].slice.call(subj.querySelectorAll('.menu label')).filter(function(l){return re.test(l.textContent)}).map(function(l){return l.querySelector('input[data-v]')}).filter(Boolean)}
  if(subj){
   var wrap=el('div','pg-quick','<span class="t">Quick pick a branch</span>');qrow=el('div','pg-row');wrap.appendChild(qrow);
   Q.forEach(function(q){if(!boxes(q[1]).length)return;var b=el('button','pg-q',q[0]);b.type='button';b.dataset.i=Q.indexOf(q);b.setAttribute('aria-pressed','false');qrow.appendChild(b)});
   if(qrow.children.length)panel.insertBefore(wrap,fx);
   qrow.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.pg-q');if(!b)return;var bx=boxes(Q[+b.dataset.i][1]),all=bx.every(function(x){return x.checked});
    bx.forEach(function(x){if(x.checked===all)x.click()});sync()})}

  /* active-filter tags */
  var bar=el('div','pg-active');panel.parentNode.insertBefore(bar,panel.nextSibling);
  function fieldName(ms){var f=ms.closest('.fld,label');var t=f&&f.firstChild&&f.firstChild.nodeType===3?f.firstChild.textContent.trim():'';return t}
  function tag(name,val,fn){var t=el('span','pg-tag',(name?'<b>'+name+':</b> ':'')+val.replace(/</g,'&lt;')+' ');var x=el('button','','×');x.type='button';x.setAttribute('aria-label','Remove '+val);x.onclick=fn;t.appendChild(x);bar.appendChild(t);return t}
  function sync(){
   bar.innerHTML='';var n=0;
   [].slice.call(d.querySelectorAll('details.ms')).forEach(function(ms){
    var nm=fieldName(ms),on=[].slice.call(ms.querySelectorAll('.menu input[data-v]:checked'));
    if(!on.length)return;n+=1;
    function lab(i){return i.parentNode.textContent.trim()}
    if(on.length<=3)on.forEach(function(i){tag(nm,lab(i),function(){i.click();sync()})});
    else tag(nm,on.length+' selected',function(){var c=ms.querySelector('[data-a="none"]');if(c)c.click();sync()})});
   var sh=d.getElementById('show');if(sh&&sh.value!=='all'){n+=1;tag('Show',sh.options[sh.selectedIndex].text,function(){sh.value='all';sh.dispatchEvent(new Event('change',{bubbles:true}));sync()})}
   var rd=d.getElementById('round');if(rd&&rd.value!=='0'&&rd.value!==''){n+=1;tag('Round',rd.options[rd.selectedIndex].text,function(){rd.value='0';rd.dispatchEvent(new Event('change',{bubbles:true}));sync()})}
   if(n){var lead=el('span','lead','Active filters');bar.insertBefore(lead,bar.firstChild);var c=el('button','pg-clear','Clear all');c.type='button';c.onclick=function(){var r=d.getElementById('reset');if(r)r.click();setTimeout(sync,30)};bar.appendChild(c)}
   var sm=fx.querySelector('summary'),b=sm.querySelector('.pg-n');if(!b){b=el('span','pg-n');sm.appendChild(b)}b.textContent=n;b.style.display=n?'':'none';
   if(qrow)[].slice.call(qrow.children).forEach(function(b){var bx=boxes(Q[+b.dataset.i][1]);b.setAttribute('aria-pressed',bx.length&&bx.every(function(x){return x.checked})?'true':'false')})}
  ['change','click','input'].forEach(function(ev){d.addEventListener(ev,function(){setTimeout(sync,0)},true)});
  sync();
 }catch(e){}
})();
