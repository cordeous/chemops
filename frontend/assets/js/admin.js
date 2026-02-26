requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

// Guard - admin only
const user = getUser();
if (user && user.role !== 'Admin') {
  showToast('Admin access required', 'danger');
  setTimeout(() => location.href = '/dashboard.html', 1500);
}

const userModal = new bootstrap.Modal(document.getElementById('user-modal'));
const webhookModal = new bootstrap.Modal(document.getElementById('webhook-modal'));

// ——— USERS ———
const loadUsers = async () => {
  const res = await apiFetch('/admin/users');
  document.getElementById('users-tbody').innerHTML = res.data.map(u => `
    <tr class="${!u.isActive ? 'opacity-50' : ''}">
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="badge bg-primary">${u.role}</span></td>
      <td>${u.isActive ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}</td>
      <td class="text-muted small">${formatDate(u.createdAt)}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline-primary" onclick="editUser('${u._id}')"><i class="bi bi-pencil"></i></button>
      </td>
    </tr>`).join('');
};

const editUser = async (id) => {
  const res = await apiFetch('/admin/users');
  const u = res.data.find(u => u._id === id);
  if (!u) return;
  document.getElementById('user-modal-title').textContent = 'Edit User';
  document.getElementById('user-id').value = u._id;
  document.getElementById('u-name').value = u.name;
  document.getElementById('u-email').value = u.email;
  document.getElementById('u-role').value = u.role;
  document.getElementById('u-password').value = '';
  document.getElementById('u-active').checked = u.isActive;
  document.getElementById('pw-hint').textContent = '(leave blank to keep current)';
  userModal.show();
};

document.getElementById('btn-add-user').addEventListener('click', () => {
  document.getElementById('user-modal-title').textContent = 'Add User';
  document.getElementById('user-id').value = '';
  document.getElementById('user-modal').querySelector('form')?.reset();
  document.getElementById('u-active').checked = true;
  document.getElementById('pw-hint').textContent = '(required for new user)';
  userModal.show();
});

document.getElementById('save-user').addEventListener('click', async () => {
  const id = document.getElementById('user-id').value;
  const body = {
    name: document.getElementById('u-name').value,
    email: document.getElementById('u-email').value,
    role: document.getElementById('u-role').value,
    isActive: document.getElementById('u-active').checked
  };
  const pw = document.getElementById('u-password').value;
  if (pw) body.password = pw;
  try {
    if (id) await apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(body) });
    userModal.hide();
    showToast(`User ${id ? 'updated' : 'created'}`);
    loadUsers();
  } catch (err) { showToast(err.message, 'danger'); }
});

// ——— FEATURES ———
const loadFeatures = async () => {
  const res = await apiFetch('/admin/features');
  const flags = res.data;
  document.getElementById('features-body').innerHTML = Object.entries(flags).map(([key, val]) => `
    <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
      <div>
        <strong>${key}</strong>
        <div class="text-muted small">${key === 'maintenanceMode' ? 'Puts system in maintenance mode' : `Toggle ${key}`}</div>
      </div>
      <div class="form-check form-switch mb-0">
        <input class="form-check-input" type="checkbox" id="flag-${key}" ${val ? 'checked' : ''} onchange="toggleFlag('${key}', this.checked)">
      </div>
    </div>`).join('');
};

const toggleFlag = async (key, value) => {
  try {
    await apiFetch('/admin/features', { method: 'PUT', body: JSON.stringify({ [key]: value }) });
    showToast(`${key} set to ${value}`);
  } catch (err) { showToast(err.message, 'danger'); }
};

// ——— WEBHOOKS ———
const loadWebhooks = async () => {
  const res = await apiFetch('/webhooks');
  document.getElementById('webhooks-tbody').innerHTML = res.data.map(wh => `
    <tr>
      <td class="font-monospace small text-truncate" style="max-width:200px;">${wh.url}</td>
      <td class="small">${wh.events?.join(', ') || '—'}</td>
      <td>${wh.isActive ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}</td>
      <td class="text-muted small">${wh.lastTriggeredAt ? formatDate(wh.lastTriggeredAt) : 'Never'}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline-info me-1" onclick="testWebhook('${wh._id}')" title="Test"><i class="bi bi-lightning"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteWebhook('${wh._id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-3">No webhooks configured</td></tr>';
};

document.getElementById('btn-add-webhook').addEventListener('click', () => {
  document.getElementById('wh-id').value = '';
  document.getElementById('wh-url').value = '';
  document.getElementById('wh-desc').value = '';
  document.getElementById('wh-secret').value = '';
  document.getElementById('wh-active').checked = true;
  document.querySelectorAll('.wh-event').forEach(cb => cb.checked = false);
  webhookModal.show();
});

document.getElementById('save-webhook').addEventListener('click', async () => {
  const events = [...document.querySelectorAll('.wh-event:checked')].map(cb => cb.value);
  if (!events.length) { showToast('Select at least one event', 'warning'); return; }
  const body = {
    url: document.getElementById('wh-url').value,
    description: document.getElementById('wh-desc').value,
    events,
    secret: document.getElementById('wh-secret').value || undefined,
    isActive: document.getElementById('wh-active').checked
  };
  try {
    await apiFetch('/webhooks', { method: 'POST', body: JSON.stringify(body) });
    webhookModal.hide();
    showToast('Webhook created');
    loadWebhooks();
  } catch (err) { showToast(err.message, 'danger'); }
});

const testWebhook = async (id) => {
  try {
    await apiFetch(`/webhooks/${id}/test`, { method: 'POST' });
    showToast('Test webhook fired');
  } catch (err) { showToast(err.message, 'danger'); }
};

const deleteWebhook = async (id) => {
  if (!confirm('Delete this webhook?')) return;
  try {
    await apiFetch(`/webhooks/${id}`, { method: 'DELETE' });
    showToast('Webhook deleted');
    loadWebhooks();
  } catch (err) { showToast(err.message, 'danger'); }
};

// ——— ALERTS ———
const loadAlerts = async () => {
  const res = await apiFetch('/admin/alerts');
  const low = res.data.lowStock;
  document.getElementById('alerts-tbody').innerHTML = low.length
    ? low.map(p => `
      <tr class="table-warning">
        <td><strong>${p.name}</strong></td>
        <td class="text-danger fw-bold">${p.inventoryLevel}</td>
        <td>${p.reorderThreshold}</td>
        <td>${p.unitOfMeasure}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="text-center text-success py-3"><i class="bi bi-check-circle me-1"></i>All stock levels are healthy</td></tr>';
};

// ——— AUDIT ———
const loadAudit = async () => {
  const entityType = document.getElementById('audit-entity').value;
  let url = '/audit?limit=50';
  if (entityType) url += `&entityType=${entityType}`;
  const res = await apiFetch(url);
  document.getElementById('audit-tbody').innerHTML = res.data.map(log => `
    <tr>
      <td class="small"><span class="badge bg-secondary">${log.entityType}</span> <span class="font-monospace">${String(log.entityId).slice(-6)}</span></td>
      <td><span class="badge ${log.action === 'DELETE' || log.action === 'ARCHIVE' ? 'bg-danger' : log.action === 'CREATE' ? 'bg-success' : 'bg-primary'}">${log.action}</span></td>
      <td class="small text-muted">${log.changedFields ? Object.keys(log.changedFields).join(', ') : '—'}</td>
      <td class="small">${log.userId?.name || '—'}</td>
      <td class="text-muted small">${new Date(log.timestamp).toLocaleString()}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="text-center text-muted py-3">No audit logs found</td></tr>';
};

// Load tabs on switch
document.querySelectorAll('#admin-tabs .nav-link').forEach(tab => {
  tab.addEventListener('shown.bs.tab', async (e) => {
    const t = e.target.getAttribute('href');
    if (t === '#tab-features') await loadFeatures();
    else if (t === '#tab-webhooks') await loadWebhooks();
    else if (t === '#tab-alerts') await loadAlerts();
    else if (t === '#tab-audit') await loadAudit();
  });
});

loadUsers();
