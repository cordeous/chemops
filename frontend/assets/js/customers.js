requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

const modal = new bootstrap.Modal(document.getElementById('customer-modal'));

const loadCustomers = async () => {
  const search = document.getElementById('search').value;
  const status = document.getElementById('filter-status').value;
  let url = '/customers?limit=50';
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&complianceStatus=${status}`;

  try {
    const res = await apiFetch(url);
    const tbody = document.getElementById('customers-tbody');
    if (!res.data.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="bi bi-people"></i><p>No customers found</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = res.data.map(c => `
      <tr>
        <td><strong>${c.companyName}</strong></td>
        <td>
          <div class="small">${c.contactName || '—'}</div>
          <div class="text-muted small">${c.contactEmail || ''}</div>
        </td>
        <td class="font-monospace small">${c.taxId || '—'}</td>
        <td>${formatCurrency(c.creditLimit)}</td>
        <td>${statusBadge(c.complianceStatus)}</td>
        <td>${c.currency}</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editCustomer('${c._id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer('${c._id}', '${c.companyName}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) { showToast(err.message, 'danger'); }
};

const openModal = (c = null) => {
  document.getElementById('modal-title').textContent = c ? 'Edit Customer' : 'Add Customer';
  document.getElementById('customer-id').value = c?._id || '';
  document.getElementById('c-company').value = c?.companyName || '';
  document.getElementById('c-taxid').value = c?.taxId || '';
  document.getElementById('c-credit').value = c?.creditLimit ?? 0;
  document.getElementById('c-compliance').value = c?.complianceStatus || 'Pending';
  document.getElementById('c-currency').value = c?.currency || 'USD';
  document.getElementById('c-notes').value = c?.notes || '';
  document.getElementById('c-contact-name').value = c?.contactName || '';
  document.getElementById('c-contact-email').value = c?.contactEmail || '';
  document.getElementById('c-contact-phone').value = c?.contactPhone || '';
  document.getElementById('c-street').value = c?.address?.street || '';
  document.getElementById('c-city').value = c?.address?.city || '';
  document.getElementById('c-state').value = c?.address?.state || '';
  document.getElementById('c-postal').value = c?.address?.postalCode || '';
  document.getElementById('c-country').value = c?.address?.country || 'USA';
  modal.show();
};

const editCustomer = async (id) => {
  const { data } = await apiFetch(`/customers/${id}`);
  openModal(data);
};

const deleteCustomer = async (id, name) => {
  if (!confirm(`Delete customer "${name}"?`)) return;
  try {
    await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    showToast('Customer deleted');
    loadCustomers();
  } catch (err) { showToast(err.message, 'danger'); }
};

document.getElementById('btn-add').addEventListener('click', () => openModal());

document.getElementById('save-customer').addEventListener('click', async () => {
  const id = document.getElementById('customer-id').value;
  const body = {
    companyName: document.getElementById('c-company').value,
    taxId: document.getElementById('c-taxid').value,
    creditLimit: Number(document.getElementById('c-credit').value),
    complianceStatus: document.getElementById('c-compliance').value,
    currency: document.getElementById('c-currency').value,
    notes: document.getElementById('c-notes').value,
    contactName: document.getElementById('c-contact-name').value,
    contactEmail: document.getElementById('c-contact-email').value,
    contactPhone: document.getElementById('c-contact-phone').value,
    address: {
      street: document.getElementById('c-street').value,
      city: document.getElementById('c-city').value,
      state: document.getElementById('c-state').value,
      postalCode: document.getElementById('c-postal').value,
      country: document.getElementById('c-country').value
    }
  };
  try {
    if (id) await apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await apiFetch('/customers', { method: 'POST', body: JSON.stringify(body) });
    modal.hide();
    showToast(`Customer ${id ? 'updated' : 'created'}`);
    loadCustomers();
  } catch (err) { showToast(err.message, 'danger'); }
});

document.getElementById('btn-export').addEventListener('click', () => {
  apiDownload('/customers/export', 'customers.csv').catch(err => showToast(err.message, 'danger'));
});

document.getElementById('search').addEventListener('keydown', e => { if (e.key === 'Enter') loadCustomers(); });

loadCustomers();
