requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let salesChart, custChart;

const loadSales = async () => {
  const m = document.getElementById('sales-months').value;
  const res = await apiFetch(`/reports/sales?months=${m}`);
  const labels = res.data.map(d => `${months[d._id.month-1]} ${d._id.year}`);
  const revenues = res.data.map(d => d.revenue);
  const orders = res.data.map(d => d.orders);
  if (salesChart) salesChart.destroy();
  salesChart = new Chart(document.getElementById('chart-sales'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Revenue (USD)', data: revenues, backgroundColor: '#1a2e5a', yAxisID: 'y', borderRadius: 4 },
        { label: 'Orders', data: orders, type: 'line', borderColor: '#f07c1e', backgroundColor: 'rgba(240,124,30,0.1)', yAxisID: 'y1', tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { position: 'left', ticks: { callback: v => '$' + v.toLocaleString() } },
        y1: { position: 'right', grid: { drawOnChartArea: false } }
      }
    }
  });
};

const loadTopCustomers = async () => {
  const res = await apiFetch('/reports/top-customers');
  const tbody = document.getElementById('top-cust-tbody');
  tbody.innerHTML = res.data.map((c, i) => `
    <tr>
      <td>${i+1}. <strong>${c.companyName}</strong></td>
      <td>${c.orders}</td>
      <td>${formatCurrency(c.totalSpend)}</td>
    </tr>`).join('');

  if (custChart) custChart.destroy();
  custChart = new Chart(document.getElementById('chart-topcust'), {
    type: 'bar',
    data: {
      labels: res.data.map(c => c.companyName),
      datasets: [{ label: 'Revenue', data: res.data.map(c => c.totalSpend), backgroundColor: ['#1a2e5a','#243b73','#f07c1e','#d96c10','#198754','#0dcaf0','#6f42c1','#fd7e14','#dc3545','#20c997'] }]
    },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
  });
};

const loadMargins = async () => {
  const res = await apiFetch('/reports/margins');
  document.getElementById('margins-tbody').innerHTML = res.data.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.totalQty?.toFixed(0)}</td>
      <td><strong>${formatCurrency(p.totalRevenue)}</strong></td>
      <td>${formatCurrency(p.avgSellPrice)}</td>
    </tr>`).join('');
};

const loadInventory = async () => {
  const res = await apiFetch('/reports/inventory-turnover');
  document.getElementById('inventory-tbody').innerHTML = res.data.map(p => {
    const lowStock = p.inventoryLevel <= p.reorderThreshold;
    return `<tr class="${lowStock ? 'table-warning' : ''}">
      <td>${p.name}</td>
      <td class="${lowStock ? 'text-danger fw-bold' : ''}">${p.inventoryLevel}</td>
      <td>${p.reorderThreshold}</td>
      <td>${formatCurrency(p.price)}</td>
      <td>${p.unitOfMeasure}</td>
      <td>${lowStock ? '<span class="badge bg-warning text-dark">Low Stock</span>' : '<span class="badge bg-success">OK</span>'}</td>
    </tr>`;
  }).join('');
};

const loadExpiry = async () => {
  const res = await apiFetch('/reports/expiration-risk');
  const now = new Date();
  document.getElementById('expiry-tbody').innerHTML = res.data.map(b => {
    const exp = new Date(b.expirationDate);
    const days = Math.ceil((exp - now) / 86400000);
    const cls = days <= 30 ? 'danger' : days <= 60 ? 'warning' : 'success';
    return `<tr>
      <td>${b.productId?.name || '—'}</td>
      <td class="font-monospace small">${b.productId?.CASNumber || '—'}</td>
      <td class="font-monospace small">${b.batchNumber}</td>
      <td>${b.quantity}</td>
      <td>${formatDate(b.expirationDate)}</td>
      <td><span class="badge bg-${cls}">${days}d</span></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-center text-success py-3">No batches expiring soon</td></tr>';
};

const loadHazmat = async () => {
  const res = await apiFetch('/reports/hazmat-sales');
  document.getElementById('hazmat-tbody').innerHTML = res.data.map(p => `
    <tr>
      <td>${p.name}</td>
      <td class="small">${p.hazardClass || '—'}</td>
      <td>${p.totalQty?.toFixed(0)}</td>
      <td><strong>${formatCurrency(p.totalRevenue)}</strong></td>
    </tr>`).join('') || '<tr><td colspan="4" class="text-center text-muted py-3">No hazmat sales found</td></tr>';
};

const loadReceivables = async () => {
  const res = await apiFetch('/reports/outstanding-receivables');
  const now = new Date();
  document.getElementById('receivables-tbody').innerHTML = res.data.map(inv => {
    const customer = inv.orderId?.customerId;
    const overdue = new Date(inv.dueDate) < now;
    return `<tr class="${overdue ? 'table-danger' : ''}">
      <td class="font-monospace small">${inv.invoiceNumber}</td>
      <td>${customer?.companyName || '—'}</td>
      <td><strong>${formatCurrency(inv.totalAmount, inv.currency)}</strong></td>
      <td>${statusBadge(inv.status)}</td>
      <td class="${overdue ? 'text-danger fw-bold' : ''}">${formatDate(inv.dueDate)}</td>
      <td class="small">${customer?.contactEmail || '—'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-center text-success py-3">No outstanding receivables</td></tr>';
};

// Load on tab activation
document.querySelectorAll('#report-tabs .nav-link').forEach(tab => {
  tab.addEventListener('shown.bs.tab', async (e) => {
    const target = e.target.getAttribute('href');
    if (target === '#tab-customers') await loadTopCustomers();
    else if (target === '#tab-margins') await loadMargins();
    else if (target === '#tab-inventory') await loadInventory();
    else if (target === '#tab-expiry') await loadExpiry();
    else if (target === '#tab-hazmat') await loadHazmat();
    else if (target === '#tab-receivables') await loadReceivables();
  });
});

document.getElementById('sales-months').addEventListener('change', loadSales);

// Load default tab
loadSales();
