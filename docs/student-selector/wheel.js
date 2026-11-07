'use strict';
const el = id => document.getElementById(id);
const canvas = el('wheel');
const ctx = canvas.getContext('2d');
const colours = ['#ff998e', '#ffcd69', '#77dfb8', '#87ccff', '#c6a1ff', '#ff9dcc', '#9de4ec'];
const turn = Math.PI * 2;
let roster = [];
let remaining = [];
let angle = 0;
let spinning = false;

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
    ctx.fillStyle = colours[(entry ? entry.id : i) % colours.length];
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
  el('spin').disabled = spinning || !remaining.length;
  el('spin').textContent = el('instant').checked ? 'Select student' : 'Spin wheel';
  el('reset').disabled = spinning || remaining.length === roster.length;
  for (const id of ['names', 'instant', 'remove']) el(id).disabled = spinning;
  el('count').textContent = remaining.length + ' of ' + roster.length + ' available';
}

function resetRound() {
  remaining = roster.slice();
  angle = 0;
  el('result').textContent = roster.length ? 'Ready to select' : 'Add your class list';
  draw(remaining);
  controls();
}

el('names').oninput = () => {
  roster = el('names').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    .map((name, id) => ({name, id}));
  resetRound();
};
el('reset').onclick = resetRound;
el('instant').onchange = controls;
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
    if (el('remove').checked) remaining.splice(index, 1);
    el('result').textContent = pool[index].name;
    spinning = false;
    controls();
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
el('names').oninput();
