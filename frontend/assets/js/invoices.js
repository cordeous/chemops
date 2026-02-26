requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

const loadInvoices = async () => {
  const status = document.getElementById('filter-status').value;
  let url = '/invoices?limit=50';
  if (status) url += `&status=${status}`;
  try {
    const res = await apiFetch(url);
    const tbody = document.getElementById('invoices-tbody');
    if (!res.data.length) {
      tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><i class="bi bi-receipt"></i><p>No invoices found</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = res.data.map(inv => {
      const customer = inv.orderId?.customerId;
      const isOverdue = inv.status === 'Overdue';
      return `<tr class="${isOverdue ? 'table-danger' : ''}">
        <td class="font-monospace"><strong>${inv.invoiceNumber}</strong></td>
        <td>${customer?.companyName || '—'}</td>
        <td>${formatCurrency(inv.subtotal, inv.currency)}</td>
        <td>${formatCurrency(inv.taxAmount, inv.currency)}</td>
        <td><strong>${formatCurrency(inv.totalAmount, inv.currency)}</strong></td>
        <td>${statusBadge(inv.status)}</td>
        <td class="${isOverdue ? 'text-danger fw-bold' : 'text-muted'} small">${formatDate(inv.dueDate)}</td>
        <td class="text-muted small">${formatDate(inv.issuedAt)}</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="downloadPDF('${inv._id}', '${inv.invoiceNumber}')" title="Download PDF">
            <i class="bi bi-file-earmark-pdf"></i>
          </button>
          ${['Issued', 'Overdue'].includes(inv.status)
            ? `<button class="btn btn-sm btn-success" onclick="markPaid('${inv._id}')"><i class="bi bi-check-lg me-1"></i>Mark Paid</button>`
            : ''}
          ${inv.status === 'Draft'
            ? `<button class="btn btn-sm btn-primary ms-1" onclick="updateStatus('${inv._id}', 'Issued')">Issue</button>`
            : ''}
        </td>
      </tr>`;
    }).join('');
  } catch (err) { showToast(err.message, 'danger'); }
};

const downloadPDF = (id, invNumber) => {
  apiDownload(`/invoices/${id}/pdf`, `${invNumber}.pdf`).catch(err => showToast(err.message, 'danger'));
};

const markPaid = async (id) => {
  if (!confirm('Mark this invoice as Paid?')) return;
  await updateStatus(id, 'Paid');
};

const updateStatus = async (id, status) => {
  try {
    await apiFetch(`/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    showToast(`Invoice marked as ${status}`);
    loadInvoices();
  } catch (err) { showToast(err.message, 'danger'); }
};

loadInvoices();
