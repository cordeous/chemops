export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

export const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

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
