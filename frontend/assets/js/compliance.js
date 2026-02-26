requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

const loadSDS = async () => {
  try {
    const res = await apiFetch('/compliance/sds-tracker');
    document.getElementById('sds-total').textContent = res.data.total;
    document.getElementById('sds-with').textContent = res.data.withSDS;
    document.getElementById('sds-without').textContent = res.data.withoutSDS;

    document.getElementById('sds-tbody').innerHTML = res.data.products.map(p => `
      <tr class="${!p.sdsDocumentUrl ? 'table-warning' : ''}">
        <td><strong>${p.name}</strong></td>
        <td class="font-monospace small">${p.CASNumber || '—'}</td>
        <td class="small">${p.hazardClassification || '—'}</td>
        <td>
          ${p.sdsDocumentUrl
            ? `<a href="${p.sdsDocumentUrl}" target="_blank" class="btn btn-sm btn-outline-success"><i class="bi bi-file-earmark-text me-1"></i>View SDS</a>`
            : '<span class="text-danger small"><i class="bi bi-exclamation-triangle me-1"></i>Not uploaded</span>'}
        </td>
        <td>
          ${p.sdsDocumentUrl
            ? '<span class="badge bg-success">Compliant</span>'
            : '<span class="badge bg-danger">Non-compliant</span>'}
        </td>
      </tr>`).join('') || '<tr><td colspan="5" class="text-center text-success py-3">All hazardous products have SDS documents</td></tr>';
  } catch (err) { showToast(err.message, 'danger'); }
};

const loadCustomerCompliance = async () => {
  try {
    const res = await apiFetch('/customers?limit=100');
    document.getElementById('compliance-tbody').innerHTML = res.data.map(c => `
      <tr>
        <td><strong>${c.companyName}</strong></td>
        <td class="small">${c.contactName || '—'}<br><span class="text-muted">${c.contactEmail || ''}</span></td>
        <td>${statusBadge(c.complianceStatus)}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-success" onclick="setStatus('${c._id}', 'Verified')" ${c.complianceStatus === 'Verified' ? 'disabled' : ''}>Verify</button>
            <button class="btn btn-outline-warning" onclick="setStatus('${c._id}', 'Pending')" ${c.complianceStatus === 'Pending' ? 'disabled' : ''}>Pending</button>
            <button class="btn btn-outline-danger" onclick="setStatus('${c._id}', 'Rejected')" ${c.complianceStatus === 'Rejected' ? 'disabled' : ''}>Reject</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) { showToast(err.message, 'danger'); }
};

const setStatus = async (id, status) => {
  try {
    await apiFetch(`/compliance/customers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    showToast(`Customer compliance set to ${status}`);
    loadCustomerCompliance();
  } catch (err) { showToast(err.message, 'danger'); }
};

document.getElementById('btn-reg-export').addEventListener('click', () => {
  apiDownload('/compliance/regulatory-export', 'regulatory_export.csv').catch(err => showToast(err.message, 'danger'));
});

loadSDS();
loadCustomerCompliance();
