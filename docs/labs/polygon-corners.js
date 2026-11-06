// Draw a simple polygon and move its interior sectors into full turns and a final straight angle.
const PolygonCorners = (() => {
  const tau=2*Math.PI, colours=['#7946ad','#008577','#c56120','#3476b7','#b44269','#6b8136','#974b28','#5446a4','#137c98','#ac493b'];
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function segmentDistance(p,a,b){
    const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));
    return distance(p,[a[0]+t*dx,a[1]+t*dy]);
  }
  function valid(points,closed){
    const n=points.length,count=closed?n:n-1;
    for(let i=0;i<n;i++){
      for(let j=i+1;j<n;j++)if(distance(points[i],points[j])<14)return false;
      for(let j=0;j<count;j++){
        const k=(j+1)%n;
        if(i!==j&&i!==k&&segmentDistance(points[i],points[j],points[k])<2)return false;
      }
    }
    for(let i=0;i<count;i++)for(let j=i+1;j<count;j++){
      const a=points[i],b=points[(i+1)%n],c=points[j],d=points[(j+1)%n];
      if(cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0)return false;
    }
    return true;
  }
  function geometry(points){
    const n=points.length,clockwise=points.reduce((sum,p,i)=>sum+cross([0,0],p,points[(i+1)%n]),0)>0;
    let radius=32;
    points.forEach((p,i)=>{
      radius=Math.min(radius,distance(p,points[(i+1)%n])*.43);
      points.forEach((q,j)=>{if(i!==j && i!==(j+1)%n)radius=Math.min(radius,.8*segmentDistance(p,q,points[(j+1)%n]));});
    });
    let total=0;
    return points.map((p,i)=>{
      const prev=points[(i+n-1)%n],next=points[(i+1)%n];
      const bearing=q=>Math.atan2(q[1]-p[1],q[0]-p[0]);
      const start=bearing(clockwise?next:prev),end=bearing(clockwise?prev:next);
      const angle=(end-start+tau)%tau,parts=[];
      let used=0;
      while(used<angle-1e-9){
        const group=Math.floor((total+1e-9)/tau),offset=Math.max(0,total-group*tau);
        const span=Math.min(angle-used,tau-offset);
        parts.push({group,offset,span,source:start+used});used+=span;total+=span;
      }
      return {p,start,angle,parts,radius,label:String.fromCharCode(65+i),colour:colours[i]};
    });
  }
  function sector(x,y,r,start,span){
    const at=t=>[x+r*Math.cos(t),y+r*Math.sin(t)];
    return 'M'+[x,y]+'L'+at(start)+'A'+[r,r]+' 0 '+(span>Math.PI?1:0)+' 1 '+at(start+span)+'Z';
  }
  function mount(){
    let points=[],closed=false,progress=0,frame=0,message='',corners=[];
    const controlsBox=$('cornerTools');
    const time=2100;
    function stop(){cancelAnimationFrame(frame);frame=0;}
    function clear(){stop();points=[];corners=[];closed=false;progress=0;message='';run();}
    function close(){
      if(points.length<3)return;
      if(!valid(points,true)){message='The closing side crosses or touches another side. Undo the last vertex and try again.';run();return;}
      closed=true;corners=geometry(points);message='';run();
    }
    function play(){
      if(frame){stop();draw();return;}
      if(progress>=1)progress=0;
      const start=performance.now()-progress*time;
      function tick(t){
        if(current!=='angles'||$('cornerTools')!==controlsBox||$('angleMode').value!=='customPolygon'){stop();return;}
        progress=Math.min(1,(t-start)/time);frame=progress<1?requestAnimationFrame(tick):0;draw();
      }
      frame=requestAnimationFrame(tick);draw();
    }
    $('cornerClose').onclick=close;$('cornerNew').onclick=clear;$('cornerPlay').onclick=play;
    $('cornerUndo').onclick=()=>{stop();if(closed){closed=false;corners=[];}else points.pop();progress=0;message='';run();};
    $('cornerReturn').onclick=()=>{stop();progress=0;draw();};
    function draw(){
      const n=points.length,show=$('numbers').checked&&$('reveal').checked;
      const t=progress*progress*(3-2*progress),groups=Math.ceil((n-2)/2),cols=Math.min(4,Math.max(1,groups)),rows=Math.ceil(groups/cols);
      const targetR=Math.min(97,320/cols,115/Math.max(1,rows)*1.5);
      const target=k=>[420+((k%cols)-(Math.min(cols,groups-Math.floor(k/cols)*cols)-1)/2)*(2*targetR+26),rows===1?(groups===1&&n===3?257:215):145+Math.floor(k/cols)*177];
      let s='';
      if(closed){
        const holes=corners.map(c=>'<path fill="black" d="'+sector(...c.p,c.radius,c.start,c.angle)+'"/>').join('');
        s+='<defs><mask id="polygonCut"><rect width="840" height="440" fill="white"/>'+holes+'</mask></defs>';
        s+='<polygon points="'+points.join(' ')+'" fill="#eae1f1" stroke="#634771" stroke-width="3" mask="url(#polygonCut)" opacity="'+(1-t)+'"/>';
        for(let k=0;k<groups;k++){
          const [x,y]=target(k),half=k===groups-1&&n%2===1;
          const outline=half?'<path d="M'+(x-targetR-5)+' '+y+'h'+(2*targetR+10)+'" stroke="#46394f" stroke-width="2"/>':'<circle cx="'+x+'" cy="'+y+'" r="'+(targetR+1)+'" fill="none" stroke="#46394f"/>';
          s+='<g opacity="'+t+'">'+outline+txt(x,y+(half?0:targetR)+30,half?(show?'180°':'Straight angle'):(show?'360°':'Full turn'),17)+'</g>';
        }
        for(const c of corners){
          for(const part of c.parts){
            const [u,v]=target(part.group),x=c.p[0]*(1-t)+u*t,y=c.p[1]*(1-t)+v*t;
            const r=c.radius*(1-t)+targetR*t,rotation=((Math.PI+part.offset-part.source+3*Math.PI)%tau)-Math.PI,start=part.source+rotation*t;
            s+='<path d="'+sector(x,y,r,start,part.span)+'" fill="'+c.colour+'" stroke="'+(t>.05?'white':c.colour)+'" stroke-width="1.1"/>';
            if(t>.55&&r*part.span>18){const mid=start+part.span/2;s+=txt(x+r*.72*Math.cos(mid),y+r*.72*Math.sin(mid)+4,c.label,13,'white');}
          }
          if(t<.6)s+='<g opacity="'+(1-t/.6)+'">'+txt(c.p[0],c.p[1]-8,c.label,17,'#292330')+'</g>';
        }
      }else{
        s+='<rect x="12" y="12" width="816" height="416" rx="10" fill="#fcfaff" stroke="#d8cbe2" stroke-dasharray="5 5"/>';
        if(!n)s+=txt(420,217,'Tap or click to place the first vertex',21,'#776382');
        s+='<polyline points="'+points.join(' ')+'" fill="none" stroke="#674c79" stroke-width="3"/>';
        points.forEach(([x,y],i)=>{s+='<circle cx="'+x+'" cy="'+y+'" r="'+(i===0?8:5)+'" fill="'+colours[i]+'"/>'+txt(x,y-11,String.fromCharCode(65+i),16);});
      }
      svg(s,'Custom polygon and its interior angles');const plot=$('viz').querySelector('svg');
      if(!closed)plot.onclick=e=>{
        const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(plot.getScreenCTM().inverse()),q=[p.x,p.y];
        if(!Number.isFinite(p.x)||p.x<15||p.x>825||p.y<24||p.y>420)return;
        if(n>=3&&distance(q,points[0])<15){close();return;}
        if(n>=10)message='Close the polygon or undo a vertex. The maximum is 10 vertices.';
        else if(!valid([...points,q],false))message='Place a distinct vertex so that the sides do not cross or overlap.';
        else{points.push(q);message='';}run();
      };
      $('cornerPlay').textContent=frame?'Pause':progress>=1?'Replay rearrangement':progress?'Resume':'Cut and rearrange';
      $('cornerReturn').disabled=!progress&&!frame;
    }
    function update(){
      controlsBox.hidden=false;
      $('cornerClose').hidden=closed;$('cornerClose').disabled=points.length<3;
      $('cornerUndo').disabled=!points.length;$('cornerUndo').textContent=closed?'Reopen polygon':'Undo vertex';
      $('cornerPlay').hidden=$('cornerReturn').hidden=!closed;
      const n=points.length,total=(n-2)*180,show=$('numbers').checked&&$('reveal').checked;
      draw();legend([]);results([]);table(['Vertex','Interior angle'],closed&&show?corners.map(c=>[c.label,fmt(c.angle*180/Math.PI,1)+'°']):[]);
      formula(closed&&show?'('+n+' − 2) × 180° = '+total+'°':'');
      note(message||(closed?'Match the letters and colours as the corners move. A corner that spans two groups keeps its colour in both groups.':'Place 3–10 vertices in order. Click the first vertex or choose Close polygon to join the last side.'));
    }
    return {update,stop};
  }
  return {mount,geometry,valid};
})();
