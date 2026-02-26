const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { emitWebhook } = require('../utils/webhookEmitter');

// Mark overdue invoices
const updateOverdue = async () => {
  await Invoice.updateMany(
    { status: 'Issued', dueDate: { $lt: new Date() } },
    { $set: { status: 'Overdue' } }
  );
};

exports.getAll = async (req, res, next) => {
  try {
    await updateOverdue();
    const { status, page = 1, limit = 50 } = req.query;
    const query = status ? { status } : {};
    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate({ path: 'orderId', populate: { path: 'customerId', select: 'companyName' } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Invoice.countDocuments(query)
    ]);
    res.json({ success: true, data: invoices, total });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({ path: 'orderId', populate: [{ path: 'customerId' }, { path: 'items.productId' }] });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { generateInvoiceNumber } = require('../utils/invoiceNumber');
    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const invoice = await Invoice.create({ ...req.body, invoiceNumber, dueDate, issuedAt: new Date() });
    await emitWebhook('invoice.created', { invoiceId: invoice._id, invoiceNumber });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === 'Paid' ? { paidAt: new Date() } : {}) },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (status === 'Paid') {
      await Order.findByIdAndUpdate(invoice.orderId, { status: 'Paid' });
      await emitWebhook('invoice.paid', { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber });
    }
    if (status === 'Overdue') {
      await emitWebhook('invoice.overdue', { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber });
    }

    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const order = await Order.findById(invoice.orderId).populate('items.productId');
    const customer = await Customer.findById(order.customerId);
    const products = order.items.map(i => i.productId);

    generateInvoicePDF(invoice, order, customer, products, res);
  } catch (err) { next(err); }
};
