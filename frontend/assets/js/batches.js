requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

const modal = new bootstrap.Modal(document.getElementById('batch-modal'));
let products = [];

const loadProducts = async () => {
  const res = await apiFetch('/products?limit=200');
  products = res.data;
  const sel = document.getElementById('filter-product');
  const bsel = document.getElementById('b-product');
  products.forEach(p => {
    sel.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    bsel.innerHTML += `<option value="${p._id}">${p.name}</option>`;
  });
};

const loadBatches = async () => {
  const productId = document.getElementById('filter-product').value;
  const expiringSoon = document.getElementById('filter-expiring').checked;
  let url = '/batches?';
  if (productId) url += `productId=${productId}&`;
  if (expiringSoon) url += 'expiringSoon=true';

  try {
    const res = await apiFetch(url);
    const tbody = document.getElementById('batches-tbody');
    if (!res.data.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="bi bi-layers"></i><p>No batches found</p></div></td></tr>';
      return;
    }
    const now = new Date();
    tbody.innerHTML = res.data.map(b => {
      const exp = b.expirationDate ? new Date(b.expirationDate) : null;
      const daysLeft = exp ? Math.ceil((exp - now) / 86400000) : null;
      let risk = '—';
      if (daysLeft !== null) {
        if (daysLeft <= 0) risk = '<span class="badge bg-danger">Expired</span>';
        else if (daysLeft <= 30) risk = `<span class="badge bg-danger">${daysLeft}d</span>`;
        else if (daysLeft <= 90) risk = `<span class="badge bg-warning text-dark">${daysLeft}d</span>`;
        else risk = `<span class="badge bg-success">${daysLeft}d</span>`;
      }
      return `<tr>
        <td class="font-monospace small">${b.batchNumber}</td>
        <td>${b.productId?.name || '—'}</td>
        <td>${b.quantity} ${b.productId?.unitOfMeasure || ''}</td>
        <td>${formatDate(b.expirationDate)}</td>
        <td class="small">${b.warehouseLocation || '—'}</td>
        <td>${risk}</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editBatch('${b._id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteBatch('${b._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  } catch (err) { showToast(err.message, 'danger'); }
};

const editBatch = async (id) => {
  const { data } = await apiFetch(`/batches/${id}`);
  document.getElementById('modal-title').textContent = 'Edit Batch';
  document.getElementById('batch-id').value = data._id;
  document.getElementById('b-product').value = data.productId?._id || data.productId;
  document.getElementById('b-number').value = data.batchNumber;
  document.getElementById('b-quantity').value = data.quantity;
  document.getElementById('b-expiry').value = data.expirationDate ? data.expirationDate.split('T')[0] : '';
  document.getElementById('b-warehouse').value = data.warehouseLocation || '';
  modal.show();
};

const deleteBatch = async (id) => {
  if (!confirm('Delete this batch? This will adjust inventory.')) return;
  try {
    await apiFetch(`/batches/${id}`, { method: 'DELETE' });
    showToast('Batch deleted');
    loadBatches();
  } catch (err) { showToast(err.message, 'danger'); }
};

document.getElementById('btn-add').addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Add Batch';
  document.getElementById('batch-id').value = '';
  document.getElementById('batch-form').reset();
  modal.show();
});

document.getElementById('save-batch').addEventListener('click', async () => {
  const id = document.getElementById('batch-id').value;
  const body = {
    productId: document.getElementById('b-product').value,
    batchNumber: document.getElementById('b-number').value,
    quantity: Number(document.getElementById('b-quantity').value),
    expirationDate: document.getElementById('b-expiry').value || undefined,
    warehouseLocation: document.getElementById('b-warehouse').value
  };
  try {
    if (id) await apiFetch(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await apiFetch('/batches', { method: 'POST', body: JSON.stringify(body) });
    modal.hide();
    showToast(`Batch ${id ? 'updated' : 'created'}`);
    loadBatches();
  } catch (err) { showToast(err.message, 'danger'); }
});

(async () => { await loadProducts(); await loadBatches(); })();
