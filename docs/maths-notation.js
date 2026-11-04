/* Conservative MathML rendering: only explicit mathematical notation is typeset. */
(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fragment(s){s=s.trim();let depth=0;for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')')depth--;if(s[i]==='/'&&depth===0)return '<mfrac><mrow>'+fragment(s.slice(0,i))+'</mrow><mrow>'+fragment(s.slice(i+1))+'</mrow></mfrac>';}
 if(s.startsWith('(')&&s.endsWith(')'))return '<mo>(</mo>'+fragment(s.slice(1,-1))+'<mo>)</mo>';
 return s.split(/(√\d+|\^\d+)/).map(t=>/^√\d+$/.test(t)?'<msqrt><mn>'+t.slice(1)+'</mn></msqrt>':/^\^\d+$/.test(t)?'<msup><mrow></mrow><mn>'+t.slice(1)+'</mn></msup>':'<mtext>'+esc(t)+'</mtext>').join('');}
window.MathsNotation={markup:s=>'<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="'+esc(s)+'">'+fragment(s)+'</math>'};
function mount(){const menu=document.querySelector('.ux-menu');if(!menu)return;const label=document.createElement('label');label.innerHTML='Values <select id="uxExact"><option value="exact">Exact where available</option><option value="decimal">Decimal</option></select>';menu.append(label);const select=label.querySelector('select');try{select.value=localStorage.getItem('maths-value-display')||'exact';}catch{}
 const originals=new WeakMap;let pending=false;
 function apply(){pending=false;for(const node of document.querySelectorAll('.stat strong,#machinePanel-table td,#viz [data-exact-value],.matrix .entry,.calculation>strong')){if(/step|decision|Q₁|Q₃/i.test(node.parentElement?.querySelector('small')?.textContent||''))continue;let raw=originals.get(node);if(!raw){if(node.children.length)continue;raw=node.textContent;if(!/[√π/]/.test(raw)||!/^[\d\s√π()+−\-*/.]+$/.test(raw))continue;originals.set(node,raw);}let text=raw;if(select.value==='decimal'&&typeof MachineMath!=='undefined')try{const p=MachineMath.plan('x',raw).input;if(!p.size||p.size===1&&p.has(''))text=String(Number((p.size?MachineMath.num(p.get('')):0).toFixed(4))).replace('-','−');}catch{}
 const html=text===raw?MathsNotation.markup(raw):esc(text);if(node.innerHTML!==html)node.innerHTML=html;}
 }
 const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(apply);}});observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true,characterData:true});select.onchange=()=>{try{localStorage.setItem('maths-value-display',select.value);}catch{}apply();};apply();}
 mount();
})();
