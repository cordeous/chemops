requireAuth();
initSidebar();
document.getElementById('logout-btn').addEventListener('click', e => { e.preventDefault(); localStorage.clear(); location.href='/index.html'; });

const orderModal = new bootstrap.Modal(document.getElementById('order-modal'));
const statusModal = new bootstrap.Modal(document.getElementById('status-modal'));
let allProducts = [], allBatches = [];

const STATUS_TRANSITIONS = {
  Pending: ['Approved', 'Cancelled'],
  Approved: ['Shipped', 'Cancelled'],
  Shipped: ['Invoiced'],
  Invoiced: ['Paid'],
  Paid: [], Cancelled: []
};

const loadOrders = async () => {
  const status = document.getElementById('filter-status').value;
  let url = '/orders?limit=50';
  if (status) url += `&status=${status}`;
  try {
    const res = await apiFetch(url);
    const tbody = document.getElementById('orders-tbody');
    if (!res.data.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><i class="bi bi-cart3"></i><p>No orders found</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = res.data.map(o => `
      <tr>
        <td class="font-monospace small">${String(o._id).slice(-8)}</td>
        <td>${o.customerId?.companyName || '—'}</td>
        <td class="text-muted small">${o.items?.length || 0} item(s)</td>
        <td>${formatCurrency(o.subtotal, o.currency)}</td>
        <td><strong>${formatCurrency(o.totalAmount, o.currency)}</strong></td>
        <td>${statusBadge(o.status)}</td>
        <td class="text-muted small">${formatDate(o.createdAt)}</td>
        <td class="table-actions">
          ${(STATUS_TRANSITIONS[o.status] || []).length > 0
            ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="openStatusModal('${o._id}', '${o.status}')"><i class="bi bi-arrow-right-circle"></i></button>`
            : ''}
        </td>
      </tr>`).join('');
  } catch (err) { showToast(err.message, 'danger'); }
};

const openStatusModal = (orderId, currentStatus) => {
  document.getElementById('status-order-id').value = orderId;
  document.getElementById('current-status').innerHTML = statusBadge(currentStatus);
  const transitions = STATUS_TRANSITIONS[currentStatus] || [];
  document.getElementById('new-status').innerHTML = transitions.map(s => `<option value="${s}">${s}</option>`).join('');
  statusModal.show();
};

document.getElementById('confirm-status').addEventListener('click', async () => {
  const orderId = document.getElementById('status-order-id').value;
  const status = document.getElementById('new-status').value;
  try {
    await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    statusModal.hide();
    showToast(`Order moved to ${status}`);
    loadOrders();
  } catch (err) { showToast(err.message, 'danger'); }
});

// Load customers and products for new order form
const initOrderForm = async () => {
  const [custRes, prodRes] = await Promise.all([
    apiFetch('/customers?complianceStatus=Verified&limit=200'),
    apiFetch('/products?limit=200')
  ]);
  allProducts = prodRes.data;
  const batRes = await apiFetch('/batches?');
  allBatches = batRes.data;

  const custSel = document.getElementById('o-customer');
  custRes.data.forEach(c => custSel.innerHTML += `<option value="${c._id}">${c.companyName}</option>`);

  // Populate first item row
  populateProductSelect(document.querySelector('.item-product'));
};

const populateProductSelect = (sel) => {
  sel.innerHTML = '<option value="">Select product...</option>';
  allProducts.forEach(p => sel.innerHTML += `<option value="${p._id}" data-price="${p.price}">${p.name} (${p.inventoryLevel} ${p.unitOfMeasure})</option>`);
  sel.addEventListener('change', () => {
    const batchSel = sel.closest('.order-item').querySelector('.item-batch');
    const priceInput = sel.closest('.order-item').querySelector('.item-price');
    const productId = sel.value;
    const prod = allProducts.find(p => p._id === productId);
    if (prod) priceInput.value = prod.price;
    batchSel.innerHTML = '<option value="">No batch</option>';
    allBatches.filter(b => b.productId?._id === productId || b.productId === productId)
      .forEach(b => batchSel.innerHTML += `<option value="${b._id}">${b.batchNumber} (${b.quantity})</option>`);
    recalcTotal();
  });
  sel.closest('.order-item').querySelector('.item-qty').addEventListener('input', recalcTotal);
  sel.closest('.order-item').querySelector('.item-price').addEventListener('input', recalcTotal);
};

const recalcTotal = () => {
  let subtotal = 0;
  document.querySelectorAll('.order-item').forEach(row => {
    const qty = Number(row.querySelector('.item-qty').value) || 0;
    const price = Number(row.querySelector('.item-price').value) || 0;
    subtotal += qty * price;
  });
  const taxRate = Number(document.getElementById('o-taxrate').value) || 0;
  const tax = subtotal * (taxRate / 100);
  document.getElementById('calc-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('calc-tax').textContent = formatCurrency(tax);
  document.getElementById('calc-total').textContent = formatCurrency(subtotal + tax);
};

document.getElementById('add-item').addEventListener('click', () => {
  const template = document.querySelector('.order-item').cloneNode(true);
  template.querySelector('.item-product').value = '';
  template.querySelector('.item-batch').innerHTML = '<option value="">No batch</option>';
  template.querySelector('.item-qty').value = 1;
  template.querySelector('.item-price').value = '';
  document.getElementById('order-items').appendChild(template);
  populateProductSelect(template.querySelector('.item-product'));
});

const removeItem = (btn) => {
  const items = document.querySelectorAll('.order-item');
  if (items.length > 1) { btn.closest('.order-item').remove(); recalcTotal(); }
};

document.getElementById('o-taxrate').addEventListener('input', recalcTotal);

document.getElementById('btn-add').addEventListener('click', () => {
  document.getElementById('o-customer').value = '';
  document.getElementById('o-taxrate').value = 10;
  document.getElementById('o-notes').value = '';
  const items = document.getElementById('order-items');
  while (items.children.length > 1) items.lastChild.remove();
  document.querySelector('.item-product').value = '';
  document.querySelector('.item-qty').value = 1;
  document.querySelector('.item-price').value = '';
  recalcTotal();
  orderModal.show();
});

document.getElementById('save-order').addEventListener('click', async () => {
  const customerId = document.getElementById('o-customer').value;
  if (!customerId) { showToast('Please select a customer', 'warning'); return; }

  const items = [];
  let valid = true;
  document.querySelectorAll('.order-item').forEach(row => {
    const productId = row.querySelector('.item-product').value;
    const batchId = row.querySelector('.item-batch').value;
    const quantity = Number(row.querySelector('.item-qty').value);
    const unitPrice = Number(row.querySelector('.item-price').value);
    if (!productId || !quantity || !unitPrice) { valid = false; return; }
    items.push({ productId, batchId: batchId || undefined, quantity, unitPrice });
  });

  if (!valid || !items.length) { showToast('Please fill all item fields', 'warning'); return; }

  const body = {
    customerId,
    items,
    taxRate: Number(document.getElementById('o-taxrate').value),
    currency: document.getElementById('o-currency').value,
    notes: document.getElementById('o-notes').value
  };

  try {
    await apiFetch('/orders', { method: 'POST', body: JSON.stringify(body) });
    orderModal.hide();
    showToast('Order created successfully');
    loadOrders();
  } catch (err) { showToast(err.message, 'danger'); }
});

document.getElementById('btn-export').addEventListener('click', () => {
  apiDownload('/export/orders', 'orders.csv').catch(err => showToast(err.message, 'danger'));
});

(async () => { await initOrderForm(); await loadOrders(); })();
