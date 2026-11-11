/* Draw aligned digits, the active column and the path of a place-value shift. */
(function(root){
'use strict';
const M=root.DecimalModel;
const superscript=n=>String(n).replace(/[-0-9]/g,d=>d==='-'?'⁻':'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const names={3:'Thousands',2:'Hundreds',1:'Tens',0:'Ones','-1':'Tenths','-2':'Hundredths','-3':'Thousandths'};

function digits(value){
 const [whole,fraction='']=M.format(value).replace('−','').split('.');
 return Object.fromEntries([...whole+fraction].map((digit,i)=>[whole.length-i-1,digit]));
}
function renderHops({start,places,direction},frame,animated){
 const [whole,fraction='']=M.format(start).split('.');
 const target=whole.length+places*direction;
 const padding=Math.max(0,1-target);
 const original=whole+fraction;
 const ribbon='0'.repeat(padding)+original+'0'.repeat(Math.max(0,target-original.length));
 const initial=whole.length+padding, hops=frame.hops||0, current=initial+hops*direction;
 const width=Math.max(840,ribbon.length*55+90),height=265;
 const left=(width-ribbon.length*55)/2, x=index=>left+index*55;
 const pointY=158, colour='#8050b4';
 const text=(x,y,value,size,fill='#493455')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="'+size+'" fill="'+fill+'">'+value+'</text>';
 let svg=text(width/2,33,'Start at '+M.format(start),22);
 const activeLeft=Math.min(padding,current-1),activeRight=Math.max(padding+original.length,current);
 [...ribbon].forEach((digit,index)=>{
  const active=index>=activeLeft&&index<activeRight;
  svg+='<rect x="'+(x(index)+4)+'" y="123" width="47" height="51" rx="5" fill="#f5f0fa" opacity="'+(active?1:.35)+'"/>';
  svg+=text(x(index)+27.5,149,digit,31,active?'#302044':'#b9a9c5');
 });
 const curve=(from,to)=>'Q'+((x(from)+x(to))/2)+' 58 '+x(to)+' '+pointY;
 for(let i=0;i<hops;i++){
  const from=initial+i*direction,to=from+direction;
  svg+='<path data-decimal-hop="true" d="M'+x(from)+' '+pointY+curve(from,to)+'" fill="none" stroke="'+colour+'" stroke-width="2.6" marker-end="url(#arrow)"/>';
 }
 const previous=frame.replay?0:hops-1;
 if(animated&&hops){
  let path='M'+x(initial+previous*direction)+' '+pointY;
  for(let i=previous;i<hops;i++)path+=curve(initial+i*direction,initial+(i+1)*direction);
  svg+='<circle r="5.5" fill="'+colour+'" stroke="white" stroke-width="1.5"><animateMotion dur="'+((hops-previous)*.45)+'s" fill="freeze" path="'+path+'"/></circle>';
 }else{
  svg+='<circle cx="'+x(current)+'" cy="'+pointY+'" r="5.5" fill="'+colour+'"/>';
 }
 if(hops)svg+=text(width/2,216,M.format(frame.rows[0].value,true),25);
 return {svg,width,height};
}
function render(plan,frame,animated){
 if(plan.pointShift)return renderHops(plan.pointShift,frame,animated);
 const arrowFrames=plan.steps.flatMap(step=>[...(step.arrows||[]),...(step.arrow?[step.arrow]:[])]);
 const values=plan.steps.flatMap(step=>step.rows.map(row=>row.value));
 const powers=values.flatMap(value=>Object.keys(digits(value)).map(Number));
 const columns=plan.steps.map(step=>step.column).filter(Number.isInteger);
 for(const arrow of arrowFrames)powers.push(arrow.from,arrow.to);
 const high=Math.max(0,...powers,...columns),low=Math.min(-1,...powers,...columns);
 const count=high-low+2,cell=64,labelWidth=210,width=Math.max(840,labelWidth+count*cell+24);
 const left=labelWidth+(width-labelWidth-count*cell-24)/2;
 const x=exponent=>left+(high-exponent+(exponent<0?1:0))*cell+cell/2;
 const point=x(0)+cell;
 const text=(x,y,value,size=20,colour='#493455',anchor='middle')=>
  '<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="'+size+'" fill="'+colour+'">'+String(value).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</text>';
 const arrow=(a,b,c,d,colour='#8050b4')=>
  '<path d="M'+a+' '+b+'L'+c+' '+d+'" stroke="'+colour+'" stroke-width="2.4" fill="none" marker-end="url(#arrow)"/>';
 const top=112,spacing=frame.arrows?.length?132:69,height=Math.max(300,top+(frame.rows.length-1)*spacing+65);
 let svg='';
 for(let exponent=high;exponent>=low;exponent--){
  const active=frame.column===exponent,cx=x(exponent);
  svg+='<rect x="'+(cx-cell/2+2)+'" y="39" width="'+(cell-4)+'" height="'+(height-65)+'" rx="5" fill="'+(active?'#ffe8a8':'#f5f0fa')+'"/>';
  const name=names[exponent]||'10'+superscript(exponent);
  svg+=text(cx,57,name,name.length>9?9:11);
  svg+=text(cx,79,exponent===0?'1':'10'+superscript(exponent),14);
 }
 svg+='<path d="M'+point+' 42V'+(height-26)+'" stroke="#b08a43" stroke-width="1.5" stroke-dasharray="4 4"/>';
 frame.rows.forEach((row,index)=>{
  const y=top+index*spacing,entries=row.digits||digits(row.value);
  svg+=text(18,y,row.label,16,'#493455','start');
  svg+=text(point,y,'·',32,'#9a6619');
  if(row.value.units<0n)svg+=text(left-16,y,'−',24);
  for(const [position,digit]of Object.entries(entries)){
   const exponent=Number(position);
   if(row.through!==undefined&&exponent>row.through)continue;
   svg+=text(x(exponent),y,digit,28,exponent===frame.column?'#573676':'#302044');
  }
 });
 if(frame.arrow)svg+=arrow(x(frame.arrow.from),28,x(frame.arrow.to),28);
 for(const move of frame.arrows||[]){
  const from=x(move.from),to=x(move.to),start=top+23,end=top+spacing-23;
  svg+=arrow(from,start,to,end,'#078477');
  if(animated)svg+='<text font-family="system-ui,sans-serif" font-size="16" text-anchor="middle" fill="#078477">'+move.digit
   +'<animateMotion dur=".65s" path="M'+from+' '+start+'L'+to+' '+end+'"/>'
   +'<animate attributeName="opacity" values="1;1;0" dur=".65s" fill="freeze"/></text>';
 }
 return {svg,width,height};
}
root.DecimalDiagram={render};
})(window);
