(function upgradeTriangleAngles(){
 function arcAt(v,a,b,r,col,label=''){
  let start=Math.atan2(a[1]-v[1],a[0]-v[0]),delta=Math.atan2(b[1]-v[1],b[0]-v[0])-start;
  delta=(delta+3*Math.PI)%(2*Math.PI)-Math.PI;
  return sectorArc(v,start,start+delta,r,col,label);
 }
 function sectorArc(v,start,end,r,color,label='',sw=3){
  const x=t=>[v[0]+r*Math.cos(t),v[1]+r*Math.sin(t)],a=x(start),b=x(end),m=(start+end)/2;
  return `<path d="M${a}A${r} ${r} 0 ${Math.abs(end-start)>Math.PI?1:0} ${end>start?1:0} ${b}" fill="none" stroke="${color}" stroke-width="${sw}" />`+(label?txt(v[0]+(r+21)*Math.cos(m),v[1]+(r+21)*Math.sin(m)+5,label,14,color):'');
 }
 function angleOf(a,v,b){const u=[a[0]-v[0],a[1]-v[1]],w=[b[0]-v[0],b[1]-v[1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(Math.hypot(...u)*Math.hypot(...w)))))*180/Math.PI;}
 function tick(a,b,colour){const m=[(a[0]+b[0])/2,(a[1]+b[1])/2],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;return `<path d="M${m[0]-nx*10},${m[1]-ny*10}L${m[0]+nx*10},${m[1]+ny*10}" stroke="${colour}" stroke-width="3" />`;}
 function wheel(values,cols,completed,show){
  const c=[680,226],r=88,inner=66;let d='',t=-Math.PI/2;
  values.forEach((value,i)=>{const end=t+value*Math.PI/180,a=[c[0]+r*Math.cos(t),c[1]+r*Math.sin(t)],b=[c[0]+r*Math.cos(end),c[1]+r*Math.sin(end)],fill=i<completed?cols[i%cols.length]:'#dddddd';
   d+=`<path d="M${c}L${a}A${r} ${r} 0 0 1 ${b}Z" fill="${fill}" fill-opacity="${i<completed?.32:.08}" stroke="${fill}" stroke-width="1.5"/>`;
   if(i<completed)d+=sectorArc(c,t,end,inner,cols[i%cols.length],'',4);
   t=end;
  });
  const total=values.slice(0,completed).reduce((a,b)=>a+b,0);
  d+=txt(c[0],c[1]-9,show?`${fmt(total,1)}°`:'Σ turns',20,C.purple)+txt(c[0],c[1]+21,`${completed} of ${values.length} turns`,14,'#333');
  d+=txt(c[0],c[1]+120,'One full revolution = 360°',17,'#333');
  return d;
 }
 function combineWedges(vals,cols,total,caption,show){
  const c=[665,248],r=73;let d='',t=Math.PI;
  vals.forEach((value,i)=>{const end=t+value*Math.PI/180;d+=sectorArc(c,t,end,r,cols[i],show?`${fmt(value,1)}°`:'',5);t=end;});
  d+=sectorArc(c,Math.PI,Math.PI+total*Math.PI/180,r+31,C.red,show?`${fmt(total,1)}°`:'',4);
  d+=txt(c[0],372,caption,16,'#333');
  return d;
 }
 labs.angles.setup=()=>{
  let pts=[[190,330],[650,330],[360,90]],lastRule='sum';
  const palette=[C.purple,C.teal,C.gold,C.blue,C.red];
  controls(select('angleMode','Diagram',[['triangle','Triangle'],['parallel','Parallel lines'],['polygon','Regular polygon']])
   +select('triangleRule','Triangle theorem',[['sum','Interior angle sum'],['exterior','Exterior angle theorem'],['isosceles','Isosceles base angles'],['exteriorSum','Exterior angle sum (360°)']])
   +select('exteriorCorner','Exterior angle at',[['0','A'],['1','B'],['2','C']])
   +slider('theta','Transversal angle',60,25,155,1)+input('sides','Number of sides',5,3,12,1)
   +check('corresponding','Corresponding',true)+check('opposite','Vertically opposite')
   +check('cointerior','Co-interior')+check('alternate','Alternate')
   +check('exterior','Show exterior angles')+check('numbers','Show angle values',true)
   +slider('turnStep','Walk around the shape: turns completed',0,0,12,1)+btn('nextTurn','Next exterior turn'));
  $('nextTurn').onclick=()=>{const n=$('angleMode').value==='triangle'?3:value('sides');$('turnStep').value=(+value('turnStep')+1)%(n+1);$('turnStepval').textContent=$('turnStep').value;run();};
  update=()=>{
   const mode=$('angleMode').value,rule=$('triangleRule').value,show=revealed()&&$('numbers').checked,walk=mode==='polygon'||mode==='triangle'&&rule==='exteriorSum',isIso=mode==='triangle'&&rule==='isosceles';
   for(const id of ['theta','corresponding','opposite','cointerior','alternate'])showControl(id,mode==='parallel');
   showControl('triangleRule',mode==='triangle');showControl('exteriorCorner',mode==='triangle'&&rule==='exterior');
   showControl('sides',mode==='polygon');showControl('exterior',mode==='triangle'&&rule==='sum');
   showControl('turnStep',walk);$('nextTurn').hidden=!walk;
   if(isIso&&lastRule!==rule)pts=[[220,335],[620,335],[420,100]];
   lastRule=rule;
   let s='',rows=[],leg=[],summary=[],description='';
   if(mode==='parallel'){
    const a=value('theta')*Math.PI/180,cot=1/Math.tan(a),top=[420+70*cot,150],bottom=[420-70*cot,290];
    s=path([[70,150],[770,150]],'#8f7a9f')+path([[70,290],[770,290]],'#8f7a9f')+path([[420+190*cot,30],[420-190*cot,410]],'#493354');
    const pairs=[['corresponding','Corresponding',C.purple,top,-a,0,bottom,-a,0],['opposite','Vertically opposite',C.teal,top,-a,0,top,Math.PI-a,Math.PI],['cointerior','Co-interior',C.red,top,0,Math.PI-a,bottom,-a,0],['alternate','Alternate',C.blue,top,Math.PI-a,Math.PI,bottom,-a,0]];
    pairs.forEach(([id,label,col,p,lo,hi,q,l,h],i)=>{if($(id).checked){s+=sectorArc(p,lo,hi,18+i*9,col,show?`${fmt((hi-lo)*180/Math.PI)}°`:'')+sectorArc(q,l,h,18+i*9,col,show?`${fmt((h-l)*180/Math.PI)}°`:'');leg.push([label,col]);rows.push([label,fmt((hi-lo)*180/Math.PI)+'°',fmt((h-l)*180/Math.PI)+'°',id==='cointerior'?'Sum = 180°':'Equal']);}});
    s+=handle(420+110*cot,110,'angle');summary=rows.map(r=>[r[0],r[3]]);
    description='Drag the transversal. Corresponding and alternate angles are equal; co-interior angles sum to 180°.';
    formula('Angle relationships in parallel lines');
    svg(s,'Parallel lines and transversal angle relationships');legend(leg);results(summary);table(['Relationship','Angle 1','Angle 2','Rule'],rows);note(description);return;
   }
   const n=mode==='triangle'?3:value('sides');
   const p=mode==='triangle'?pts:Array.from({length:n},(_,i)=>[300+137*Math.sin(i*2*Math.PI/n),218-137*Math.cos(i*2*Math.PI/n)]);
   const angles=p.map((v,i)=>angleOf(p[(i+n-1)%n],v,p[(i+1)%n])),outside=angles.map(v=>180-v),cols=p.map((_,i)=>palette[i%palette.length]);
   const exteriorAt=mode==='triangle'?value('exteriorCorner'):0;
   const countField=$('turnStep');countField.max=n;if(+countField.value>n)countField.value=n;
   $('turnStepval').textContent=countField.value;
   const turns=walk?value('turnStep'):0;
   s=path([...p,p[0]],'#444');
   for(let i=0;i<n;i++){
    const v=p[i],prev=p[(i+n-1)%n],next=p[(i+1)%n],col=cols[i],rad=mode==='triangle'?27:19;
    const emphasise=rule==='sum'||rule==='isosceles'||mode==='polygon'||rule==='exteriorSum'||i!==exteriorAt;
    let interiorCol=col;
    if(isIso&&i<2)interiorCol=C.teal;
    if(mode==='triangle'&&rule==='exterior'&&i===exteriorAt)interiorCol='#999999';
    if(emphasise||mode==='triangle'&&rule==='exterior')s+=arcAt(v,prev,next,rad,interiorCol,show?`${fmt(angles[i],1)}°`:'');
    const outsideWanted=mode==='polygon'||rule==='exteriorSum'||rule==='exterior'&&i===exteriorAt||rule==='sum'&&$('exterior').checked&&i===exteriorAt;
    if(outsideWanted){
     const dx=v[0]-prev[0],dy=v[1]-prev[1],len=Math.hypot(dx,dy),ext=[v[0]+dx/len*66,v[1]+dy/len*66],highlight=walk?i<turns:rule==='exterior'&&i===exteriorAt;
     s+=path([v,ext],highlight?C.red:'#999');
     s+=arcAt(v,ext,next,mode==='triangle'?40:28,highlight?C.red:col,show?`${fmt(outside[i],1)}°`:'');
     if(walk&&i===Math.max(0,turns-1))s+=`<circle cx="${v[0]}" cy="${v[1]}" r="17" fill="none" stroke="${C.red}" stroke-width="3" />`;
    }
    if(mode==='triangle')s+=handle(...v,i,isIso&&i<2?C.teal:col);
    rows.push([String.fromCharCode(65+i),fmt(angles[i],1)+'°',fmt(outside[i],1)+'°']);
   }
   if(isIso){
    s+=tick(p[2],p[0],C.teal)+tick(p[2],p[1],C.teal);
    s+=txt(660,160,'Equal sides',21,C.teal);
    s+=txt(660,213,'Base angles are equal',18,C.teal);
    s+=txt(660,261,show?`${fmt(angles[0],1)}° = ${fmt(angles[1],1)}°`:'∠A = ∠B',23,C.purple);
    s+=txt(660,319,'Drag the vertices',15,'#444');
    formula('Isosceles triangle: equal sides have equal opposite base angles.');
    summary=[['Left base angle',fmt(angles[0],1)+'°'],['Right base angle',fmt(angles[1],1)+'°'],['Equal sides','AC = BC']];
    description='Move the apex or either base corner. The two equal sides stay the same length, and the base angles stay equal.';
    leg=[['Equal sides and base angles',C.teal]];
   }else if(mode==='triangle'&&rule==='exterior'){
    const remote=[0,1,2].filter(i=>i!==exteriorAt),ext=outside[exteriorAt],total=angles[remote[0]]+angles[remote[1]];
    s+=combineWedges(remote.map(i=>angles[i]),remote.map(i=>cols[i]),total,'The remote interior angles join together',show);
    formula(`Exterior angle at ${String.fromCharCode(65+exteriorAt)} = sum of the two remote interior angles`);
    summary=[['First remote interior angle',fmt(angles[remote[0]],1)+'°'],['Second remote interior angle',fmt(angles[remote[1]],1)+'°'],['Their sum',fmt(total,1)+'°'],['Exterior angle',fmt(ext,1)+'°']];
    description='The two coloured remote interior angles are placed together on the right, where they make exactly the exterior angle. Drag a triangle vertex to see the relationship stay true.';
    leg=[['Remote interior angles',cols[remote[0]]],['Exterior angle',C.red]];
   }else if(mode==='triangle'&&rule==='sum'){
    s+=combineWedges(angles,cols,180,'Three interior angles make a straight angle',show);
    formula('Interior angle sum: ∠A + ∠B + ∠C = 180°');
    summary=[['∠A',fmt(angles[0],1)+'°'],['∠B',fmt(angles[1],1)+'°'],['∠C',fmt(angles[2],1)+'°'],['Sum',fmt(angles.reduce((a,b)=>a+b,0),1)+'°']];
    description='The three interior angles are copied together on the right to form a straight angle. Drag any vertex: the sum remains 180°.';
    leg=[['Angle A',cols[0]],['Angle B',cols[1]],['Angle C',cols[2]]];
   }else{
    const total=outside.slice(0,turns).reduce((a,b)=>a+b,0);
    s+=wheel(outside,cols,turns,show);
    formula('Walk around the shape: each exterior angle is a turn. A complete circuit is 360°.');
    summary=[['Turns completed',`${turns} of ${n}`],['Turned so far',fmt(total,1)+'°'],['Exterior angle sum',fmt(outside.reduce((a,b)=>a+b,0),1)+'°']];
    description='Move the “Turns completed” slider or click Next exterior turn. Each turn fills another sector of the circle. Once you go all the way around, the total turn is 360°, regardless of the number of sides.';
    leg=[['Completed exterior turns',C.red]];
   }
   svg(s,'Drag vertices to investigate triangle and polygon angle theorems');
   legend(leg);results(summary);table(['Vertex','Interior angle','Exterior angle'],rows);note(description);
  };
  dragSVG((id,x,y)=>{
   if(id==='angle'){$('theta').value=Math.max(25,Math.min(155,Math.atan2(220-y,x-420)*180/Math.PI));$('thetaval').textContent=$('theta').value;return;}
   if($('angleMode').value!=='triangle')return;
   const idx=+id,isIso=$('triangleRule').value==='isosceles';
   let next=pts.map(q=>q.slice());next[idx]=[Math.max(95,Math.min(745,x)),Math.max(75,Math.min(355,y))];
   if(isIso){
    const a=next[0],b=next[1],base=[b[0]-a[0],b[1]-a[1]],length=Math.hypot(...base);
    if(length<120)return;
    const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],normal=[-base[1]/length,base[0]/length];
    let height;
    if(idx===2){height=(next[2][0]-mid[0])*normal[0]+(next[2][1]-mid[1])*normal[1];height=Math.min(-60,height);}
    else{const oldMid=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2],oldBase=[pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]],oldLen=Math.hypot(...oldBase);height=((pts[2][0]-oldMid[0])*(-oldBase[1])+(pts[2][1]-oldMid[1])*oldBase[0])/oldLen;}
    next[2]=[mid[0]+normal[0]*height,mid[1]+normal[1]*height];
   }
   const area=Math.abs((next[1][0]-next[0][0])*(next[2][1]-next[0][1])-(next[1][1]-next[0][1])*(next[2][0]-next[0][0]));
   if(area>4000)pts=next;
  });
 };
 if(current==='angles')launch('angles');
})();
