requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

const modal = new bootstrap.Modal(document.getElementById('product-modal'));
let currentPage = 1;

const loadProducts = async (page = 1) => {
  currentPage = page;
  const search = document.getElementById('search').value;
  const hazardous = document.getElementById('filter-hazardous').value;
  const archived = document.getElementById('filter-archived').value;
  let url = `/products?page=${page}&limit=20`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (hazardous) url += `&hazardous=${hazardous}`;
  if (archived) url += `&archived=${archived}`;

  try {
    const res = await apiFetch(url);
    const tbody = document.getElementById('products-tbody');
    if (!res.data.length) {
      tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><i class="bi bi-box-seam"></i><p>No products found</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = res.data.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td class="font-monospace small">${p.CASNumber || '—'}</td>
        <td class="font-monospace small">${p.UNNumber || '—'}</td>
        <td class="small">${p.hazardClassification || '—'}</td>
        <td>${p.unitOfMeasure}</td>
        <td>
          <span class="${p.inventoryLevel <= p.reorderThreshold ? 'text-danger fw-bold' : ''}">${p.inventoryLevel}</span>
          <small class="text-muted">/${p.reorderThreshold}</small>
        </td>
        <td>${formatCurrency(p.price, p.currency)}</td>
        <td>
          ${p.isHazardous ? '<span class="badge-status badge-hazmat"><i class="bi bi-radioactive"></i> HAZ</span>' : ''}
          ${!p.sdsDocumentUrl && p.isHazardous ? '<span class="badge bg-danger ms-1" title="SDS Missing">No SDS</span>' : ''}
          ${p.isArchived ? '<span class="badge bg-secondary ms-1">Archived</span>' : ''}
        </td>
        <td class="table-actions">
          ${p.sdsDocumentUrl ? `<a href="${p.sdsDocumentUrl}" target="_blank" class="btn btn-xs btn-outline-info btn-sm me-1" title="View SDS"><i class="bi bi-file-earmark-text"></i></a>` : ''}
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct('${p._id}')"><i class="bi bi-pencil"></i></button>
          ${!p.isArchived ? `<button class="btn btn-sm btn-outline-danger" onclick="archiveProduct('${p._id}')"><i class="bi bi-archive"></i></button>` : ''}
        </td>
      </tr>`).join('');

    document.getElementById('pagination').innerHTML = `
      <span>Showing ${(page-1)*20+1}–${Math.min(page*20, res.total)} of ${res.total} products</span>
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" ${page <= 1 ? 'disabled' : ''} onclick="loadProducts(${page-1})">‹ Prev</button>
        <button class="btn btn-outline-secondary" ${page >= res.pages ? 'disabled' : ''} onclick="loadProducts(${page+1})">Next ›</button>
      </div>`;
  } catch (err) { showToast(err.message, 'danger'); }
};

const openModal = (product = null) => {
  document.getElementById('modal-title').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('product-id').value = product?._id || '';
  document.getElementById('p-name').value = product?.name || '';
  document.getElementById('p-cas').value = product?.CASNumber || '';
  document.getElementById('p-un').value = product?.UNNumber || '';
  document.getElementById('p-hazard').value = product?.hazardClassification || '';
  document.getElementById('p-storage').value = product?.storageRequirements || '';
  document.getElementById('p-sds').value = product?.sdsDocumentUrl || '';
  document.getElementById('p-unit').value = product?.unitOfMeasure || 'kg';
  document.getElementById('p-stock').value = product?.inventoryLevel ?? 0;
  document.getElementById('p-threshold').value = product?.reorderThreshold ?? 10;
  document.getElementById('p-price').value = product?.price || '';
  document.getElementById('p-currency').value = product?.currency || 'USD';
  document.getElementById('p-hazardous').checked = product?.isHazardous || false;
  modal.show();
};

const editProduct = async (id) => {
  try {
    const { data } = await apiFetch(`/products/${id}`);
    openModal(data);
  } catch (err) { showToast(err.message, 'danger'); }
};

const archiveProduct = async (id) => {
  if (!confirm('Archive this product?')) return;
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    showToast('Product archived');
    loadProducts(currentPage);
  } catch (err) { showToast(err.message, 'danger'); }
};

document.getElementById('btn-add').addEventListener('click', () => openModal());

document.getElementById('save-product').addEventListener('click', async () => {
  const id = document.getElementById('product-id').value;
  const body = {
    name: document.getElementById('p-name').value,
    CASNumber: document.getElementById('p-cas').value,
    UNNumber: document.getElementById('p-un').value,
    hazardClassification: document.getElementById('p-hazard').value,
    storageRequirements: document.getElementById('p-storage').value,
    sdsDocumentUrl: document.getElementById('p-sds').value || undefined,
    unitOfMeasure: document.getElementById('p-unit').value,
    inventoryLevel: Number(document.getElementById('p-stock').value),
    reorderThreshold: Number(document.getElementById('p-threshold').value),
    price: Number(document.getElementById('p-price').value),
    currency: document.getElementById('p-currency').value,
    isHazardous: document.getElementById('p-hazardous').checked
  };
  try {
    if (id) await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
    modal.hide();
    showToast(`Product ${id ? 'updated' : 'created'} successfully`);
    loadProducts(currentPage);
  } catch (err) { showToast(err.message, 'danger'); }
});

document.getElementById('btn-export').addEventListener('click', () => {
  apiDownload('/products/export', 'products.csv').catch(err => showToast(err.message, 'danger'));
});

document.getElementById('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await apiUpload('/products/import', fd);
    showToast(res.message);
    loadProducts();
  } catch (err) { showToast(err.message, 'danger'); }
  e.target.value = '';
});

document.getElementById('search').addEventListener('keydown', e => { if (e.key === 'Enter') loadProducts(); });

loadProducts();
