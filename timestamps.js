// ============================================
// timestamps.js — Pause Timestamps CRUD & Rendering
// ============================================

// ——— DOM References ———
const tableBody     = document.getElementById('timestamps-tbody');
const emptyState    = document.getElementById('timestamps-empty');
const btnClear      = document.getElementById('btn-clear-history');
const timestampCount = document.getElementById('timestamp-count');

// ——— Helpers ———
function formatElapsed(totalMs) {
  const ms  = Math.floor((totalMs % 1000) / 10);
  const sec = Math.floor((totalMs / 1000) % 60);
  const min = Math.floor((totalMs / 60000) % 60);
  const hrs = Math.floor(totalMs / 3600000);
  return `${String(hrs).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// ——— Save a pause timestamp ———
async function savePauseTimestamp(elapsedMs) {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('pause_timestamps')
    .insert({
      user_id: currentUser.id,
      elapsed_ms: Math.floor(elapsedMs),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving timestamp:', error.message);
    return;
  }

  // Add the new row to the table with animation
  addRowToTable(data, tableBody.children.length + 1);
  updateEmptyState();
  updateCount();
}

// ——— Load all timestamps for the user ———
async function loadTimestamps() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from('pause_timestamps')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('paused_at', { ascending: true });

  if (error) {
    console.error('Error loading timestamps:', error.message);
    return;
  }

  renderTimestampTable(data || []);
}

// ——— Clear all timestamps ———
async function clearTimestamps() {
  if (!currentUser) return;

  // Confirmation
  if (!confirm('Clear all your pause history? This cannot be undone.')) return;

  const { error } = await supabase
    .from('pause_timestamps')
    .delete()
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Error clearing timestamps:', error.message);
    return;
  }

  renderTimestampTable([]);
}

// ——— Render full table ———
function renderTimestampTable(data) {
  tableBody.innerHTML = '';

  data.forEach((row, i) => {
    addRowToTable(row, i + 1, false);
  });

  updateEmptyState();
  updateCount();
}

// ——— Add a single row ———
function addRowToTable(row, index, animate = true) {
  const tr = document.createElement('tr');
  if (animate) tr.classList.add('row-enter');

  tr.innerHTML = `
    <td class="cell-index">${index}</td>
    <td class="cell-elapsed"><code>${formatElapsed(row.elapsed_ms)}</code></td>
    <td class="cell-date">${formatDate(row.paused_at)}</td>
  `;

  tableBody.appendChild(tr);
}

// ——— Update empty state visibility ———
function updateEmptyState() {
  if (tableBody.children.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
  }
}

// ——— Update count badge ———
function updateCount() {
  const count = tableBody.children.length;
  timestampCount.textContent = count;
  timestampCount.style.display = count > 0 ? 'inline-flex' : 'none';
}

// ——— Event Listeners ———
btnClear.addEventListener('click', clearTimestamps);
