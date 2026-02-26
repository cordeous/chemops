const Invoice = require('../models/Invoice');

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await Invoice.findOne({ invoiceNumber: { $regex: `^${prefix}` } })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');

  if (!latest) return `${prefix}0001`;

  const lastNum = parseInt(latest.invoiceNumber.split('-')[2], 10);
  const nextNum = String(lastNum + 1).padStart(4, '0');
  return `${prefix}${nextNum}`;
};

module.exports = { generateInvoiceNumber };
