/* Four focused teaching labs, using the shared classroom controls and export contract. */
(()=>{
'use strict';
const K=ClassroomModels,field=(id,label,v)=>`<div><label for="${id}">${label}</label><input id="${id}" value="${esc(v)}"></div>`,area=(id,label,v)=>`<div class="wide"><label for="${id}">${label}</label><textarea id="${id}" rows="7">${esc(v)}</textarea></div>`,shown=()=>$('reveal').checked;
const polyline=(points,color,dash='')=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="3" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
labs.timeseries={title:'Time Series Lab',tag:'APPLICATIONS · STATISTICS',subtitle:'Separate trend from seasonality.',setup(){
 controls(select('tsPeriod','Frequency',[['4','Quarterly'],['12','Monthly']])+area('tsData','Observations in time order','80, 120, 160, 100, 88, 132, 176, 110, 96, 144, 192, 120, 104, 156, 208, 130')+check('tsMoving','Centred moving average',true)+check('tsAdjusted','Deseasonalised data')+check('tsForecast','Forecast next year')+input('tsTrend','Generated trend per period',2,-10,10,.5)+slider('tsSeason','Generated seasonal strength',30,0,70,5)+'<button id="tsGenerate">Generate a series</button>');
 $('tsGenerate').onclick=()=>{const p=value('tsPeriod'),strength=value('tsSeason')/100,trend=value('tsTrend');$('tsData').value=Array.from({length:p*4},(_,i)=>Math.max(1,(150+trend*i)*(1+strength*Math.sin(2*Math.PI*(i%p)/p))).toFixed(1)).join(', ');run();};
 update=()=>{const data=$('tsData').value.trim().split(/[\s,;]+/).map(Number),p=value('tsPeriod'),r=K.series(data,p),forecast=$('tsForecast').checked&&shown(),all=[...data,...(shown()&&$('tsAdjusted').checked?r.adjusted:[]),...(forecast?r.forecast:[])],g=chart(1,data.length+(forecast?p:0),Math.min(0,...all)*1.15,Math.max(...all)*1.15,'Period','Value');let s=g.s;
 const draw=(a,color,offset=0,dash='')=>polyline(a.map((y,i)=>y===null?null:[g.X(i+offset+1),g.Y(y)]).filter(Boolean),color,dash);
 s+=draw(data,C.purple)+data.map((v,i)=>point(g,i+1,v,C.purple,4)).join('');
 if(shown()&&$('tsMoving').checked)s+=draw(r.moving,C.teal,0,'8 4');
 if(shown()&&$('tsAdjusted').checked)s+=draw(r.adjusted,C.gold,0,'2 5');
 if(forecast)s+=draw(r.forecast,C.red,data.length,'6 5');svg(s,'Time series with trend, seasonal adjustment and forecasts');formula('Observed = trend × seasonal index × irregular variation');legend([['Observed',C.purple],...(shown()&&$('tsMoving').checked?[['Centred average (dashed)',C.teal]]:[]),...(shown()&&$('tsAdjusted').checked?[['Deseasonalised (dotted)',C.gold]]:[]),...(forecast?[['Forecast (dashed)',C.red]]:[])]);
 results(r.indices.map((v,i)=>[(p===4?'Q':'Month ')+(i+1),fmt(v,3)]));
 table(['Period','Observed','Centred average','Seasonal index','Deseasonalised','Forecast'],[...data.map((v,i)=>[i+1,v,r.moving[i]===null?'—':fmt(r.moving[i]),fmt(r.indices[i%p]),fmt(r.adjusted[i]),'']),...(forecast?r.forecast.map((v,i)=>[data.length+i+1,'','','','',''+fmt(v)]):[])]);
 note('Even-period moving averages are centred. Seasonal indices use observed ÷ centred average and are normalised to average 1. Forecasts use a straight-line fit to deseasonalised data, then restore seasonality; they are model estimates, not guarantees.');};}};

labs.circles={title:'Circle Theorems Lab',tag:'YEARS 9–10 · GEOMETRY',subtitle:'Move the points. Keep the relationship.',setup(){
 controls(select('ctTheorem','Relationship',[['centre','Angle at centre and circumference'],['segment','Angles in the same segment'],['cyclic','Opposite angles in a cyclic quadrilateral'],['semicircle','Angle in a semicircle'],['tangent','Radius and tangent'],['alternate','Tangent–chord theorem']])+slider('ctA','Point A angle',20,0,359,1)+slider('ctB','Point B angle',140,0,359,1)+slider('ctC','Point C angle',240,0,359,1)+slider('ctD','Point D angle',300,0,359,1)+check('ctRadii','Show supporting radii',true));
 let dragging=null;
 update=()=>{const kind=$('ctTheorem').value,angles=['A','B','C','D'].map(k=>value('ct'+k));if(kind==='semicircle')angles[1]=(angles[0]+180)%360;const pts=angles.map(a=>[420+160*Math.cos(a*Math.PI/180),215-160*Math.sin(a*Math.PI/180)]),[a,b,c,d]=pts,o=[420,215];showControl('ctRadii',!['cyclic','tangent'].includes(kind));showControl('ctB',kind!=='semicircle'&&kind!=='tangent');showControl('ctC',kind!=='tangent');showControl('ctD',['segment','cyclic'].includes(kind));
 const ids=kind==='tangent'?[0]:['segment','cyclic'].includes(kind)?[0,1,2,3]:[0,1,2];if(ids.some((i,k)=>ids.slice(k+1).some(j=>Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1])<8)))throw Error('Separate the points around the circle.');
 let s='<circle cx="420" cy="215" r="160" fill="#f4eff9" stroke="#8050b4" stroke-width="3"/>';let rows=[],rule='';
 const corner=(p,v,q,color)=>{let a=Math.atan2(p[1]-v[1],p[0]-v[0]),b=Math.atan2(q[1]-v[1],q[0]-v[0]);while(b-a>Math.PI)b-=2*Math.PI;while(b-a< -Math.PI)b+=2*Math.PI;return angleArc(v,a,b,28,color,shown()?fmt(K.circleAngle(p,v,q),1)+'°':'');};
 const edge=(p,q,color=C.purple)=>polyline([p,q],color),theta=K.circleAngle(a,c,b),thetaD=K.circleAngle(a,d,b);
 if(kind==='tangent'){const t=[-(a[1]-215),a[0]-420],unit=Math.hypot(...t);s+=edge(o,a,C.teal)+edge([a[0]-t[0]/unit*130,a[1]-t[1]/unit*130],[a[0]+t[0]/unit*130,a[1]+t[1]/unit*130],C.gold);rows=[['Angle between radius and tangent','90°']];rule='A tangent is perpendicular to the radius at the point of contact.';}
 else if(kind==='cyclic'){const sorted=angles.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]),q=sorted.map(i=>pts[i]);s+=polyline([...q,q[0]],C.purple)+corner(q[3],q[0],q[1],C.teal)+corner(q[1],q[2],q[3],C.gold);rows=[['Angle at '+ 'ABCD'[sorted[0]],fmt(K.circleAngle(q[3],q[0],q[1]))+'°'],['Opposite angle at '+'ABCD'[sorted[2]],fmt(K.circleAngle(q[1],q[2],q[3]))+'°'],['Sum','180°']];rule='Opposite angles in a cyclic quadrilateral add to 180°.';}
 else {s+=edge(a,c,C.teal)+edge(c,b,C.teal)+edge(a,b)+corner(a,c,b,C.teal);if(kind==='alternate'){const t=[-(a[1]-215),a[0]-420],norm=Math.hypot(...t),q=[a[0]+t[0]/norm*120,a[1]+t[1]/norm*120],q2=[a[0]-t[0]/norm*120,a[1]-t[1]/norm*120],end=Math.abs(K.circleAngle(b,a,q)-theta)<.001?q:q2;s+=edge(q,q2,C.gold)+corner(b,a,end,C.gold);rule='The angle between a tangent and chord equals the angle in the alternate segment.';}if(kind==='segment')s+=edge(a,d,C.gold)+edge(d,b,C.gold)+corner(a,d,b,C.gold);if($('ctRadii').checked||kind==='centre')s+=edge(a,o,C.red)+edge(o,b,C.red);rows=[['∠ACB',fmt(theta)+'°']];if(kind==='centre'){const delta=(angles[1]-angles[0]+360)%360,cpos=(angles[2]-angles[0]+360)%360,sweep=cpos<delta?delta-360:delta;s+=angleArc(o,-angles[0]*Math.PI/180,-(angles[0]+sweep)*Math.PI/180,40,C.red,shown()?fmt(theta*2)+'°':'');}if(kind==='centre')rows.push(['Centre angle on the same arc',fmt(theta*2)+'°']);if(kind==='segment'){const cross=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),same=cross(c)*cross(d)>0;rows.push(['∠ADB',fmt(thetaD)+'°']);rule=same?'C and D are in the same segment: the angles are equal.':'C and D are on opposite sides of chord AB: the angles are supplementary.';}else if(kind!=='alternate')rule=kind==='semicircle'?'AB is a diameter: ∠ACB = 90°.':'The centre angle on the arc opposite C is twice ∠ACB; it may be reflex.';}
 ids.forEach(i=>{const [x,y]=pts[i];s+=`<circle data-circle="${i}" cx="${x}" cy="${y}" r="10" fill="${[C.purple,C.purple,C.teal,C.gold][i]}" stroke="white" stroke-width="3"/>`+txt(420+(x-420)*1.14,215+(y-215)*1.14,'ABCD'[i],21);});s+=txt(420,235,'O',16);if(shown())rows.forEach(([n,v],i)=>s+=txt(420,395+i*20,n+': '+v,16));svg(s,'Draggable circle theorem diagram');formula(rule);results(rows);table(['Relationship','Value'],rows);legend([['A, B: chord endpoints',C.purple],['C',C.teal],['D',C.gold]]);note('Drag a labelled point or use its angle slider. Point labels stay with their points; cyclic order is recomputed when points pass one another. Hide answers to ask students to predict the angles.');};
 const el=$('viz');el.style.touchAction='none';el.onpointerdown=e=>{const hit=e.target.closest('[data-circle]');if(!hit)return;dragging=+hit.dataset.circle;el.setPointerCapture(e.pointerId);};el.onpointermove=e=>{if(dragging===null)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(el.querySelector('svg').getScreenCTM().inverse());let a=Math.atan2(215-p.y,p.x-420)*180/Math.PI;if(a<0)a+=360;$('ct'+'ABCD'[dragging]).value=Math.round(a)%360;run();};el.onpointerup=el.onpointercancel=()=>dragging=null;
}};

// Project every vessel with the same centimetre-to-pixel scale.
const capacityShapes=[['box','Rectangular prism'],['cylinder','Cylinder'],['cone','Cone (point down)'],['sphere','Sphere']];
function vessel(kind,l,w,h,amount){
 let cap=K.capacity(kind,l,w,h);
 if(amount!==null){
  const factor=Math.cbrt(amount/cap);
  l*=factor;w*=factor;h*=factor;cap=amount;
 }
 const width=kind==='box'?l+.46*w:2*l;
 const height=kind==='box'?h+.27*w:kind==='sphere'?2*l:kind==='cone'?h+.2*l:h+.4*l;
 return {kind,l,w,h,cap,width,height};
}
function drawVessel(v,x,base,s,water,layers){
 const f=Math.max(0,Math.min(1,water/v.cap)),level=K.heightFraction(v.kind,f);
 const l=v.l*s,w=v.w*s,h=v.h*s;
 const stroke='#535273', glass='#e8edf7',waterFront='#45a9c7',waterSide='#258ba9',surface='#9be3ed';
 const poly=(points,fill,edge=stroke)=>`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${edge}" stroke-linejoin="round"/>`;
 const ellipse=(cx,cy,rx,ry,fill,edge=stroke)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${edge}"/>`;
 const path=(d,fill='none',edge=stroke)=>`<path d="${d}" fill="${fill}" stroke="${edge}" stroke-linejoin="round"/>`;
 let out='';
 if(v.kind==='box'){
  const dx=.46*w,dy=.27*w,left=x-(l+dx)/2,right=left+l;
  const top=z=>[[left,base-z],[right,base-z],[right+dx,base-z-dy],[left+dx,base-z-dy]];
  const walls=(z,front,side)=>poly([[left,base],[right,base],[right,base-z],[left,base-z]],front)+poly([[right,base],[right+dx,base-dy],[right+dx,base-z-dy],[right,base-z]],side);
  out+=walls(h,glass,'#d3dfed')+poly(top(h),'#f6f8fc');
  if(f>0)out+=walls(h*f,waterFront,waterSide)+poly(top(h*f),surface);
  if(layers){
   const spacing=Math.max(1,Math.ceil(v.h/12));
   for(let z=spacing;z<v.h-1e-9;z+=spacing)out+=path(`M${left} ${base-z*s}h${l}l${dx} ${-dy}`,'none','#91a5b2');
  }
  out+=walls(h,'none','none')+poly(top(h),'none');
 }else if(v.kind==='sphere'){
  const cy=base-l,cos=Math.sqrt(1-.2**2),dz=(2*level-1)*l;
  const radius=Math.sqrt(Math.max(0,l*l-dz*dz)),wy=cy-dz*cos;
  const id='vcBall'+String(x).replace('.','p');
  out+=`<defs><clipPath id="${id}"><circle cx="${x}" cy="${cy}" r="${l}"/></clipPath></defs>`;
  out+=ellipse(x,cy,l,l,glass)+ellipse(x,cy,l*.48,l,'none','#c2cddd')+ellipse(x,cy,l,l*.2,'none','#c2cddd');
  if(f>0){
   // Below the water plane, the silhouette follows the spherical shell.
   const shell=f>=1?ellipse(x,cy,l,l,waterFront):path(`M${x-radius} ${wy}A${radius} ${radius*.2} 0 0 0 ${x+radius} ${wy}L${x+l} ${wy+Math.abs(dz)*.2}V${base}H${x-l}V${wy+Math.abs(dz)*.2}Z`,waterFront,waterFront);
   out+=`<g clip-path="url(#${id})">${shell}${f<1?ellipse(x,wy,radius,radius*.2,surface,waterSide):''}</g>`;
  }
  out+=ellipse(x,cy,l,l,'none');
 }else{
  const cone=v.kind==='cone',ry=.2*l,bottom=cone?base:base-ry,top=bottom-h;
  const wall=(r,y)=>cone?`M${x-r} ${y}L${x} ${bottom}L${x+r} ${y}Z`:`M${x-r} ${y}V${bottom}a${r} ${ry} 0 0 0 ${2*r} 0V${y}Z`;
  out+=path(wall(l,top),glass)+ellipse(x,top,l,ry,'#f5f8fb');
  if(f>0){
   const r=cone?l*level:l,y=bottom-h*level;
   out+=path(wall(r,y),waterFront,waterSide)+ellipse(x,y,r,.2*r,surface,waterSide);
  }
  out+=path(cone?`M${x-l} ${top}L${x} ${bottom}L${x+l} ${top}`:`M${x-l} ${top}V${bottom}a${l} ${ry} 0 0 0 ${2*l} 0V${top}`)+ellipse(x,top,l,ry,'none');
 }
 return `<g stroke-width="1.5">${out}</g>`;
}
function splitVolume(amount,capacity){
 const ratio=amount/capacity,nearest=Math.round(ratio);
 const exact=amount===0 || (nearest>0 && Math.abs(ratio-nearest)<=4*Number.EPSILON*ratio);
 const full=exact?nearest:Math.floor(ratio),last=exact?0:amount-full*capacity;
 return {full,last,count:full+(last>0?1:0)};
}
labs.capacity={title:'Volume & Capacity Lab',tag:'YEARS 7–10 · ESSENTIAL',subtitle:'Compare containers and pour between them.',setup(){
 const shape=(id,label)=>select(id,label,capacityShapes);
 const units=id=>select(id,'Unit',[['mL','mL'],['L','L']]);
 controls(select('vcMode','Specify containers by',[['volume','Capacity'],['dimensions','Dimensions']])+
  shape('vcShape','Source A')+pair(input('vcAmount','Capacity A',1,.001,100000),units('vcUnit'))+
  pair(input('vcL','A length (cm)',10,.1,100),input('vcW','A width (cm)',10,.1,100))+input('vcH','A height (cm)',10,.1,100)+
  shape('vcOther','Receiving container B')+pair(input('vcBAmount','Capacity B',200,.001,100000),units('vcBUnit'))+
  pair(input('vcBL','B length (cm)',5,.1,100),input('vcBW','B width (cm)',5,.1,100))+input('vcBH','B height (cm)',8,.1,100)+
  slider('vcFill','Water in A before pouring (%)',100,0,100,1)+
  '<div class="actions"><button id="vcPlay">Animate fill</button><button id="vcPour">Pour A into B</button><button id="vcReturn">Return water to A</button></div>'+
  input('vcSpeed','Animation speed (% per second)',20,1,100)+check('vcCubes','Show centimetre layers on prisms')+
  '<div hidden><input type="hidden" id="vcPourState" value="0"></div>');
 $('vcUnit').value='L';
 // Shared links created before capacity entry existed specify dimensions.
 $('controls').restoreState=items=>{
  if(items && !items.some(([id])=>id==='vcMode') && items.some(([id])=>id==='vcL'))$('vcMode').value='dimensions';
 };
 const owner=$('vcPour'),state=$('vcPourState');
 let motion='',frame=0,stamp=null,fill=100,signature='',model=null;
 const stop=()=>{cancelAnimationFrame(frame);frame=0;stamp=null;motion=''};
 const progress=()=>Math.max(0,Math.min(1,Number(state.value)||0));
 const label=ml=>Math.abs(ml)>=1000?fmt(ml/1000,3)+' L':Number(ml.toPrecision(5))+' mL';
 function readVessel(source,byVolume){
  const kind=$(source?'vcShape':'vcOther').value,prefix=source?'vc':'vcB';
  for(const suffix of ['Amount','Unit'])showControl(prefix+suffix,byVolume);
  for(const [suffix,visible] of [['L',true],['W',kind==='box'],['H',kind!=='sphere']])showControl(prefix+suffix,!byVolume&&visible);
  document.querySelector('label[for="'+prefix+'L"]').textContent=(source?'A ':'B ')+(kind==='box'?'length':'radius')+' (cm)';
  if(byVolume){
   const amount=value(prefix+'Amount')*($(prefix+'Unit').value==='L'?1000:1);
   return vessel(kind,1,1,kind==='box'?1:2,amount);
  }
  return vessel(kind,value(prefix+'L'),kind==='box'?value(prefix+'W'):1,kind==='sphere'?1:value(prefix+'H'),null);
 }
 function buttons(){
  $('vcPlay').textContent=motion==='fill'?'Pause fill':'Animate fill';
  owner.textContent=motion==='pour'?'Pause pour':progress()>=1?'Replay pour':progress()>0?'Resume pour':'Pour A into B';
  owner.disabled=!model||!model.water;
  $('vcReturn').disabled=progress()===0&&motion!=='pour';
 }
 function start(which){
  if(!model || $('error').textContent)return;
  if(motion===which){stop();run();return}
  stop();
  if(which==='fill'){
   fill=Number($('vcFill').value);if(fill>=100)fill=0;
   $('vcFill').value=Math.round(fill);$('vcFillval').textContent=$('vcFill').value;state.value='0';
  }else if(progress()>=1)state.value='0';
  motion=which;run();frame=requestAnimationFrame(tick);
 }
 function tick(t){
  if(!motion||current!=='capacity'||$('vcPour')!==owner){stop();return}
  if(stamp===null)stamp=t;
  const dt=t-stamp;
  if(dt>=32){
   stamp=t;const move=Math.min(dt,150)*model.speed/1000;
   if(motion==='fill'){
    fill=Math.min(100,fill+move);$('vcFill').value=Math.round(fill);$('vcFillval').textContent=$('vcFill').value;
    const exact=$('vcFill').parentElement.querySelector('.ux-range-value');if(exact)exact.value=$('vcFill').value;
    model.water=model.a.cap*fill/100;if(fill===100)stop();
   }else{
    state.value=Math.min(1,progress()+move/100);if(progress()>=1)stop();
   }
   if(!motion){run();return}render();
  }
  frame=requestAnimationFrame(tick);
 }
 $('vcPlay').onclick=()=>start('fill');owner.onclick=()=>start('pour');
 $('vcReturn').onclick=()=>{stop();state.value='0';run()};
 $('vcFill').oninput=()=>{stop();state.value='0'};
 function render(){
  const {a,b,water}=model,p=progress(),sent=water*p,remaining=water-sent;
  const plan=splitVolume(water,b.cap),done=splitVolume(sent,b.cap),needed=Math.max(1,plan.count);
  const active=Math.min(needed-1,done.full),perPage=Math.min(6,needed),first=Math.floor(active/perPage)*perPage;
  const slot=552/perPage,scale=Math.min(184/a.width,152/a.height,(slot-14)/b.width,148/b.height);
  const startX=258,base=340,sourceX=121,sourceBase=211;
  const xFor=i=>startX+(i-first+.5)*slot,activeX=xFor(active),top=base-b.height*scale;
  const textAt=(x,y,s,size=16)=>`<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${size}" fill="#44324e">${esc(s)}</text>`;
  let pic=textAt(sourceX,32,'Source A',19)+textAt(530,32,'Receiving containers · '+label(b.cap)+' each',19);
  pic+=textAt(sourceX,55,label(a.cap)+' capacity',15);
  const tapX=sourceX+(a.kind==='cone'||a.kind==='sphere'?0:a.width*scale*.24);
  pic+=`<path d="M${tapX} ${sourceBase-3}v18 Q${tapX} ${sourceBase+23} ${tapX+10} ${sourceBase+23} C${tapX+85} ${sourceBase+23} ${activeX} ${top-50} ${activeX} ${top-13}" fill="none" stroke="#97abb9" stroke-width="5" stroke-linecap="round"/>`;
  pic+=drawVessel(a,sourceX,sourceBase,scale,remaining,$('vcCubes').checked);
  pic+=textAt(sourceX,270,shown()?label(remaining)+' in A':'A',17);
  for(let i=first;i<Math.min(first+perPage,needed);i++){
   const x=xFor(i),held=i<done.full?b.cap:i===done.full?done.last:0;
   pic+=drawVessel(b,x,base,scale,held,$('vcCubes').checked)+textAt(x,base+24,'B'+(i+1),16);
   if(shown())pic+=textAt(x,base+46,label(held),14);
  }
  if(motion==='pour'&&p<1){
   const fraction=done.last/b.cap,depth=K.heightFraction(b.kind,fraction);
   const offset=b.kind==='box'?.135*b.w:b.kind==='cylinder'?.2*b.l:0;
   const end=base-scale*(offset+(b.kind==='sphere'?2*b.l:b.h)*depth);
   pic+=`<path d="M${activeX} ${top-12}V${Math.max(top,end-2)}" stroke="#39aec9" stroke-width="3" stroke-linecap="round"/>`;
  }
  if(needed>perPage)pic+=textAt(535,422,'Showing B'+(first+1)+'–B'+Math.min(first+perPage,needed)+' of '+needed.toLocaleString(),15);
  svg(pic,'Source and receiving containers drawn to a common scale, with water levels');
  const ml=v=>Number(v.toPrecision(8)).toLocaleString('en-AU',{maximumSignificantDigits:8});
  if(p>=1 && shown())formula(ml(water)+' mL = '+done.full.toLocaleString()+' × '+ml(b.cap)+' mL'+(done.last?' + '+ml(done.last)+' mL':''));
  else formula('1 cm³ = 1 mL     ·     1,000 mL = 1 L');
  buttons();results([ ['Source capacity',label(a.cap)],['Total water',label(water)],['Transferred',label(sent)],['Receivers needed',String(plan.count)],['Full receivers',String(done.full)],['Partly filled receiver',label(done.last)]]);
  const rows=[['A',1,label(a.cap),label(remaining)]];
  if(done.full)rows.push(['B · full',done.full,label(b.cap),label(b.cap)]);
  if(done.last>0)rows.push(['B · part full',1,label(b.cap),label(done.last)]);
  const empty=needed-done.count;if(empty)rows.push(['B · empty',empty,label(b.cap),'0 mL']);
  table(['Container','Count','Capacity each','Water in each'],rows);
 }
 update=()=>{
  let a,b,water,speed;
  try{
   const byVolume=$('vcMode').value==='volume';a=readVessel(true,byVolume);b=readVessel(false,byVolume);
   water=a.cap*value('vcFill')/100;speed=value('vcSpeed');
  }catch(e){stop();model=null;buttons();throw e}
  const next=[a.kind,a.l,a.w,a.h,b.kind,b.l,b.w,b.h].join('|');
  if(signature&&next!==signature){stop();state.value='0'}signature=next;
  model={a,b,water,speed};render();
  note('All containers use the same scale. Water moves into the next receiver when the current one is full.');
 };
}};

const timetable='Bus 1,Lakelands,Station,08:05,08:17\nBus 2,Lakelands,Station,08:20,08:32\nTrain 1,Station,City,08:22,09:12\nTrain 2,Station,City,08:37,09:27\nShuttle 1,City,Museum,09:20,09:35\nShuttle 2,City,Museum,09:35,09:50\nExpress,Lakelands,Museum,08:15,09:45';
labs.journeys={title:'Timetable & Journey Planner',tag:'YEARS 7–10 · ESSENTIAL',subtitle:'Plan the connections, not just the travel.',setup(){
 controls(area('jpData','Service, from, to, departure, arrival',timetable)+field('jpFrom','Start stop','Lakelands')+field('jpTo','Destination','Museum')+field('jpReady','Ready to leave (HH:MM)','08:00')+field('jpDeadline','Arrive by (HH:MM)','09:40')+input('jpTransfer','Minimum transfer time (minutes)',5,0,120,1)+input('jpRoute','Route number',1,1,500,1)+slider('jpProgress','Journey progress (%)',0,0,100,1)+'<button id="jpPlay">Play / pause journey</button>'+input('jpSpeed','Playback speed (journey % / second)',10,1,100));
 let playing=false,last=0,progress=0;$('jpPlay').onclick=()=>{playing=!playing;last=0;if(playing){if(+$('jpProgress').value>=100)$('jpProgress').value=0;progress=+$('jpProgress').value;requestAnimationFrame(tick);}};
 function tick(t){if(!playing||current!=='journeys'){playing=false;return;}if(last){progress=Math.min(100,progress+(t-last)/1000*value('jpSpeed'));$('jpProgress').value=Math.round(progress);if(+$('jpProgress').value>=100)playing=false;run();}last=t;if(playing)requestAnimationFrame(tick);}
 update=()=>{const ready=K.clock($('jpReady').value),deadline=K.clock($('jpDeadline').value),r=K.journeys($('jpData').value,$('jpFrom').value.trim(),$('jpTo').value.trim(),ready,value('jpTransfer'));$('jpRoute').max=Math.max(1,r.routes.length);if(+$('jpRoute').value>r.routes.length)$('jpRoute').value=1;const route=r.routes[value('jpRoute')-1];formula('Departure → travel → transfer → arrival');legend([['Travel',C.teal],['Waiting / transfer',C.gold]]);if(!route){svg(txt(420,210,'No feasible connection. Change the times or transfer allowance.',19),'No connection');results([]);table(['Service','From','To','Departure','Arrival'],r.trips.map(t=>[t.service,t.from,t.to,K.time(t.dep),K.time(t.arr)]));note('No route meets the current start time and transfer requirements.');return;}
 const X=t=>90+(t-ready)/Math.max(1,route.duration)*650,now=ready+route.duration*value('jpProgress')/100;let s='';route.legs.forEach((leg,i)=>{const y=65+i*55,prev=i?route.legs[i-1].arr:ready;s+=`<path d="M${X(prev)} ${y}H${X(leg.dep)}" stroke="${C.gold}" stroke-width="10" stroke-dasharray="3 5"/><path d="M${X(leg.dep)} ${y}H${X(leg.arr)}" stroke="${C.teal}" stroke-width="12" stroke-linecap="round"/>`+txt(420,y-16,`${leg.service}: ${leg.from} → ${leg.to}`,17)+txt(X(leg.dep),y+23,K.time(leg.dep),13)+txt(X(leg.arr),y+23,K.time(leg.arr),13);});s+=`<path d="M${X(now)} 35V380" stroke="${C.red}" stroke-width="2" stroke-dasharray="5 5"/>`+txt(420,415,'Clock: '+K.time(Math.round(now)),21);svg(s,'Journey timeline with travel and waiting');results([['Feasible routes',r.routes.length],['Arrival',K.time(route.arrival)],['Total journey',route.duration+' min'],['Waiting / transfers',route.waiting+' min'],['Deadline',route.arrival<=deadline?'On time':'Late by '+(route.arrival-deadline)+' min']]);table(['Route','Services','Arrival','Travel (min)','Waiting (min)','Meets deadline'],r.routes.map((v,i)=>[i+1,v.legs.map(l=>l.service).join(' → '),K.time(v.arrival),v.duration-v.waiting,v.waiting,v.arrival<=deadline?'Yes':'No']));note('Editable fictional teaching timetable, not live transport information. Routes are ordered by arrival time. Transfer allowance applies between services. For overnight connections use 24:00–47:59 for next-day departures and deadlines.');};}};
})();
