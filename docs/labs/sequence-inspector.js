// The plot and table share the same one-based term index.
function sequenceInspector(series, graph) {
  const plot = $('viz').querySelector('svg');
  const count = series[0].rows.length;
  const show = $('reveal').checked;
  const host = $('table');
  const details = host.closest('details');
  if (!details.dataset.sequences) {
    details.dataset.sequences = details.open ? 'open' : 'closed';
    details.open = true;
  }
  const format = n => Number.isInteger(n) ? fmt(n,0) : n !== 0 && Math.abs(n)<0.005 ? n.toExponential(2) :
    n.toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
  const row = (label,values) => '<tr><th scope="row">'+esc(label)+'</th>'+
    values.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>';
  host.innerHTML = '<table class="sequence-values"><caption>Table of values</caption><tbody>'+
    row('n',series[0].rows.map(r=>r[0]))+
    series.map((s,i)=>row(i?s.name:'tₙ',s.rows.map(r=>format(r[1])))).join('')+'</tbody></table>';
  const grid = host.querySelector('table');
  exportRows = [['n',...series.map((s,i)=>i?s.name:'tₙ')],...series[0].rows.map(([n],i)=>[n,...series.map(s=>s.rows[i][1])])];

  if (!show) return;
  const guide = document.createElementNS(plot.namespaceURI,'g');
  guide.setAttribute('pointer-events','none');
  plot.append(guide);
  const tip = document.createElement('div');
  tip.className = 'sequence-tooltip';
  tip.hidden = true;
  $('viz').append(tip);
  let active = 0;
  function selectTerm(n,scroll) {
    if (active === n) return;
    for (const r of grid.rows) {
      if (active) r.cells[active].classList.remove('active-term');
      if (n) r.cells[n].classList.add('active-term');
    }
    active=n;
    tip.hidden=!n;
    guide.replaceChildren();
    if (!n) return;
    const x=graph.X(n);
    guide.innerHTML='<path d="M'+x+' 25V390" stroke="#795295" stroke-dasharray="4 4"/>'+
      series.map((s,i)=>'<circle cx="'+x+'" cy="'+graph.Y(s.rows[n-1][1])+'" r="6" fill="'+Object.values(C)[i%5]+'" stroke="white" stroke-width="2"/>').join('');
    tip.textContent='Term '+n+'\n'+series.map((s,i)=>{const v=s.rows[n-1][1];return (i?s.name:'tₙ')+' = '+(v!==0&&Math.abs(v)<1e-6?v.toExponential(4):fmt(v,6))}).join('\n');
    const box=$('viz').getBoundingClientRect();
    const pos=new DOMPoint(x,graph.Y(series[0].rows[n-1][1])).matrixTransform(plot.getScreenCTM());
    const px=pos.x-box.left, py=pos.y-box.top;
    tip.style.left=Math.max(4,Math.min(box.width-tip.offsetWidth-4,px+12+tip.offsetWidth>box.width?px-tip.offsetWidth-12:px+12))+'px';
    tip.style.top=Math.max(4,Math.min(box.height-tip.offsetHeight-4,py-tip.offsetHeight/2))+'px';
    if(scroll && details.open){
      const cell=grid.rows[0].cells[n].getBoundingClientRect(), viewport=host.getBoundingClientRect();
      const left=viewport.left+grid.rows[0].cells[0].offsetWidth;
      if(cell.right>viewport.right)host.scrollLeft+=cell.right-viewport.right;
      else if(cell.left<left)host.scrollLeft+=cell.left-left;
    }
  }
  const inspect=e=>{
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(plot.getScreenCTM().inverse());
    if(p.x<60||p.x>811||p.y<25||p.y>391){selectTerm(0);return}
    const n=Math.round(graph.xmin+(p.x-60)/750*(graph.xmax-graph.xmin));
    selectTerm(Math.max(1,Math.min(count,n)),true);
  };
  plot.onpointermove=inspect;
  plot.onclick=inspect;
  plot.onpointerleave=()=>selectTerm(0);
  grid.onpointerover=e=>{const cell=e.target.closest('td');if(cell)selectTerm(cell.cellIndex,false)};
  grid.onpointerleave=()=>selectTerm(0);
}

function restoreSequenceDetails() {
  const details=$('table').closest('details');
  if (!details.dataset.sequences) return;
  details.open=details.dataset.sequences==='open';
  delete details.dataset.sequences;
}
