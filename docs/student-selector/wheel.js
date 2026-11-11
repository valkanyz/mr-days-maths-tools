'use strict';
const el = id => document.getElementById(id);
const canvas = el('wheel');
const ctx = canvas.getContext('2d');
const colours = ['#ff998e', '#ffcd69', '#77dfb8', '#87ccff', '#c6a1ff', '#ff9dcc', '#9de4ec'];
const turn = Math.PI * 2;
const storageKey = 'maths-tools-student-selector-classes-v1';
const model = window.SelectorClasses;
const roundSelections = new Map();
let state;
let storageFailed = false;
try {
  const saved = localStorage.getItem(storageKey);
  state = saved ? model.decode(saved) : null;
} catch {
  storageFailed = true;
}
if (!state) {
  const group = model.createClass('Class 1', el('names').value);
  state = {version: 1, classes: [group], activeClassId: group.id, instant: false, remove: false, hideList: false};
}
let roster = [];
let remaining = [];
let angle = 0;
let spinning = false;
let pendingState = null;
let pendingDelete = false;

const activeClass = () => state.classes.find(group => group.id === state.activeClassId);
function usedStudents() {
  if (!roundSelections.has(state.activeClassId)) roundSelections.set(state.activeClassId, new Set());
  return roundSelections.get(state.activeClassId);
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
  el('saved-status').textContent = storageFailed
    ? 'This browser could not save your changes. Keep this page open to retain them.'
    : 'Classes and attendance are saved in this browser on this device.';
}
function draw(entries) {
  const radius = canvas.width / 2;
  const count = entries.length || 8;
  const step = turn / count;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(angle - Math.PI / 2);
  for (let i = 0; i < count; i++) {
    ctx.save();
    ctx.rotate(i * step);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, 0, step);
    ctx.closePath();
    const entry = entries[i];
    ctx.fillStyle = colours[(entry ? entry.colour : i) % colours.length];
    ctx.fill();
    ctx.strokeStyle = '#382749';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (entry) {
      ctx.rotate(step / 2);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#271831';
      ctx.font = 'bold ' + Math.max(12, Math.min(44, 1450 / count)) + 'px system-ui';
      const flipped = Math.cos(angle - Math.PI / 2 + (i + .5) * step) < 0;
      ctx.translate(radius - 18, 0);
      if (flipped) ctx.rotate(Math.PI);
      ctx.textAlign = flipped ? 'left' : 'right';
      ctx.fillText(entry.name, 0, 0, radius * .71);
    }
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 29, 0, turn);
  ctx.fillStyle = '#fff3df';
  ctx.fill();
  ctx.restore();
}

function controls() {
  const used = usedStudents();
  el('spin').disabled = spinning || !remaining.length;
  el('spin').textContent = el('instant').checked ? 'Select student' : 'Spin wheel';
  el('reset').disabled = spinning || !used.size;
  el('all-present').disabled = spinning || !roster.some(student => student.absent);
  for (const id of ['names', 'class-name', 'instant', 'remove', 'add-class', 'delete-class', 'cancel-delete']) el(id).disabled = spinning;
  for (const tab of el('class-tabs').querySelectorAll('button')) tab.disabled = spinning;
  for (const checkbox of el('roster').querySelectorAll('input')) checkbox.disabled = spinning;
  const present = roster.filter(student => !student.absent).length;
  el('count').textContent = remaining.length + ' available · ' + present + ' present / ' + roster.length + ' students';
}

function updateVisibility() {
  el('hide-list').checked = state.hideList;
  el('class-list-panel').hidden = state.hideList;
}

function renderTabs() {
  el('class-tabs').replaceChildren();
  state.classes.forEach((group, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = 'class-tab-' + group.id;
    tab.textContent = group.name;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'class-panel');
    const selected = group.id === state.activeClassId;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.onclick = () => switchClass(group.id);
    tab.onkeydown = event => {
      const movement = {ArrowLeft: -1, ArrowRight: 1}[event.key];
      let next = index;
      if (movement) next = (index + movement + state.classes.length) % state.classes.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = state.classes.length - 1;
      else return;
      event.preventDefault();
      switchClass(state.classes[next].id);
      document.getElementById('class-tab-' + state.activeClassId).focus();
    };
    el('class-tabs').append(tab);
    if (selected) el('class-panel').setAttribute('aria-labelledby', tab.id);
  });
}

function renderRoster() {
  el('roster').replaceChildren();
  const used = usedStudents();
  for (const student of roster) {
    const row = document.createElement('div');
    row.className = 'student-row' + (student.absent ? ' absent' : '');
    const name = document.createElement('span');
    name.className = 'student-name';
    name.textContent = student.name;
    if (used.has(student.id)) {
      const selected = document.createElement('small');
      selected.textContent = 'Selected this round';
      name.append(selected);
    }
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'attendance-' + student.id;
    checkbox.checked = student.absent;
    checkbox.setAttribute('aria-label', 'Mark ' + student.name + ' absent');
    checkbox.onchange = () => {
      student.absent = checkbox.checked;
      save();
      refreshPool();
      renderRoster();
      document.getElementById('attendance-' + student.id).focus({preventScroll: true});
    };
    label.append(checkbox, document.createTextNode('Absent'));
    row.append(name, label);
    el('roster').append(row);
  }
}

function refreshPool() {
  remaining = model.available(roster, usedStudents());
  angle = 0;
  el('result').textContent = !roster.length ? 'Add your class list'
    : roster.every(student => student.absent) ? 'All students are marked absent'
    : remaining.length ? 'Ready to select' : 'Round complete';
  draw(remaining);
  controls();
}

function renderClass() {
  cancelDelete();
  roster = activeClass().students;
  el('class-name').value = activeClass().name;
  el('names').value = roster.map(student => student.name).join('\n');
  el('instant').checked = state.instant;
  el('remove').checked = state.remove;
  el('edit-list').open = !roster.length;
  renderTabs();
  renderRoster();
  updateVisibility();
  refreshPool();
}

function switchClass(id) {
  if (spinning || state.activeClassId === id) return;
  state.activeClassId = id;
  if (!activeClass().students.length) state.hideList = false;
  save();
  renderClass();
}

function resetRound() {
  usedStudents().clear();
  renderRoster();
  refreshPool();
}

function applyIncoming(incoming) {
  const currentId = state.activeClassId;
  state = incoming;
  if (state.classes.some(group => group.id === currentId)) state.activeClassId = currentId;
  renderClass();
}

el('names').oninput = () => {
  roster = model.reconcile(roster, el('names').value);
  activeClass().students = roster;
  const ids = new Set(roster.map(student => student.id));
  for (const id of usedStudents()) if (!ids.has(id)) usedStudents().delete(id);
  save();
  renderRoster();
  refreshPool();
};
el('class-name').oninput = () => {
  activeClass().name = el('class-name').value.trim() || 'Untitled class';
  save();
  document.getElementById('class-tab-' + state.activeClassId).textContent = activeClass().name;
};
el('class-name').onchange = () => { el('class-name').value = activeClass().name; };
el('class-name').onkeydown = event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    el('class-name').blur();
  }
};
el('add-class').onclick = () => {
  if (spinning) return;
  let index = 1;
  const names = new Set(state.classes.map(group => group.name.toLowerCase()));
  while (names.has('class ' + index)) index++;
  const group = model.createClass('Class ' + index);
  state.classes.push(group);
  state.activeClassId = group.id;
  state.hideList = false;
  save();
  renderClass();
  el('class-name').focus();
  el('class-name').select();
};
function cancelDelete() {
  pendingDelete = false;
  el('delete-class').textContent = 'Delete class';
  el('cancel-delete').hidden = true;
  el('delete-warning').hidden = true;
}
el('cancel-delete').onclick = cancelDelete;
el('delete-class').onclick = () => {
  if (spinning) return;
  if (!pendingDelete) {
    pendingDelete = true;
    el('delete-class').textContent = 'Confirm delete';
    el('cancel-delete').hidden = false;
    el('delete-warning').textContent = 'Delete “' + activeClass().name + '” and its saved student list?';
    el('delete-warning').hidden = false;
    return;
  }
  roundSelections.delete(state.activeClassId);
  state.classes = state.classes.filter(group => group.id !== state.activeClassId);
  if (!state.classes.length) state.classes.push(model.createClass('Class 1'));
  state.activeClassId = state.classes[0].id;
  save();
  renderClass();
};
el('all-present').onclick = () => {
  for (const student of roster) student.absent = false;
  save();
  renderRoster();
  refreshPool();
};
el('hide-list').onchange = () => {
  state.hideList = el('hide-list').checked;
  save();
  updateVisibility();
};
el('reset').onclick = resetRound;
el('instant').onchange = () => {
  state.instant = el('instant').checked;
  save();
  controls();
};
el('remove').onchange = () => {
  state.remove = el('remove').checked;
  save();
  controls();
};
el('spin').onclick = () => {
  if (spinning || !remaining.length) return;
  const pool = remaining.slice();
  const index = Math.floor(Math.random() * pool.length);
  const target = turn * (1 - (index + .5) / pool.length);
  const start = angle;
  const distance = 3 * turn + (target - start + turn) % turn;
  function finish() {
    angle = target;
    draw(pool);
    if (el('remove').checked) usedStudents().add(pool[index].id);
    remaining = model.available(roster, usedStudents());
    spinning = false;
    if (pendingState) {
      applyIncoming(pendingState);
      pendingState = null;
    } else {
      renderRoster();
      controls();
    }
    el('result').textContent = pool[index].name;
  }
  if (el('instant').checked || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return;
  }
  spinning = true;
  controls();
  el('result').textContent = 'Spinning…';
  const began = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - began) / 2300);
    if (t === 1) return finish();
    angle = start + distance * (1 - (1 - t) ** 3);
    draw(pool);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
window.addEventListener('storage', event => {
  if (event.key !== storageKey || !event.newValue) return;
  try {
    const incoming = model.decode(event.newValue);
    if (!incoming) return;
    if (spinning) pendingState = incoming;
    else applyIncoming(incoming);
  } catch {}
});
renderClass();
if (storageFailed) el('saved-status').textContent = 'Saved classes are unavailable in this browser. Changes may not persist.';
