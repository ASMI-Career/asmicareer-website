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
