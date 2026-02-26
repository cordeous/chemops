requireAuth();
initSidebar();

document.getElementById('logout-btn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = '/index.html';
});

let revenueChart, ordersChart;

const loadDashboard = async () => {
  try {
    const [invoicesRes, ordersRes, salesRes, alertsRes] = await Promise.all([
      apiFetch('/invoices?limit=100'),
      apiFetch('/orders?limit=100'),
      apiFetch('/reports/sales?months=6'),
      apiFetch('/admin/alerts').catch(() => ({ data: { lowStock: [] } }))
    ]);

    // KPIs
    const paidInvoices = invoicesRes.data.filter(i => i.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((s, i) => s + i.totalAmount, 0);
    document.getElementById('kpi-revenue').textContent = formatCurrency(totalRevenue);

    const activeOrders = ordersRes.data.filter(o => !['Paid', 'Cancelled'].includes(o.status));
    document.getElementById('kpi-orders').textContent = activeOrders.length;

    const outstandingInv = invoicesRes.data.filter(i => ['Issued', 'Overdue'].includes(i.status));
    document.getElementById('kpi-invoices').textContent = outstandingInv.length;

    const lowStockCount = alertsRes.data.lowStock.length;
    document.getElementById('kpi-lowstock').textContent = lowStockCount;

    // Revenue chart
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labels = salesRes.data.map(d => `${months[d._id.month - 1]} ${d._id.year}`);
    const values = salesRes.data.map(d => d.revenue);

    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(document.getElementById('chart-revenue'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Revenue (USD)', data: values, backgroundColor: '#1a2e5a', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } }
      }
    });

    // Orders donut
    const statuses = ['Pending', 'Approved', 'Shipped', 'Invoiced', 'Paid', 'Cancelled'];
    const statusColors = ['#ffc107', '#0dcaf0', '#0d6efd', '#6f42c1', '#198754', '#dc3545'];
    const statusCounts = statuses.map(s => ordersRes.data.filter(o => o.status === s).length);

    if (ordersChart) ordersChart.destroy();
    ordersChart = new Chart(document.getElementById('chart-orders'), {
      type: 'doughnut',
      data: {
        labels: statuses,
        datasets: [{ data: statusCounts, backgroundColor: statusColors, borderWidth: 2 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
    });

    // Recent orders table
    const recent = ordersRes.data.slice(0, 8);
    document.getElementById('recent-orders').innerHTML = recent.length
      ? recent.map(o => `
        <tr>
          <td class="font-monospace small">${String(o._id).slice(-8)}</td>
          <td>${o.customerId?.companyName || '—'}</td>
          <td>${formatCurrency(o.totalAmount, o.currency)}</td>
          <td>${statusBadge(o.status)}</td>
          <td class="text-muted small">${formatDate(o.createdAt)}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="text-center text-muted py-3">No orders found</td></tr>';

    // Low stock list
    const lowStock = alertsRes.data.lowStock;
    document.getElementById('low-stock-list').innerHTML = lowStock.length
      ? lowStock.map(p => `
        <div class="list-group-item list-group-item-action alert-low-stock py-2">
          <div class="fw-semibold small">${p.name}</div>
          <div class="text-muted small">${p.inventoryLevel} ${p.unitOfMeasure} remaining (threshold: ${p.reorderThreshold})</div>
        </div>`).join('')
      : '<div class="list-group-item text-center text-success py-3"><i class="bi bi-check-circle me-1"></i>All stock levels OK</div>';

    document.getElementById('last-updated').textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'danger');
  }
};

loadDashboard();
