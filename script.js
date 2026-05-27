// ============================================
// script.js — Stopwatch Core Logic
// (No IIFE — shares scope with auth.js & timestamps.js)
// ============================================

// ——— DOM References ———
const hoursEl   = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const msEl      = document.getElementById('milliseconds');
const display   = document.getElementById('timer-display');
const glowRing  = document.getElementById('glow-ring');
const progressFill = document.getElementById('progress-ring-fill');

const btnStart = document.getElementById('btn-start');
const btnStop  = document.getElementById('btn-stop');
const btnReset = document.getElementById('btn-reset');

// ——— State ———
let running   = false;
let startTime = 0;      // timestamp when timer was started
let elapsed   = 0;      // accumulated elapsed ms before latest start
let rafId     = null;

const CIRCUMFERENCE = 2 * Math.PI * 90; // matches SVG r=90

// ——— Helpers ———
function pad(n, digits = 2) {
  return String(n).padStart(digits, '0');
}

function formatTime(totalMs) {
  const ms  = Math.floor((totalMs % 1000) / 10);
  const sec = Math.floor((totalMs / 1000) % 60);
  const min = Math.floor((totalMs / 60000) % 60);
  const hrs = Math.floor(totalMs / 3600000);
  return { hrs, min, sec, ms };
}

// ——— Rendering ———
let prevSec = -1;

function render(totalMs) {
  const { hrs, min, sec, ms } = formatTime(totalMs);

  hoursEl.textContent   = pad(hrs);
  minutesEl.textContent = pad(min);
  secondsEl.textContent = pad(sec);
  msEl.textContent      = pad(ms);

  // Tick animation on second change
  if (sec !== prevSec) {
    prevSec = sec;
    secondsEl.classList.add('tick');
    setTimeout(() => secondsEl.classList.remove('tick'), 150);
  }

  // Progress ring: one full rotation per 60 seconds
  const fraction = (totalMs % 60000) / 60000;
  const offset = CIRCUMFERENCE * (1 - fraction);
  progressFill.style.strokeDashoffset = offset;
}

// ——— Timer Loop ———
function tick() {
  if (!running) return;
  const now = performance.now();
  const totalMs = elapsed + (now - startTime);
  render(totalMs);
  rafId = requestAnimationFrame(tick);
}

// ——— Actions ———
function start() {
  if (running) return;
  running = true;
  startTime = performance.now();

  display.classList.add('running');
  display.classList.remove('stopped');
  glowRing.classList.add('active');

  btnStart.disabled = true;
  btnStop.disabled  = false;
  btnReset.disabled = false;

  tick();
}

function stop() {
  if (!running) return;
  running = false;
  elapsed += performance.now() - startTime;
  cancelAnimationFrame(rafId);

  display.classList.remove('running');
  display.classList.add('stopped');
  glowRing.classList.remove('active');

  btnStart.disabled = false;
  btnStop.disabled  = true;
  btnReset.disabled = false;

  // Save the pause timestamp to Supabase (if user is authenticated)
  if (typeof savePauseTimestamp === 'function' && currentUser) {
    savePauseTimestamp(elapsed);
  }
}

function reset() {
  running = false;
  cancelAnimationFrame(rafId);

  elapsed   = 0;
  startTime = 0;
  prevSec   = -1;

  render(0);

  display.classList.remove('running', 'stopped');
  glowRing.classList.remove('active');

  btnStart.disabled = false;
  btnStop.disabled  = true;
  btnReset.disabled = true;

  // Smooth reset animation for progress ring
  progressFill.style.transition = 'stroke-dashoffset 400ms cubic-bezier(0.22, 1, 0.36, 1)';
  progressFill.style.strokeDashoffset = CIRCUMFERENCE;
  setTimeout(() => {
    progressFill.style.transition = 'stroke-dashoffset 100ms linear';
  }, 450);
}

// ——— Event Listeners ———
btnStart.addEventListener('click', start);
btnStop.addEventListener('click', stop);
btnReset.addEventListener('click', reset);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    running ? stop() : start();
  }
  if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
    reset();
  }
});

// ——— Init ———
render(0);
