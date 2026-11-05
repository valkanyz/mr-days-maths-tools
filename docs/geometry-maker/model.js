(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function corner(a,b,c){let start=Math.atan2(a[1]-b[1],a[0]-b[0]),end=Math.atan2(c[1]-b[1],c[0]-b[0]);while(end-start>Math.PI)end-=2*Math.PI;while(end-start< -Math.PI)end+=2*Math.PI;return {start,end,degrees:Math.abs(end-start)*180/Math.PI};}
function preset(type,id){const templates={triangle:[[350,500],[750,500],[540,220]],right:[[350,500],[750,500],[350,220]],rectangle:[[350,240],[750,240],[750,500],[350,500]],trapezium:[[420,240],[680,240],[780,500],[320,500]],parallelogram:[[440,240],[800,240],[680,500],[320,500]],line:[[350,400],[750,400]],angle:[[750,400],[450,400],[650,220]],circle:[[550,380],[730,380]],sector:[[550,380],[730,380],[640,380-90*Math.sqrt(3)]],point:[[520,360]],text:[[520,360]],parallel:[[300,270],[800,270],[300,490],[800,490]],angleArc:[[470,390],[550,390],[600,280]]};const points=templates[type].map(p=>p.slice());return{id,type,points,labels:points.map(()=>''),edges:[],angles:[],offsets:{},text:type==='text'?'Label':'',radius:type==='circle',dashed:false};}
const edges=o=>['text','point','angleArc'].includes(o.type)?[]:o.type==='circle'?o.radius?[[0,1]]:[]:o.type==='line'?[[0,1]]:o.type==='angle'?[[0,1],[1,2]]:o.type==='parallel'?[[0,1],[2,3]]:o.type==='sector'?[[0,1],[0,2]]:o.points.map((_,i)=>[i,(i+1)%o.points.length]);
// Choose the nearest other vertex before applying the coarser editing grid.

const excludes=(o,id)=>Array.isArray(id)?id.includes(o.id):id instanceof Set?id.has(o.id):o.id===id;
function snapPoint(point,objects,excludedId,tolerance=18,grid=false){
 let best=null,nearest=tolerance;
 for(const o of objects){if(excludes(o,excludedId)||o.type==='text')continue;
  for(const p of o.points){const d=dist(point,p);if(d<=nearest){nearest=d;best=p.slice();}}
 }
 if(best)return {point:best,target:best,kind:'vertex'};
 nearest=tolerance;
 for(const o of objects){if(excludes(o,excludedId)||['text','circle','angleArc'].includes(o.type))continue;
  for(const [i,j] of edges(o)){const a=o.points[i],b=o.points[j],dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy;
   if(len2<1)continue;const t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/len2));
   if(t<=.001||t>=.999)continue;
   const q=[a[0]+t*dx,a[1]+t*dy],d=dist(point,q);
   if(d<=nearest){nearest=d;best=q;}
  }
 }
 return {point:best||point.map(v=>grid?Math.round(v/20)*20:v),target:best,kind:best?'segment':null};
}
function snapAlignedPoint(point,anchor,objects,excludedId,tolerance=18){
 let best=null,near=tolerance;
 for(const o of objects){if(excludes(o,excludedId)||['text','circle','angleArc'].includes(o.type))continue;
  for(const [i,j] of edges(o)){const a=o.points[i],b=o.points[j],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
   if(len<1)continue;const ux=dx/len,uy=dy/len,vx=point[0]-anchor[0],vy=point[1]-anchor[1],dot=vx*ux+vy*uy;
   const q=[anchor[0]+dot*ux,anchor[1]+dot*uy],d=dist(point,q);
   if(d<near&&Math.abs(dot)>25){near=d;best=q;}
  }
 }
 return best?{point:best,target:best,kind:'alignment'}:{point,target:null,kind:null};
}
function snapTranslation(points,delta,objects,excludedId,tolerance=18,grid=false){
 let best=null,distance=tolerance;
 for(const p of points){const moved=[p[0]+delta[0],p[1]+delta[1]],hit=snapPoint(moved,objects,excludedId,tolerance);
  if(hit.target&&dist(moved,hit.target)<=distance){distance=dist(moved,hit.target);best={delta:[hit.target[0]-p[0],hit.target[1]-p[1]],target:hit.target};}
 }
 return best||{delta:delta.map(v=>grid?Math.round(v/20)*20:v),target:null};
}
function constructAngle(first,firstEdge,second,secondEdge){
 const e1=edges(first)[firstEdge],e2=edges(second)[secondEdge];if(!e1||!e2)return null;
 const a=first.points[e1[0]],b=first.points[e1[1]],c=second.points[e2[0]],d=second.points[e2[1]];
 const u=[b[0]-a[0],b[1]-a[1]],v=[d[0]-c[0],d[1]-c[1]],det=u[0]*v[1]-u[1]*v[0];
 if(Math.abs(det)<1e-8)return null;
 const ac=[c[0]-a[0],c[1]-a[1]],t=(ac[0]*v[1]-ac[1]*v[0])/det,centre=[a[0]+t*u[0],a[1]+t*u[1]];
 if(!centre.every(x=>Number.isFinite(x)&&Math.abs(x)<10000))return null;
 function ray(p,q){const end=dist(p,centre)>dist(q,centre)?p:q,d=dist(end,centre);if(d<1)return null;return [centre[0]+(end[0]-centre[0])*Math.min(120/d,1),centre[1]+(end[1]-centre[1])*Math.min(120/d,1)];}
 const x=ray(a,b),y=ray(c,d);return x&&y?[x,centre,y]:null;
}
function bounds(o){
 const ps=o.points;let minX=Math.min(...ps.map(p=>p[0])),minY=Math.min(...ps.map(p=>p[1])),maxX=Math.max(...ps.map(p=>p[0])),maxY=Math.max(...ps.map(p=>p[1]));
 if(o.type==='circle'){const r=dist(ps[0],ps[1]);minX=ps[0][0]-r;maxX=ps[0][0]+r;minY=ps[0][1]-r;maxY=ps[0][1]+r;}
 return [minX,minY,maxX,maxY];
}
function render(state,selected=null,editing=false){const [W,H]=state.page==='portrait'?[800,1100]:state.page==='square'?[900,900]:[1200,800],size=state.fontSize,width=state.lineWidth;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Geometry test diagram" style="background:white;font-family:Arial,Helvetica,sans-serif"><rect width="100%" height="100%" fill="white"/>`;
 if(editing&&state.grid){s+='<g data-editor="true" stroke="#e7e7e7" stroke-width="1">';for(let x=20;x<W;x+=20)s+=`<path d="M${x} 0V${H}"/>`;for(let y=20;y<H;y+=20)s+=`<path d="M0 ${y}H${W}"/>`;s+='</g>';}
 const text=(o,key,x,y,value)=>{if(!value)return '';const d=o.offsets[key]||[0,0];return `<text data-shape="${o.id}" data-label="${key}" x="${x+d[0]}" y="${y+d[1]}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" text-anchor="middle" dominant-baseline="middle" fill="black" stroke="white" stroke-width="5" paint-order="stroke">${esc(value)}</text>`;};
 for(const o of state.objects){const pts=o.points,es=edges(o),dash=o.dashed?' stroke-dasharray="10 7"':'';s+=`<g data-shape="${o.id}">`;
 if(editing){s+='<g data-editor="true" fill="transparent" stroke="transparent" stroke-width="18">';if(o.type==='point')s+=`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="10"/>`;else if(o.type==='circle')s+=`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${dist(...pts)}"/>`;else if(['triangle','right','rectangle','trapezium','parallelogram'].includes(o.type))s+=`<polygon points="${pts.map(p=>p.join(',')).join(' ')}"/>`;else es.forEach(([i,j])=>s+=`<path d="M${pts[i]}L${pts[j]}"/>`);s+='</g>';}
 if(o.type==='point')s+=`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="4" fill="black"/>`;
 if(o.type==='circle'){const r=dist(...pts);s+=`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${r}" fill="none" stroke="black" stroke-width="${width}"${dash}/>`;}
 if(o.type==='sector'){const r=dist(pts[0],pts[1]),angle=corner(pts[1],pts[0],pts[2]),end=[pts[0][0]+r*Math.cos(angle.end),pts[0][1]+r*Math.sin(angle.end)];s+=`<path d="M${pts[1]}A${r} ${r} 0 0 ${angle.end>angle.start?1:0} ${end}" fill="none" stroke="black" stroke-width="${width}"${dash}/>`;}
 es.forEach(([i,j],k)=>{const a=pts[i],b=pts[j],e=o.edges[k]||{},len=dist(a,b)||1,n=[-(b[1]-a[1])/len,(b[0]-a[0])/len],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],edgeDash=e.dashed||o.dashed?' stroke-dasharray="10 7"':'';s+=`<path data-edge="${k}" d="M${a}L${b}" fill="none" stroke="black" stroke-width="${width}"${edgeDash}/>`;
 const tick=Math.min(3,e.ticks||0);for(let t=0;t<tick;t++){const along=(t-(tick-1)/2)*9,x=mid[0]+(b[0]-a[0])/len*along,y=mid[1]+(b[1]-a[1])/len*along;s+=`<path d="M${x-n[0]*8} ${y-n[1]*8}L${x+n[0]*8} ${y+n[1]*8}" stroke="black" stroke-width="${width}"/>`;}
 if(e.parallel){const u=[(b[0]-a[0])/len,(b[1]-a[1])/len];for(let t=0;t<e.parallel;t++){const x=mid[0]+u[0]*t*13,y=mid[1]+u[1]*t*13;s+=`<path d="M${x-u[0]*9+n[0]*6} ${y-u[1]*9+n[1]*6}L${x} ${y}L${x-u[0]*9-n[0]*6} ${y-u[1]*9-n[1]*6}" fill="none" stroke="black" stroke-width="${width}"/>`;}}
 s+=text(o,'e'+k,mid[0]+n[0]*30,mid[1]+n[1]*30,e.label||'');});
 const polygon=!['line','circle','text','point','parallel','sector','angleArc'].includes(o.type);const corners=['angle','angleArc'].includes(o.type)?[1]:o.type==='sector'?[0]:polygon?pts.map((_,i)=>i):[];
 corners.forEach(i=>{const v=pts[i],a=o.type==='sector'?pts[1]:pts[(i-1+pts.length)%pts.length],b=o.type==='sector'?pts[2]:pts[(i+1)%pts.length],mark=o.angles[i]||{},arc=corner(a,v,b);if(!mark.mark&&!mark.label&&!mark.showMeasure)return;const radius=mark.mark==='right'?23:38,m=(arc.start+arc.end)/2;
 if(mark.mark==='right'){const u=[Math.cos(arc.start),Math.sin(arc.start)],w=[Math.cos(arc.end),Math.sin(arc.end)];s+=`<path d="M${v[0]+radius*u[0]} ${v[1]+radius*u[1]}L${v[0]+radius*(u[0]+w[0])} ${v[1]+radius*(u[1]+w[1])}L${v[0]+radius*w[0]} ${v[1]+radius*w[1]}" fill="none" stroke="black" stroke-width="${width}"/>`;}
 else if(mark.mark==='arc')s+=`<path d="M${v[0]+radius*Math.cos(arc.start)} ${v[1]+radius*Math.sin(arc.start)}A${radius} ${radius} 0 0 ${arc.end>arc.start?1:0} ${v[0]+radius*Math.cos(arc.end)} ${v[1]+radius*Math.sin(arc.end)}" fill="none" stroke="black" stroke-width="${width}"/>`;
 s+=text(o,'a'+i,v[0]+(radius+30)*Math.cos(m),v[1]+(radius+30)*Math.sin(m),(mark.showMeasure?(Number(arc.degrees.toFixed(1))+'°'):(mark.label||'')));});
 if(o.type==='text')s+=text(o,'text',pts[0][0],pts[0][1],o.text);else pts.forEach((p,i)=>{const centre=pts.reduce((a,b)=>[a[0]+b[0]/pts.length,a[1]+b[1]/pts.length],[0,0]),d=dist(p,centre)||1;s+=text(o,'v'+i,p[0]+(p[0]-centre[0])/d*32,p[1]+(o.type==='point'?-28:(p[1]-centre[1])/d*32),o.labels[i]);});
 s+='</g>';}
 const selectedIds=Array.isArray(selected)?selected:selected instanceof Set?[...selected]:[selected];
 if(editing){for(const active of state.objects.filter(o=>selectedIds.includes(o.id))){s+='<g data-editor="true">';active.points.forEach((p,i)=>s+=`<circle data-shape="${active.id}" data-point="${i}" cx="${p[0]}" cy="${p[1]}" r="8" fill="white" stroke="#555" stroke-width="2"/>`);s+='</g>';}}

 if(state.nts)s+=`<text x="${W-30}" y="${H-30}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.max(18,size-6)}" text-anchor="end" fill="black">Not drawn to scale</text>`;
 return s+'</svg>';
}
function valid(s){
 const str=v=>typeof v==='string'&&v.length<=200,point=p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<10000),optional=(v,test)=>v===undefined||test(v);
 return !!(s&&['landscape','portrait','square'].includes(s.page)&&Number.isFinite(s.fontSize)&&s.fontSize>=12&&s.fontSize<=60&&Number.isFinite(s.lineWidth)&&s.lineWidth>=1&&s.lineWidth<=6&&Array.isArray(s.objects)&&s.objects.length<=60&&new Set(s.objects.map(o=>o?.id)).size===s.objects.length&&s.objects.every(o=>o&&['triangle','right','rectangle','trapezium','parallelogram','line','angle','angleArc','circle','sector','text','point','parallel'].includes(o.type)&&Number.isSafeInteger(o.id)&&Array.isArray(o.points)&&o.points.length===preset(o.type,0).points.length&&o.points.every(point)&&Array.isArray(o.labels)&&o.labels.length<=o.points.length&&o.labels.every(str)&&Array.isArray(o.edges)&&o.edges.length<=o.points.length&&o.edges.every(e=>e===null||(e&&optional(e.label,str)&&optional(e.ticks,v=>Number.isInteger(v)&&v>=0&&v<=3)&&optional(e.parallel,v=>Number.isInteger(v)&&v>=0&&v<=2)&&optional(e.dashed,v=>typeof v==='boolean')))&&Array.isArray(o.angles)&&o.angles.length<=o.points.length&&o.angles.every(a=>a===null||(a&&optional(a.label,str)&&optional(a.mark,v=>['none','arc','right'].includes(v))&&optional(a.showMeasure,v=>typeof v==='boolean') ))&&o.offsets&&typeof o.offsets==='object'&&Object.keys(o.offsets).length<=40&&Object.values(o.offsets).every(point)&&str(o.text)));
}
const api={snapPoint,snapAlignedPoint,snapTranslation,constructAngle,bounds,preset,edges,corner,dist,render,valid,esc};root.GeometryMaker=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
