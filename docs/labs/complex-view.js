// Complex-number labels, polar grid and draggable inputs.
(()=>{
const exactNumber=x=>{
 if(Math.abs(x)<1e-10)return '0';
 for(let d=1;d<=24;d++){const n=Math.round(x*d);if(Math.abs(x-n/d)<1e-10)return d===1?String(n):`${n}/${d}`;}
 for(const k of [2,3,5,6,7,10,11,13])for(let d=1;d<=12;d++){const n=Math.round(x*d/Math.sqrt(k));if(n&&Math.abs(x-n*Math.sqrt(k)/d)<1e-10)return `${n<0?'−':''}${Math.abs(n)===1?'':Math.abs(n)}√${k}${d===1?'':'/'+d}`;}
 return '≈ '+fmt(x,4);
};
const angleText=(t,exact)=>{if(t===null)return 'Undefined';if(!exact)return fmt(t*180/Math.PI,2)+'°';for(let d=1;d<=24;d++){const n=Math.round(t/Math.PI*d);if(Math.abs(t-n*Math.PI/d)<1e-10)return n===0?'0':`${n<0?'−':''}${Math.abs(n)===1?'':Math.abs(n)}π${d===1?'':'/'+d}`;}return '≈ '+fmt(t*180/Math.PI,3)+'°';};
const previous=labs.complex.setup;
labs.complex.setup=function(){
 previous();$('controls').insertAdjacentHTML('beforeend',check('complexSnap','Snap to grid',false)+check('complexExact','Exact values',false));
 let graph=null,drag=null;
 update=()=>{
 const polar=$('complexForm').value==='polar',snap=$('complexSnap').checked,exact=$('complexExact').checked;
 for(const id of ['modulus','argument'])showControl(id,polar);for(const id of ['re','im'])showControl(id,!polar);
 if(polar){let r=value('modulus'),t=value('argument');if(snap){r=Math.round(r*2)/2;t=Math.round(t/15)*15;$('modulus').value=r;$('argument').value=t;}$('re').value=r*Math.cos(t*Math.PI/180);$('im').value=r*Math.sin(t*Math.PI/180);}
 else if(snap)for(const id of ['re','im'])$(id).value=Math.round(value(id)*2)/2;
 const z=[value('re'),value('im')],w=[value('wr'),value('wi')],op=$('operation').value,n=value('power'),roots=op==='roots',usesW=['add','subtract','multiply','divide'].includes(op);
 $('power').disabled=!['power','roots'].includes(op);$('wr').disabled=$('wi').disabled=!usesW;
 const out=roots?M.roots(z,n):[M.complex(z,w,op,n)],all=[z,...(usesW?[w]:[]),...out];if(all.some(p=>M.norm(p)>1e12))throw Error('Result is too large to display. Reduce the power.');
 const num=x=>exact?exactNumber(x):fmt(x,3),arg=p=>M.norm(p)<1e-10?null:Math.atan2(p[1],p[0]),cart=p=>`${num(p[0])} ${p[1]<0?'−':'+'} ${num(Math.abs(p[1]))}i`,label=p=>polar?`r = ${num(M.norm(p))}, θ = ${angleText(arg(p),exact)}`:cart(p);
 let g,s='';
 if(polar){const max=Math.max(1,...all.map(M.norm)),raw=max/4,mag=10**Math.floor(Math.log10(raw)),step=([1,2,5,10].find(v=>v*mag>=raw)||10)*mag,R=Math.ceil(max/step)*step,scale=158/R;g={X:x=>420+x*scale,Y:y=>220-y*scale,inverse:(x,y)=>[(x-420)/scale,(220-y)/scale]};
 for(let r=step;r<=R+step/100;r+=step)s+=`<circle cx="420" cy="220" r="${r*scale}" fill="none" stroke="#d6c9e2"/><text x="${425+r*scale}" y="216" font-size="12" fill="#6e537e">${num(r)}</text>`;
 for(let deg=0;deg<360;deg+=15){const t=deg*Math.PI/180,x=Math.cos(t),y=Math.sin(t);s+=`<path d="M420 220L${420+158*x} ${220-158*y}" stroke="${deg%90===0?'#9d86ad':'#e5deec'}"/>`;if(deg%30===0)s+=`<text x="${420+180*x}" y="${225-180*y}" text-anchor="middle" font-size="13" fill="#6e537e">${exact?angleText(deg>180?t-2*Math.PI:t,true):deg+'°'}</text>`;}
 s+='<text x="650" y="225" font-size="14">Re</text><text x="420" y="18" text-anchor="middle" font-size="14">Im</text>';
 }else{g=chart(...padded([0,...all.map(p=>p[0])]),...padded([0,...all.map(p=>p[1])]),'Real','Imaginary',true);s=g.s;g.inverse=(x,y)=>[(x-60)/750*(g.xmax-g.xmin)+g.xmin,(390-y)/365*(g.ymax-g.ymin)+g.ymin];}
 graph=g;
 const entries=[['z',z,C.purple,'z'],...(usesW?[['w',w,C.blue,'w']]:[]),...out.map((p,i)=>[roots?'k = '+i:({add:'z + w',subtract:'z − w',multiply:'z × w',divide:'z ÷ w',power:'zⁿ',conjugate:'z̄'}[op]),p,C.teal,''])];
 entries.forEach(([name,p,col,handle],i)=>{const x=g.X(p[0]),y=g.Y(p[1]);s+=line(g,[0,0],p,col)+`<circle ${handle?`data-complex-drag="${handle}" style="cursor:grab"`:''} cx="${x}" cy="${y}" r="${handle?7:5}" fill="${col}" stroke="white" stroke-width="1.5"><title>${esc(name+' = '+label(p))}</title></circle>`;const same=entries.slice(0,i).filter(e=>Math.hypot(g.X(e[1][0])-x,g.Y(e[1][1])-y)<28).length;s+=`<text x="${Math.max(70,Math.min(760,x+10))}" y="${Math.max(30,Math.min(390,y-12+same*20))}" font-size="15" fill="${col}" stroke="white" stroke-width="4" paint-order="stroke" pointer-events="none">${esc(name)}</text>`;});
 // Full values stay in a labelled key so longer exact expressions never overlap the graph.
 s+=entries.slice(0,3).map(([name,p,col],i)=>`<text x="${i*275+12}" y="438" font-size="12" fill="${col}">${esc(name+' : '+label(p))}</text>`).join('');
 svg(s,polar?'Polar grid of complex values and results':'Labelled Argand diagram');
 formula(roots?'Roots: r¹⁄ⁿ cis((θ + 2kπ) / n)':'z = r(cos θ + i sin θ)');
 results([['|z|',num(M.norm(z))],['arg z',angleText(arg(z),exact)],['z',cart(z)],[roots?'Distinct roots':'Result',roots?out.length:cart(out[0])]]);
 legend([['z',C.purple],...(usesW?[['w',C.blue]]:[]),['Result / roots',C.teal]]);
 note('Drag z or w to move it. Snapping uses ½-unit steps'+(polar?' and 15° angles.':'.')+' Exact values show recognised fractions, surds and multiples of π; other values are marked ≈. Zero has undefined argument.');
 table(['Value','Cartesian form','Modulus','Argument'],entries.map(([name,p])=>[name,cart(p),num(M.norm(p)),angleText(arg(p),exact)]));
 };
 const viz=$('viz');viz.style.touchAction='none';
 viz.onpointerdown=e=>{const handle=e.target.closest('[data-complex-drag]');if(!handle)return;drag={id:handle.dataset.complexDrag,graph};viz.setPointerCapture(e.pointerId);e.preventDefault();};
 viz.onpointermove=e=>{if(!drag)return;const root=viz.querySelector('svg'),pt=root.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(root.getScreenCTM().inverse());let [x,y]=drag.graph.inverse(p.x,p.y);const polar=$('complexForm').value==='polar',snap=$('complexSnap').checked;
 if(polar){let r=Math.min(10,Math.hypot(x,y)),t=Math.atan2(y,x);if(snap){r=Math.round(r*2)/2;t=Math.round(t/(Math.PI/12))*Math.PI/12;}x=r*Math.cos(t);y=r*Math.sin(t);if(drag.id==='z'){$('modulus').value=r;$('argument').value=t*180/Math.PI;}}
 else {x=Math.max(-10,Math.min(10,x));y=Math.max(-10,Math.min(10,y));if(snap){x=Math.round(x*2)/2;y=Math.round(y*2)/2;}}
 $(drag.id==='z'?'re':'wr').value=x;$(drag.id==='z'?'im':'wi').value=y;run();};
 viz.onpointerup=e=>{if(!drag)return;drag=null;if(viz.hasPointerCapture(e.pointerId))viz.releasePointerCapture(e.pointerId);$('re').dispatchEvent(new Event('change',{bubbles:true}));};viz.onpointercancel=()=>{drag=null;};
};
if(current==='complex')launch('complex');
})();
