const PDFDocument = require('pdfkit');

const generateInvoicePDF = (invoice, order, customer, products, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fillColor('#1a2e5a').fontSize(24).text('ChemOps', 50, 50);
  doc.fillColor('#666').fontSize(10).text('Chemical Sales & Billing Platform', 50, 80);

  // Invoice title
  doc.fillColor('#1a2e5a').fontSize(20).text('INVOICE', 400, 50, { align: 'right' });
  doc.fillColor('#444').fontSize(10)
    .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' })
    .text(`Date: ${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 400, 95, { align: 'right' })
    .text(`Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 400, 110, { align: 'right' })
    .text(`Status: ${invoice.status}`, 400, 125, { align: 'right' });

  // Bill to
  doc.moveDown(2);
  doc.fillColor('#1a2e5a').fontSize(12).text('Bill To:', 50, 160);
  doc.fillColor('#444').fontSize(10)
    .text(customer.companyName, 50, 177)
    .text(customer.contactName || '', 50, 192)
    .text(customer.contactEmail || '', 50, 207)
    .text(`${customer.address?.street || ''} ${customer.address?.city || ''}`, 50, 222);

  // Table header
  const tableTop = 270;
  doc.fillColor('#1a2e5a').rect(50, tableTop, 500, 20).fill();
  doc.fillColor('#fff').fontSize(9)
    .text('Product', 55, tableTop + 6)
    .text('Qty', 270, tableTop + 6, { width: 60, align: 'right' })
    .text('Unit Price', 330, tableTop + 6, { width: 80, align: 'right' })
    .text('Total', 410, tableTop + 6, { width: 80, align: 'right' });

  // Table rows
  let y = tableTop + 25;
  order.items.forEach((item, i) => {
    const prod = products.find(p => p._id.toString() === item.productId.toString());
    if (i % 2 === 0) doc.fillColor('#f5f7fa').rect(50, y - 5, 500, 18).fill();
    doc.fillColor('#333').fontSize(9)
      .text(prod?.name || 'Product', 55, y)
      .text(item.quantity.toString(), 270, y, { width: 60, align: 'right' })
      .text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, 330, y, { width: 80, align: 'right' })
      .text(`${invoice.currency} ${item.total.toFixed(2)}`, 410, y, { width: 80, align: 'right' });
    y += 20;
  });

  // Totals
  y += 10;
  doc.moveTo(50, y).lineTo(550, y).strokeColor('#ddd').stroke();
  y += 10;
  doc.fillColor('#444').fontSize(10)
    .text('Subtotal:', 370, y, { width: 80, align: 'right' })
    .text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
  y += 16;
  doc.text('Tax:', 370, y, { width: 80, align: 'right' })
    .text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
  y += 16;
  doc.fillColor('#1a2e5a').fontSize(12)
    .text('Total:', 370, y, { width: 80, align: 'right' })
    .text(`${invoice.currency} ${invoice.totalAmount.toFixed(2)}`, 450, y, { width: 90, align: 'right' });

  // Footer
  doc.fillColor('#999').fontSize(8).text('ChemOps – Chemical Sales & Billing Management Platform', 50, 730, { align: 'center', width: 500 });

  doc.end();
};

module.exports = { generateInvoicePDF };
