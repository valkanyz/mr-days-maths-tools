// Shared input and drawing conventions for the Network Lab.
const NetworkGraph = {
  parse(text) {
    const vertices = new Set(), edges = [];
    for (const line of text.trim().split(/\n/)) {
      if (!line.trim()) continue;
      const parts = line.trim().split(/[\s,]+/);
      const [a, b, weight] = parts;
      const valid = name => /^[A-Za-z0-9]{1,8}$/.test(name);
      if (!valid(a) || (parts.length !== 1 && (parts.length !== 3 || !valid(b)
          || !Number.isFinite(+weight) || +weight <= 0 || +weight > 1e6))) {
        throw Error('Enter an edge such as A B 4 or an isolated vertex such as C.');
      }
      vertices.add(a);
      if (parts.length === 3) { vertices.add(b); edges.push([a,b,+weight]); }
    }
    if (!vertices.size || vertices.size > 12 || edges.length > 40) throw Error('Use 1–12 vertices and up to 40 edges.');
    return {names:[...vertices], edges};
  },
  matrix(names, edges, directed) {
    const rows = names.map(() => names.map(() => 0));
    for (const [a,b] of edges) {
      const i=names.indexOf(a), j=names.indexOf(b);
      rows[i][j]++;
      if (!directed && i !== j) rows[j][i]++;
    }
    return rows;
  },
  positions(names) {
    return Object.fromEntries(names.map((v,i) => {
      const angle = 2*Math.PI*i/names.length - Math.PI/2;
      return [v,names.length===1 ? [420,220] : [420+268*Math.cos(angle),220+134*Math.sin(angle)]];
    }));
  },
  bipartition(names, edges) {
    const neighbours = new Map(names.map(name => [name, []]));
    for (const [a,b] of edges) {
      neighbours.get(a).push(b);
      neighbours.get(b).push(a);
    }
    const sides = new Map();
    for (const root of names) {
      if (sides.has(root)) continue;
      sides.set(root, 0);
      const queue = [root];
      for (const a of queue) {
        const side = sides.get(a);
        for (const b of neighbours.get(a)) {
          if (sides.get(b) === side) return null;
          if (sides.has(b)) continue;
          sides.set(b, 1 - side);
          queue.push(b);
        }
      }
    }
    return [0,1].map(side => names.filter(name => sides.get(name) === side));
  },
  columns(parts) {
    const points = Object.fromEntries(parts.flatMap((part, side) => part.map((name, i) =>
      [name, [side ? 625 : 215, 65 + (i + .5) * 340 / part.length]]
    )));
    const radius = Math.min(22, 145 / Math.max(...parts.map(part => part.length)));
    return {points, radius};
  },
  prim(names, edges, start) {
    const visited = new Set(), accepted = [], steps = [];
    const ordered = [...edges].sort((a,b) => a[2] - b[2]);
    let components = 0;
    for (const root of [start, ...names.filter(name => name !== start)]) {
      if (visited.has(root)) continue;
      components++;
      visited.add(root);
      let edge = ordered.find(([a,b]) => visited.has(a) !== visited.has(b));
      let prefix = 'Start at ' + root + '. ';
      while (edge) {
        const [a,b,w] = edge, next = visited.has(a) ? b : a;
        visited.add(next);
        accepted.push(edge);
        steps.push({edge, accepted:[...accepted],
          label:prefix + 'Add ' + a + '–' + b + ' (' + w + '), the cheapest edge to an unvisited vertex. Visit ' + next + '.'});
        prefix = '';
        edge = ordered.find(([a,b]) => visited.has(a) !== visited.has(b));
      }
    }
    return {steps, accepted, components};
  },
  draw(names,edges,directed,style,degrees,showWeights=true,layout) {
    const points=layout?.points ?? this.positions(names), radius=layout?.radius ?? 22, groups=new Map();
    for (const edge of edges) {
      const key=edge.slice(0,2).sort().join('|');
      if (!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(edge);
    }
    let paths='', labels='';
    for (const [i,edge] of edges.entries()) {
      const [a,b,w]=edge, [x,y]=points[a], [u,v]=points[b];
      const group=groups.get([a,b].sort().join('|')), slot=group.indexOf(edge);
      let path,lx,ly;
      if (a===b) {
        const angle=Math.atan2(y-220,x-420)+(slot-(group.length-1)/2)*Math.min(.85,2*Math.PI/group.length);
        const at=(along,side)=>[x+along*Math.cos(angle)-side*Math.sin(angle),y+along*Math.sin(angle)+side*Math.cos(angle)];
        path='M'+at(18,-13)+' C'+at(78,-46)+' '+at(78,46)+' '+at(18,13);
        [lx,ly]=at(65,0);
      } else {
        const dx=u-x,dy=v-y,len=Math.hypot(dx,dy);
        const bend=(slot-(group.length-1)/2)*Math.min(50,300/group.length)*(a<b?1:-1);
        const cx=(x+u)/2-dy/len*bend,cy=(y+v)/2+dx/len*bend;
        const trim=(px,py)=>{const d=Math.hypot(cx-px,cy-py);return [px+(radius+1)*(cx-px)/d,py+(radius+1)*(cy-py)/d]};
        const start=trim(x,y),end=trim(u,v);
        path='M'+start+' Q'+[cx,cy]+' '+end;
        lx=(start[0]+2*cx+end[0])/4; ly=(start[1]+2*cy+end[1])/4;
      }
      const {color=C.purple,width=2,label=fmt(w)}=style(i,edge);
      paths+='<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"'+(directed?' marker-end="url(#arrow)"':'')+'/>';
      if(showWeights) labels+='<text x="'+lx+'" y="'+(ly+4)+'" text-anchor="middle" font-size="14" stroke="white" stroke-width="4" paint-order="stroke">'+esc(label)+'</text>';
    }
    for(const name of names) {
      const [x,y]=points[name];
      labels+='<circle cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="'+C.purple+'"/>'+'<text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="'+(layout?Math.min(14,4*radius/name.length):14)+'" fill="white">'+esc(name)+'</text>';
      if(degrees){
        const incoming=edges.filter(e=>e[1]===name).length,outgoing=edges.filter(e=>e[0]===name).length;
        const label=directed?'in '+incoming+' · out '+outgoing:'deg '+(incoming+outgoing);
        const offset=layout ? (x<420 ? -radius-8 : radius+8) : 0;
        const anchor=layout ? (offset<0 ? 'end' : 'start') : 'middle';
        labels+='<text x="'+(x+offset)+'" y="'+(y+(layout?5:38))+'" text-anchor="'+anchor+'" font-size="14" stroke="white" stroke-width="4" paint-order="stroke">'+label+'</text>';
      }
    }
    return paths+labels;
  }
};
