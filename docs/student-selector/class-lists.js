/* Browser-independent roster handling, including repeated names and saved attendance. */
(function(root) {
'use strict';
const id=()=>crypto.randomUUID();
function firstName(value) {
 const name=value.split(/[<(]/,1)[0].trim();
 const comma=name.indexOf(',');
 return (comma<0?name:name.slice(comma+1)).trim();
}
function reconcile(students,text) {
 const names=text.split(/\r?\n/).map(firstName).filter(Boolean);
 const previous=new Map();
 for(const student of students){
  const name=firstName(student.name);
  if(!previous.has(name))previous.set(name,[]);
  previous.get(name).push({...student,name});
 }
 return names.map((name,index)=>previous.get(name)?.shift()
  ||{id:id(),name,absent:false,colour:index%7});
}
function createClass(name,text='') {
 return {id:id(),name,students:reconcile([],text)};
}
function decode(raw) {
 const value=JSON.parse(raw);
 if(value?.version!==1||!Array.isArray(value.classes)||!value.classes.length)return null;
 const classIds=new Set();
 const classes=[];
 for(const group of value.classes){
  if(typeof group?.id!=='string'||!group.id||classIds.has(group.id)||typeof group.name!=='string'||!Array.isArray(group.students))continue;
  classIds.add(group.id);
  const studentIds=new Set();
  const students=group.students.filter(student=>{
   if(typeof student?.id!=='string'||!student.id||studentIds.has(student.id)||typeof student.name!=='string'||!firstName(student.name))return false;
   studentIds.add(student.id);return true;
  }).map((student,index)=>({
   id:student.id,name:firstName(student.name),absent:student.absent===true,
   colour:Number.isInteger(student.colour)&&student.colour>=0&&student.colour<7?student.colour:index%7
  }));
  classes.push({id:group.id,name:group.name.trim()||'Untitled class',students});
 }
 if(!classes.length)return null;
 return {version:1,classes,activeClassId:classes.some(group=>group.id===value.activeClassId)?value.activeClassId:classes[0].id,
  instant:value.instant===true,remove:value.remove===true,hideList:value.hideList===true};
}
const available=(students,used)=>students.filter(student=>!student.absent&&!used.has(student.id));
const api={createClass,reconcile,decode,available,firstName};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.SelectorClasses=api;
})(typeof window!=='undefined'?window:globalThis);
