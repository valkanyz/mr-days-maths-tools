/* Link percentage benchmarks to the actual amount and its selected units. */
(function(root) {
'use strict';
function plan(amount,percent) {
 const tens=Math.floor(percent/10)*10,ones=percent-tens;
 return {amount,percent,tens,ones,ten:amount/10,one:amount/100,
  tensAmount:amount*tens/100,onesAmount:amount*ones/100,part:amount*percent/100};
}
const number=value=>new Intl.NumberFormat('en-AU',{maximumFractionDigits:4}).format(value);
function steps(model) {
 const {amount,percent,tens,ones,ten,one,tensAmount,onesAmount,part}=model;
 return [
  'The whole amount is '+number(amount)+'. This is 100%.',
  'Split the whole into 10 equal parts. 10% = '+number(amount)+' ÷ 10 = '+number(ten)+'.',
  'Split one 10% part into 10 again. 1% = '+number(ten)+' ÷ 10 = '+number(one)+'.',
  number(percent)+'% = '+number(tens)+'% + '+number(ones)+'%. These parts are worth '+number(tensAmount)+' and '+number(onesAmount)+'.',
  number(percent)+'% of '+number(amount)+' = '+number(tensAmount)+' + '+number(onesAmount)+' = '+number(part)+'.'
 ];
}
function render(model,options) {
 const {amount,percent,tens,ones,ten,one,tensAmount,onesAmount,part}=model;
 const purple='#8050b4',teal='#078477',ink='#493455',pale='#eee7f4';
 const depth=options.teaching?options.step:4;
 const value=(n,stage=0)=>options.reveal&&depth>=stage?number(n):'?';
 const text=(x,y,label,size=18,colour=ink,anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-family="system-ui,sans-serif" font-size="'+size+'" fill="'+colour+'">'+label+'</text>';
 const rect=(x,y,w,h,fill,extra='')=>'<rect x="'+x+'" y="'+y+'" width="'+Math.max(0,w)+'" height="'+h+'" rx="3" fill="'+fill+'" '+extra+'/>';
 let displayedPercent=percent;
 if(options.teaching)displayedPercent=depth===0?0:depth===1?10:depth===2?1:percent;
 const displayedTens=options.teaching&&depth<3?(depth===1?10:0):tens;
 const displayedOnes=Math.max(0,displayedPercent-displayedTens);
 const displayedAmount=amount*displayedPercent/100,displayedTenAmount=amount*displayedTens/100;
 const start=60,width=720,marker=start+width*displayedPercent/100;
 let svg=text(420,33,number(percent)+'% of '+number(amount),25);
 svg+=text(420,73,'The whole bar is '+number(amount)+' = 100%',19);
 svg+=rect(start,131,width,36,pale)+rect(start,131,width*displayedTens/100,36,purple)
  +rect(start+width*displayedTens/100,131,width*displayedOnes/100,36,teal);
 for(let i=0;i<=10;i++){
  const x=start+i*width/10;
  svg+='<path d="M'+x+' 125V173M'+x+' 198v8" stroke="#95809f" stroke-width="1.5"/>';
  svg+=text(x,116,i*10+'%',15);
  svg+=text(x,227,i===0?'0':i===10?number(amount):value(amount*i/10,1),16);
 }
 svg+='<path d="M60 198H780" stroke="#95809f" stroke-width="1.5"/>'
  +text(420,251,'Amount',14);
 svg+='<path d="M'+marker+' 170v27" stroke="'+teal+'" stroke-width="2" stroke-dasharray="4 3"/>'
  +'<circle cx="'+marker+'" cy="149" r="11" fill="white" stroke="'+teal+'" stroke-width="4" pointer-events="none"/>'
  +text(marker,187,value(displayedAmount,options.teaching&&depth===3?4:depth),17,teal);
 svg+='<rect data-percentage-drag="true" x="47" y="91" width="746" height="150" fill="transparent" role="slider" tabindex="0" aria-label="Percentage of the whole amount" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'" aria-valuetext="'+percent+' percent" style="cursor:ew-resize"><title>Drag to change the percentage. Arrow keys change it by 1%.</title></rect>';
 if(options.tiles){
  const count=amount===0?0:Number.isInteger(amount)&&amount<=120?amount:100;
  const unit=count?amount/count:0;
  const rowsOfTenPercent=count>0&&count%10===0;
  const columns=rowsOfTenPercent?count/10:Math.min(count||10,count>100?12:10);
  const size=21,gap=2,x=177-(columns*(size+gap)-gap)/2,y=308;
  svg+=text(177,285,number(amount)+' units make the whole',17);
  for(let i=0;i<count;i++){
   const bx=x+(i%columns)*(size+gap),by=y+Math.floor(i/columns)*(size+gap);
   const first=Math.max(0,Math.min(1,(displayedTenAmount-i*unit)/unit));
   const total=Math.max(0,Math.min(1,(displayedAmount-i*unit)/unit));
   svg+=rect(bx,by,size,size,pale,'data-amount-unit="true"');
   if(first>0)svg+=rect(bx,by,size*first,size,purple);
   if(total>first)svg+=rect(bx+size*first,by,size*(total-first),size,teal);
  }
  const bottom=y+Math.ceil(count/columns)*(size+gap);
  svg+=text(177,count?bottom+25:365,count?'Each square = '+number(unit)+' unit'+(unit===1?'':'s')+(rowsOfTenPercent?' · Each row = 10%':''):'The whole amount is zero.',14);
 }else{
  svg+=rect(55,310,270,165,'#f7f2fb')+text(190,350,'100%',26,purple)+text(190,399,number(amount),38,purple)
   +text(190,446,'The original amount',17);
 }
 svg+=text(575,294,'Build '+number(percent)+'% from smaller parts',19);
 svg+=rect(365,310,420,48,'#f5f0fa')
  +text(469,340,'10% = '+value(ten,1),19,purple)+text(675,340,'1% = '+value(one,2),19,teal);
 const tensLine=number(tens)+'% = '+number(tens/10)+' × '+value(ten,1)+' = '+value(tensAmount,3);
 const onesLine=number(ones)+'% = '+number(ones)+' × '+value(one,2)+' = '+value(onesAmount,3);
 svg+=rect(365,375,420,50,'#eee3f8')+text(575,407,tensLine,21,purple)
  +rect(365,438,420,50,'#e3f4ed')+text(575,470,onesLine,21,teal)
  +text(575,535,value(tensAmount,3)+' + '+value(onesAmount,3)+' = '+value(part,4),29,ink);
 svg+=text(420,596,'Drag the marker or use the percentage slider to change the selected amount.',16);
 return svg;
}
const api={plan,steps,render};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.PercentageAmount=api;
})(typeof window!=='undefined'?window:globalThis);
