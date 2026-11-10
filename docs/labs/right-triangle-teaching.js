// Keep the side colours consistent across the diagrams and the ratio working.
const RightTriangleTeaching = (() => {
  const sides = {
    a: {name:'Opp', full:'Opposite', colour:'#204fc0'},
    b: {name:'Adj', full:'Adjacent', colour:'#087455'},
    c: {name:'Hyp', full:'Hypotenuse', colour:'#bd284a'}
  };
  const ratios = [
    {fn:'sin', mnemonic:'SOH', top:'a', bottom:'c'},
    {fn:'cos', mnemonic:'CAH', top:'b', bottom:'c'},
    {fn:'tan', mnemonic:'TOA', top:'a', bottom:'b'}
  ];
  const edges = [[1,2,'a'],[0,2,'b'],[0,1,'c']];

  function sideLabel(key, length, display, reveal) {
    return sides[key].name + (reveal ? ' = ' + display(length) : '');
  }

  function angleMark(points, angle, display) {
    const [[x,y],[hx,hy],[bx,by]] = points;
    const hyp = Math.hypot(hx-x,hy-y), adj = Math.hypot(bx-x,by-y);
    const ux = (bx-x)/adj, uy = (by-y)/adj, vx = (hx-x)/hyp, vy = (hy-y)/hyp;
    const r = Math.min(32, .26*adj, .26*hyp);
    const sweep = ux*vy-uy*vx > 0 ? 1 : 0;
    const mid = Math.atan2(uy+vy,ux+vx), labelRadius = r+24;
    return '<path d="M'+(x+r*ux)+','+(y+r*uy)+' A'+r+','+r+' 0 0 '+sweep+' '+(x+r*vx)+','+(y+r*vy)+'" fill="none" stroke="#5e476e" stroke-width="2"/>'
      + '<text x="'+(x+labelRadius*Math.cos(mid))+'" y="'+(y+labelRadius*Math.sin(mid))+'" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#493455" stroke="white" stroke-width="4" paint-order="stroke">'+(display(angle))+'°</text>';
  }

  function comparison(T, factor, display, reveal) {
    const scale = 258 / Math.max(T.c, T.c*factor);
    return [1,factor].map((multiple,i) => {
      const x = 36+420*i, y = 358, w = T.b*multiple*scale, h = T.a*multiple*scale;
      const pts = [[x,y],[x+w,y-h],[x+w,y]];
      const square = Math.min(15,w*.2,h*.2);
      const label = (key,lx,ly,align) => '<text x="'+lx+'" y="'+ly+'" text-anchor="'+align+'" fill="'+sides[key].colour+'" font-size="17">'+sideLabel(key,T[key]*multiple,display,reveal)+'</text>';
      const heading = i ? 'Triangle 2 · ×'+display(factor) : 'Triangle 1';
      return '<text x="'+(x+158)+'" y="49" text-anchor="middle" font-size="22" fill="#493455">'+heading+'</text>'
        + edges.map(([a,b,key])=>'<path d="M'+pts[a].join(',')+'L'+pts[b].join(',')+'" stroke="'+sides[key].colour+'" stroke-width="3" fill="none"/>').join('')
        + '<path d="M'+(x+w-square)+','+y+'v'+(-square)+'h'+square+'" fill="none" stroke="#5e476e" stroke-width="2"/>'
        + label('a',x+w+10,y-h*.5+5,'start') + label('b',x+w*.5,y+30,'middle') + label('c',x+w*.5,y-h*.5-17,'middle')
        + angleMark(pts,T.A,display);
    }).join('');
  }

  function working(T, factor, display, enabled, reveal) {
    const coloured = (key, text) => '<mtext mathcolor="'+sides[key].colour+'">'+text+'</mtext>';
    const fraction = (top,bottom) => '<mfrac>'+top+bottom+'</mfrac>';
    const numeric = (top,bottom,multiple) => fraction(coloured(top,display(T[top]*multiple)),coloured(bottom,display(T[bottom]*multiple)));
    const expression = (fn, body) => '<math display="block"><mtext>'+fn+' A</mtext><mo>=</mo>'+body+'</math>';
    return ratios.filter(({fn}) => enabled(fn)).map(({fn,mnemonic,top,bottom}) => {
      const result = (T[top]/T[bottom]).toFixed(3);
      const names = fraction(coloured(top,sides[top].full),coloured(bottom,sides[bottom].full));
      const row = (title, body) => '<div class="trig-ratio-row">'+(title?'<span>'+title+'</span>':'')+body+'</div>';
      const calculation = multiple => expression(fn,numeric(top,bottom,multiple)+'<mo>≈</mo><mn>'+result+'</mn>');
      return '<section class="trig-ratio-card"><h3>'+mnemonic[0]+'<span style="color:'+sides[top].colour+'">'+mnemonic[1]+'</span><span style="color:'+sides[bottom].colour+'">'+mnemonic[2]+'</span></h3>'
        + row('',expression(fn,names))
        + (reveal ? row(factor===null?'':'Triangle 1',calculation(1)) : '')
        + (reveal&&factor!==null ? row('Triangle 2',calculation(factor)) : '')
        + '</section>';
    }).join('');
  }

  return {sides, sideLabel, angleMark, comparison, working};
})();
