(function(root){
'use strict';
function validate(n,p){if(!Number.isInteger(n)||n<1||n>26)throw Error('Choose 1–26 rows.');if(!Number.isFinite(p)||p<0||p>1)throw Error('Probability must be between 0 and 1.')}
function distribution(n,p){validate(n,p);let a=[1];for(let r=0;r<n;r++){const next=Array(r+2).fill(0);for(let k=0;k<a.length;k++){next[k]+=a[k]*(1-p);next[k+1]+=a[k]*p}a=next}return a}
function sample(n,p,random=Math.random){validate(n,p);let k=0;const path=[0];for(let r=0;r<n;r++){const u=random();if(!(u>=0&&u<1))throw Error('Random values must be in [0,1).');if(u<p)k++;path.push(k)}return{bin:k,path}}
function summary(counts){if(!Array.isArray(counts)||!counts.length||counts.some(v=>!Number.isSafeInteger(v)||v<0))throw Error('Invalid frequencies.');const total=counts.reduce((a,b)=>a+b,0);if(!total)return{total:0,mean:null,sd:null,sampleSD:null};const mean=counts.reduce((s,c,k)=>s+c*k,0)/total,ss=counts.reduce((s,c,k)=>s+c*(k-mean)**2,0);return{total,mean,sd:Math.sqrt(ss/total),sampleSD:total>1?Math.sqrt(ss/(total-1)):null}}
const api={validate,distribution,sample,summary};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PlinkoMath=api;
})(typeof window!=='undefined'?window:globalThis);
