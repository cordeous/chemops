const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Invoice = require('../models/Invoice');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');
const { emitWebhook } = require('../utils/webhookEmitter');
const { checkAndEmitLowStock } = require('../utils/alertChecker');

const STATUS_TRANSITIONS = {
  Pending: ['Approved', 'Cancelled'],
  Approved: ['Shipped', 'Cancelled'],
  Shipped: ['Invoiced'],
  Invoiced: ['Paid'],
  Paid: [],
  Cancelled: []
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, customerId, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'companyName complianceStatus')
        .populate('items.productId', 'name unitOfMeasure')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, data: orders, total });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId')
      .populate('items.productId')
      .populate('items.batchId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { customerId, items, taxRate = 0, currency, notes } = req.body;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (customer.complianceStatus !== 'Verified') {
      return res.status(400).json({ success: false, message: 'Customer compliance is not verified. Cannot create order.' });
    }

    // Calculate totals
    let subtotal = 0;
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (!product) throw { statusCode: 404, message: `Product ${item.productId} not found` };
      const unitPrice = item.unitPrice || product.price;
      const total = unitPrice * item.quantity;
      subtotal += total;
      return { ...item, unitPrice, total };
    }));

    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const order = await Order.create({
      customerId, items: enrichedItems, currency: currency || customer.currency,
      subtotal, taxRate, taxAmount, totalAmount, notes, createdBy: req.user._id
    });

    await emitWebhook('order.created', { orderId: order._id, customerId, totalAmount });
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('items.productId').populate('items.batchId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot transition from ${order.status} to ${status}` });
    }

    // On Approved: decrement inventory
    if (status === 'Approved') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { inventoryLevel: -item.quantity } });
        if (item.batchId) {
          await Batch.findByIdAndUpdate(item.batchId, { $inc: { quantity: -item.quantity } });
        }
      }
      await checkAndEmitLowStock();
    }

    // On Invoiced: auto-create invoice
    if (status === 'Invoiced') {
      const invoiceNumber = await generateInvoiceNumber();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const invoice = await Invoice.create({
        orderId: order._id,
        invoiceNumber,
        currency: order.currency,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        totalAmount: order.totalAmount,
        status: 'Issued',
        dueDate,
        issuedAt: new Date()
      });
      await emitWebhook('invoice.created', { invoiceId: invoice._id, invoiceNumber, totalAmount: order.totalAmount });
    }

    order.status = status;
    await order.save();

    await emitWebhook('order.status_changed', { orderId: order._id, status });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be edited' });
    }
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('customerId', 'companyName').lean();
    const { toCSV } = require('../utils/csvParser');
    const flat = orders.map(o => ({
      orderId: o._id,
      customer: o.customerId?.companyName,
      status: o.status,
      totalAmount: o.totalAmount,
      currency: o.currency,
      createdAt: o.createdAt
    }));
    const csvData = toCSV(flat, ['orderId', 'customer', 'status', 'totalAmount', 'currency', 'createdAt']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csvData);
  } catch (err) { next(err); }
};
