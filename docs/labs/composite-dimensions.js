/* Dimension lines for the exposed outline, including cut-outs and curved edges. */
(function(root) {
'use strict';
const TAU=2*Math.PI,step=28;
const screen=point=>point.map(n=>28+n*step);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const equal=(a,b)=>distance(a,b)<1e-7;
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
const subtract=(a,b)=>a.map((n,i)=>n-b[i]);
function straightSides(boundaries) {
 const edges=boundaries.filter(edge=>edge.type==='line').map(edge=>edge.interiorLeft
  ?{a:edge.a,b:edge.b}:{a:edge.b,b:edge.a});
 let merged=true;
 while(merged){
  merged=false;
  for(let i=0;i<edges.length&&!merged;i++)for(let j=0;j<edges.length;j++){
   if(i===j||!equal(edges[i].b,edges[j].a))continue;
   const a=subtract(edges[i].b,edges[i].a),b=subtract(edges[j].b,edges[j].a);
   if(Math.abs(cross(a,b))>1e-7||a[0]*b[0]+a[1]*b[1]<=0)continue;
   edges[i].b=edges[j].b;edges.splice(j,1);merged=true;break;
  }
 }
 return edges;
}
function extent(boundaries) {
 const points=[];
 for(const edge of boundaries){
  if(edge.type==='line'){points.push(edge.a,edge.b);continue;}
  const angles=[edge.start,edge.end];
  for(let i=0;i<4;i++){
   const angle=i*Math.PI/2;
   const delta=((angle-edge.start)%TAU+TAU)%TAU;
   if(delta<=edge.end-edge.start+1e-8)angles.push(angle);
  }
  points.push(...angles.map(a=>[edge.cx+edge.r*Math.cos(a),edge.cy+edge.r*Math.sin(a)]));
 }
 if(!points.length)return null;
 return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
  top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
}
function render(measurement,pieces,options) {
 const box=extent(measurement.boundaries);
 if(!box)return '';
 const number=n=>Number(n.toFixed(3)).toString();
 const unit=options.unit==='units'?' units':' '+options.unit;
 const label=n=>number(n)+unit;
 const stroke='#1c2530';
 const text=(x,y,value,anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="17" fill="'+stroke+'" stroke="white" stroke-width="6" paint-order="stroke">'+value+'</text>';
 const line=(a,b,style='')=>'<path d="M'+a+'L'+b+'" fill="none" stroke="'+stroke+'" stroke-width="1.5" '+style+'/>';
 function dimension(a,b,offset) {
  const length=distance(a,b),normal=[(b[1]-a[1])/length,-(b[0]-a[0])/length];
  const p=a.map((n,i)=>n+normal[i]*offset),q=b.map((n,i)=>n+normal[i]*offset);
  const extension=offset>0?4:-4;
  const pEnd=p.map((n,i)=>n+normal[i]*extension),qEnd=q.map((n,i)=>n+normal[i]*extension);
  const outward=normal.map(n=>n*Math.sign(offset));
  const mid=p.map((n,i)=>(n+q[i])/2+outward[i]*17);
  const anchor=Math.abs(outward[0])>.9?(outward[0]<0?'end':'start'):'middle';
  return line(a,pEnd,'opacity=".45"')+line(b,qEnd,'opacity=".45"')
   +line(p,q,'marker-start="url(#composite-dimension-arrow)" marker-end="url(#composite-dimension-arrow)"')
   +text(mid[0],mid[1],label(length/step),anchor);
 }
 let svg='<defs><marker id="composite-dimension-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0L5 5L0 10" fill="none" stroke="'+stroke+'" stroke-width="1.6"/></marker></defs><g data-composite-dimensions="true" pointer-events="none">';
 const width=box.right-box.left,height=box.bottom-box.top;
 if(options.overall){
  if(width>1e-7)svg+=dimension(screen([box.left,box.bottom]),screen([box.right,box.bottom]),-58);
  if(height>1e-7)svg+=dimension(screen([box.left,box.top]),screen([box.left,box.bottom]),-58);
 }
 if(options.sides)for(const edge of straightSides(measurement.boundaries)){
  const dx=edge.b[0]-edge.a[0],dy=edge.b[1]-edge.a[1],length=distance(edge.a,edge.b);
  // Overall dimensions already supply a straight side that spans the whole shape.
  if(options.overall&&((Math.abs(dy)<1e-7&&Math.abs(length-width)<1e-7)
   ||(Math.abs(dx)<1e-7&&Math.abs(length-height)<1e-7)))continue;
  if(length<.5)continue;
  svg+=dimension(screen(edge.a),screen(edge.b),22);
 }
 const circles=new Set();
 for(const arc of measurement.boundaries.filter(edge=>edge.type==='arc')){
  const key=[arc.cx,arc.cy,arc.r].map(n=>n.toFixed(7)).join(',');
  if(circles.has(key))continue;
  circles.add(key);
  const candidates=measurement.boundaries.filter(e=>e.type==='arc'
   &&Math.hypot(e.cx-arc.cx,e.cy-arc.cy)<1e-7&&Math.abs(e.r-arc.r)<1e-7);
  const longest=candidates.reduce((a,b)=>b.end-b.start>a.end-a.start?b:a);
  const angle=(longest.start+longest.end)/2;
  const centre=screen([arc.cx,arc.cy]),end=screen([arc.cx+arc.r*Math.cos(angle),arc.cy+arc.r*Math.sin(angle)]);
  svg+=line(centre,end,'marker-end="url(#composite-dimension-arrow)"')
   +'<circle cx="'+centre[0]+'" cy="'+centre[1]+'" r="2.5" fill="'+stroke+'"/>'
   +text((centre[0]+end[0])/2+Math.sin(angle)*15,(centre[1]+end[1])/2-Math.cos(angle)*15,'r = '+label(arc.r));
  const sector=pieces.find(p=>p.kind==='sector'&&Math.abs(p.r-arc.r)<1e-7
   &&Math.abs(p.x+p.r-arc.cx)<1e-7&&Math.abs(p.y+p.r-arc.cy)<1e-7);
  if(sector&&sector.angle<360){
   const total=candidates.reduce((sum,e)=>sum+e.end-e.start,0);
   const span=sector.angle*Math.PI/180;
   if(Math.abs(total-span)<1e-7){
    const start=-Math.PI/2+(sector.rotation||0)*Math.PI/180,endAngle=start+span;
    const radius=Math.min(22,arc.r*step*.3);
    const point=a=>[centre[0]+radius*Math.cos(a),centre[1]+radius*Math.sin(a)];
    svg+='<path d="M'+point(start)+'A'+radius+','+radius+' 0 '+(span>Math.PI?1:0)+' 1 '+point(endAngle)+'" fill="none" stroke="'+stroke+'" stroke-width="1.2"/>'
     +text(centre[0]+(radius+20)*Math.cos((start+endAngle)/2),centre[1]+(radius+20)*Math.sin((start+endAngle)/2),number(sector.angle)+'°');
   }
  }
 }
 return svg+'</g>';
}
const api={render,straightSides,extent};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.CompositeDimensions=api;
})(typeof window!=='undefined'?window:globalThis);
