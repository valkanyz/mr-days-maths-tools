/* Decimal arithmetic and worked steps using exact integer coefficients. */
(function(root) {
'use strict';

const power = n => 10n ** BigInt(n);
function parse(raw) {
 const match = /^(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(String(raw).trim());
 if (!match || !(match[1] || match[2])) throw Error('Enter a non-negative decimal.');
 const exponent = Number(match[3] || 0);
 if (Math.abs(exponent)>24) throw Error('Use up to 12 whole-number digits and 12 decimal places.');
 let scale = (match[2] || '').length - exponent;
 let units = BigInt(match[1]+(match[2] || ''));
 if (scale<0) {units *= power(-scale); scale=0;}
 while (scale>12 && units%10n===0n) {units/=10n; scale--;}
 if (scale>12 || units>=power(scale+12)) throw Error('Use up to 12 whole-number digits and 12 decimal places.');
 return {units,scale};
}
function format({units,scale},trim=false) {
 const digits=String(units<0n?-units:units).padStart(scale+1,'0');
 let value=scale?digits.slice(0,-scale)+'.'+digits.slice(-scale):digits;
 if(trim && scale)value=value.replace(/\.?0+$/,'');
 return (units<0n?'−':'')+value;
}
function display(value,trim=false) {
 const [whole,fraction]=format(value,trim).split('.');
 const grouped=whole.replace(/\B(?=(\d{3})+(?!\d))/g,',');
 return fraction===undefined?grouped:grouped+'.'+fraction;
}
const atScale=(value,scale)=>value.units*power(scale-value.scale);
const row=(label,value,extra={})=>({label,value,...extra});
const exact=(units,scale=0)=>({units,scale});
function rounded(value,scale) {
 if(value.scale<=scale)return exact(atScale(value,scale),scale);
 const factor=power(value.scale-scale);
 return exact((value.units+factor/2n)/factor,scale);
}
function shift(value,places) {
 const scale=value.scale-places;
 return scale>=0?exact(value.units,scale):exact(value.units*power(-scale));
}
const superscript=n=>String(n).split('').map(d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
const place=e=>({3:'thousands',2:'hundreds',1:'tens',0:'ones','-1':'tenths','-2':'hundredths','-3':'thousandths'})[e]||'the '+(e<0?'10⁻'+superscript(-e):'10'+superscript(e))+' column';

function addSubtract(a,b,subtract) {
 const scale=Math.max(a.scale,b.scale),A=atScale(a,scale),B=atScale(b,scale);
 const negative=subtract&&A<B, top=negative?B:A, bottom=negative?A:B;
 const result=exact(subtract?A-B:A+B,scale);
 const width=Math.max(scale+1,String(top).length,String(bottom).length,String(result.units).replace('-','').length);
 const digits=n=>String(n).padStart(width,'0').split('').reverse().map(Number);
 const topDigits=digits(top),bottomDigits=digits(bottom);
 const operands=[row(negative?'Larger number':'First number',exact(top,scale)),row(negative?'− Smaller number':subtract?'− Second number':'+ Second number',exact(bottom,scale))];
 const steps=[];
 let carry=0;
 for(let i=0;i<width;i++){
  const exponent=i-scale, x=topDigits[i], y=bottomDigits[i];
  let digit, message, arrow, regrouped;
  if(subtract){
   let adjusted=x;
   if(x<y){
    let lender=i+1;
    while(topDigits[lender]===0){topDigits[lender]=9;lender++;}
    topDigits[lender]--;adjusted+=10;topDigits[i]=adjusted;
    arrow={from:lender-scale,to:exponent};
   }
   const display=topDigits.slice();display[i]=adjusted;
   regrouped=Object.fromEntries(display.map((d,j)=>[j-scale,d]));
   digit=adjusted-y;
   message=(arrow?'Regroup from '+place(arrow.from)+'. ':'')+adjusted+' − '+y+' = '+digit+' in '+place(exponent)+'.';
  }else{
   const total=x+y+carry;
   digit=total%10;
   message=x+' + '+y+(carry?' + '+carry:'')+' = '+total+' in '+place(exponent)+'.';
   carry=Math.floor(total/10);
   if(carry){arrow={from:exponent,to:exponent+1};message+=' Carry '+carry+' to '+place(exponent+1)+'.';}
  }
  const rows=regrouped?[row('Regrouped first number',operands[0].value,{digits:regrouped}),operands[1]]:operands;
  steps.push({message,rows:[...rows,row('Answer so far',result,{through:exponent})],column:exponent,arrow});
 }
 steps.push({message:negative?'The first number is smaller, so the answer is negative.':'The decimal points line up in the answer.',
  rows:[row('First number',a),row(subtract?'− Second number':'+ Second number',b),row('Answer',result)]});
 return {result,steps};
}

function multiply(a,b) {
 const result=exact(a.units*b.units,a.scale+b.scale);
 const steps=[];
 let sum=0n;
 [...String(b.units)].reverse().forEach((digit,i)=>{
  const partial=a.units*BigInt(digit)*power(i);
  sum+=partial;
  steps.push({message:'Multiply '+a.units+' by '+digit+(i?' in '+place(i):'')+'. Add '+partial+' to the running total.',
   rows:[row('First as whole number',exact(a.units)),row('× Second as whole number',exact(b.units)),
    row('Partial product',exact(partial)),row('Running total',exact(sum))],column:i});
 });
 steps.push({message:'The factors have '+a.scale+' and '+b.scale+' decimal places. The product has '+result.scale+' decimal places.',
  rows:[row('Whole-number product',exact(sum)),row('Decimal product',result)],arrows:digitShifts(exact(sum),-result.scale)});
 return {result,steps};
}

function divide(a,b) {
 if(!b.units)throw Error('Choose a non-zero divisor.');
 const dividend=shift(a,b.scale), divisor=b.units;
 const dividendDigits=String(dividend.units).padStart(dividend.scale+1,'0');
 const wholeDigits=dividendDigits.length-dividend.scale;
 let remainder=0n, quotient=0n, scale=0;
 const steps=[];
 for(let i=0;i<wholeDigits+12;i++){
  const digit=dividendDigits[i]||'0';
  const current=remainder*10n+BigInt(digit), answer=current/divisor;
  remainder=current%divisor;
  quotient=quotient*10n+answer;
  scale=Math.max(0,i-wholeDigits+1);
  const exponent=wholeDigits-i-1;
  steps.push({message:'Bring down '+digit+': '+current+' ÷ '+divisor+' gives '+answer+' with remainder '+remainder+'.',
   rows:[row('Dividend',dividend),row('Whole-number divisor',exact(divisor)),row('Quotient so far',exact(quotient,scale))],column:exponent});
  if(i>=dividendDigits.length-1&&!remainder)break;
 }
 const approximate=remainder!==0n;
 const result=exact(quotient+(approximate&&remainder*2n>=divisor?1n:0n),scale);
 if(b.scale)steps.unshift({message:'Multiply both numbers by 10'+superscript(b.scale)+' to make the divisor a whole number.',
  rows:[row('Original dividend',a),row('Original divisor',b),row('New dividend',dividend),row('New divisor',exact(divisor))]});
 steps.push({message:approximate?'Rounded to 12 decimal places.':'The remainder is zero, so the division is exact.',
  rows:[row('Dividend',dividend),row('Whole-number divisor',exact(divisor)),row('Quotient',result)]});
 return {result,steps,approximate};
}

function digitShifts(value,places) {
 const digits=String(value.units);
 if(!places||!value.units)return [];
 return [...digits].map((digit,i)=>({digit,from:digits.length-i-1-value.scale,to:digits.length-i-1-value.scale+places}));
}
function build({mode,a,b,operation,places=0,notation='index',dp=0}) {
 if(mode==='calculate'){
  const plan=operation==='multiply'?multiply(a,b):operation==='divide'?divide(a,b):addSubtract(a,b,operation==='subtract');
  const symbol={add:'+',subtract:'−',multiply:'×',divide:'÷'}[operation];
  return {...plan,title:format(a)+' '+symbol+' '+format(b)};
 }
 if(mode==='powers'){
  const direction=operation==='divide'?-1:1;
  const factor=notation==='index'?'10'+superscript(places):String(power(places));
  const side=direction<0?'left':'right';
  const steps=[{message:places?'Start with the decimal point in its original position.':'The factor is 1, so the decimal point stays in place.',
   rows:[row('Start',a)],hops:0}];
  for(let i=1;i<=places;i++){
   steps.push({message:'Hop one space '+side+' to get '+display(shift(a,direction*i),true)+'.',
    rows:[row('After',shift(a,direction*i))],hops:i});
  }
  if(places>1)steps.push({message:'The decimal point hopped '+places+' spaces '+side+'.',
   rows:[row('Answer',shift(a,direction*places))],hops:places,replay:true});
  return {result:shift(a,direction*places),steps,pointShift:{start:a,places,direction},
   title:format(a)+' '+(direction<0?'÷':'×')+' '+factor};
 }
 if(mode==='compare'){
  const scale=Math.max(a.scale,b.scale),A=atScale(a,scale),B=atScale(b,scale);
  const comparison=A===B?'=':A<B?'<':'>';
  const rows=[row('First number',exact(A,scale)),row('Second number',exact(B,scale))];
  const left=String(A).padStart(scale+1,'0'),right=String(B).padStart(scale+1,'0');
  const length=Math.max(left.length,right.length),first=left.padStart(length,'0'),second=right.padStart(length,'0');
  const position=[...first].findIndex((digit,index)=>digit!==second[index]);
  const column=position<0?null:length-position-1-scale;
  return {result:exact(A>B?A-B:B-A,scale),comparison,title:'Compare '+format(a)+' and '+format(b),
   steps:[{message:'Line up the decimal points and compare from left to right.',rows},
    {message:column===null?'Every place has the same value.':'The first difference is in '+place(column)+': '+first[position]+' and '+second[position]+'.',rows,column}]};
 }
 const result=rounded(a,dp);
 return {result,title:'Round '+format(a)+' to '+dp+' decimal places',
  steps:[{message:'Find '+place(-dp)+' and look one place to its right.',rows:[row('Original',a)],column:-dp-1},
   {message:'Round up when the next digit is 5 or more.',rows:[row('Original',a),row('Rounded',result)],column:-dp}]};
}
const api={parse,format,display,build};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.DecimalModel=api;
})(typeof window!=='undefined'?window:globalThis);
