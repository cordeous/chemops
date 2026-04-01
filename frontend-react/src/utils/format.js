const VALID_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR']);

export const formatCurrency = (amount, currency = 'USD') => {
  const safeAmount = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  const safeCurrency = VALID_CURRENCIES.has(currency) ? currency : 'USD';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: safeCurrency }).format(safeAmount);
  } catch {
    return `${safeCurrency} ${safeAmount.toFixed(2)}`;
  }
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
};

export const statusBadgeClass = (status) => {
  const map = {
    Verified: 'badge-verified', Paid: 'badge-paid',
    Pending: 'badge-pending',
    Rejected: 'badge-rejected', Overdue: 'badge-overdue', Cancelled: 'badge-cancelled',
    Issued: 'badge-issued', Approved: 'badge-approved',
    Shipped: 'badge-shipped', Invoiced: 'badge-invoiced',
    Draft: 'badge-draft',
    Admin: 'badge-admin', Sales: 'badge-sales', Finance: 'badge-finance', Compliance: 'badge-compliance',
  };
  return map[status] || 'badge-draft';
};

export const STATUS_TRANSITIONS = {
  Pending: ['Approved', 'Cancelled'],
  Approved: ['Shipped', 'Cancelled'],
  Shipped: ['Invoiced'],
  Invoiced: ['Paid'],
  Paid: [], Cancelled: [],
};

/** Clamp a string to maxLen, appending ellipsis if truncated */
export const truncate = (str, maxLen = 50) => {
  if (!str || typeof str !== 'string') return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};
