const assert=require('node:assert/strict');
const model=require('../docs/student-selector/class-lists.js');
const group=model.createClass('Year 9','Avery\nBlake\nAvery\n\nCasey');
assert.equal(group.students.length,4);
assert.equal(new Set(group.students.map(student=>student.id)).size,4);
group.students[1].absent=true;
group.students[2].absent=true;
const originalIds=group.students.map(student=>student.id);
group.students=model.reconcile(group.students,'Casey\nAvery\nBlake\nAvery\nDrew');
assert.equal(group.students[0].id,originalIds[3]);
assert.equal(group.students[2].id,originalIds[1]);
assert.equal(group.students[2].absent,true);
assert.equal(group.students[3].id,originalIds[2]);
assert.equal(group.students[3].absent,true);
assert.equal(group.students[4].absent,false);
assert.equal(new Set(group.students.map(student=>student.id)).size,5);
const other=model.createClass('Year 8','Blake');
assert.equal(other.students[0].absent,false);
const data={version:1,classes:[group,other],activeClassId:group.id,hideList:true,instant:true,remove:true};
const restored=model.decode(JSON.stringify(data));
assert.deepEqual(restored,data);
const used=new Set([originalIds[3]]);
assert.deepEqual(model.available(restored.classes[0].students,used).map(student=>student.name),['Avery','Drew']);
assert.equal(model.available(other.students,used).length,1);
used.clear();
assert.deepEqual(model.available(group.students,used).map(student=>student.name),['Casey','Avery','Drew']);
const malformed={...data,classes:[group,{...other,id:group.id}]};
assert.equal(model.decode(JSON.stringify(malformed)).classes.length,1);
assert.equal(model.decode(JSON.stringify({...data,activeClassId:'missing'})).activeClassId,group.id);
assert.equal(model.decode(JSON.stringify({version:1,classes:[]})),null);
console.log('PASS: saved classes, stable duplicate names, attendance, reordering, reload, hidden list and per-class eligibility.');

for(const [input,expected] of [
 ['Smith, Alexander (Alex) <R, R1, 9>','Alexander'],
 ['O’Neill, Sarah-Jane (SJ) <B, B4, 10>','Sarah-Jane'],
 ['de Silva, Mary Anne <G, G2, 8>','Mary Anne'],
 ['  Jones, Zoë (Z) <H, H3, 7>  ','Zoë'],
 ['Alexander','Alexander'],
 ['Alexander (Alex, Al) <R, R1, 9>','Alexander'],
 ['Smith, Alexander','Alexander'],
 ['Smith, (Alex) <R, R1, 9>','']
]) assert.equal(model.firstName(input),expected);
const imported=model.createClass('Import','Smith, Alexander (Alex) <R, R1, 9>\nJones, Sam (Sammy) <B, B2, 9>\nBrown, Sam <G, G1, 9>');
assert.deepEqual(imported.students.map(student=>student.name),['Alexander','Sam','Sam']);
assert.equal(new Set(imported.students.map(student=>student.id)).size,3);
const previous=[{id:'existing',name:'Smith, Alexander (Alex) <R, R1, 9>',absent:true,colour:2}];
const clean=model.reconcile(previous,'Smith, Alexander (Alex) <R, R1, 9>');
assert.deepEqual(clean,[{id:'existing',name:'Alexander',absent:true,colour:2}]);
const migrated=model.decode(JSON.stringify({version:1,classes:[{id:'old-class',name:'Saved',students:previous}],activeClassId:'old-class'}));
assert.equal(migrated.classes[0].students[0].name,'Alexander');
assert.equal(migrated.classes[0].students[0].absent,true);
assert.equal(migrated.classes[0].students[0].id,'existing');
console.log('PASS: school export imports use formal first names and preserve attendance, IDs and duplicate entries.');
