const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');

exports.salesPerformance = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - Number(months));
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $in: ['Paid', 'Invoiced', 'Shipped'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.revenue = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const groupBy = period === 'quarterly'
      ? { year: { $year: '$createdAt' }, quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } }
      : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    const data = await Invoice.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: groupBy, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.topCustomers = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Invoiced'] } } },
      { $group: { _id: '$customerId', totalSpend: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $project: { companyName: '$customer.companyName', totalSpend: 1, orders: 1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.inventoryTurnover = async (req, res, next) => {
  try {
    const data = await Product.find({ isArchived: false })
      .select('name inventoryLevel reorderThreshold unitOfMeasure price')
      .sort({ inventoryLevel: 1 })
      .lean();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.productMargins = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', totalRevenue: { $sum: '$items.total' }, totalQty: { $sum: '$items.quantity' } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { name: '$product.name', totalRevenue: 1, totalQty: 1, unitPrice: '$product.price', avgSellPrice: { $divide: ['$totalRevenue', '$totalQty'] } } },
      { $sort: { totalRevenue: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.expirationRisk = async (req, res, next) => {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 90);
    const batches = await Batch.find({ expirationDate: { $lte: threshold, $gte: new Date() } })
      .populate('productId', 'name CASNumber isHazardous')
      .sort({ expirationDate: 1 });
    res.json({ success: true, data: batches });
  } catch (err) { next(err); }
};

exports.hazmatSales = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $match: { 'product.isHazardous': true } },
      { $group: { _id: '$items.productId', name: { $first: '$product.name' }, hazardClass: { $first: '$product.hazardClassification' }, totalRevenue: { $sum: '$items.total' }, totalQty: { $sum: '$items.quantity' } } },
      { $sort: { totalRevenue: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.outstandingReceivables = async (req, res, next) => {
  try {
    const data = await Invoice.find({ status: { $in: ['Issued', 'Overdue'] } })
      .populate({ path: 'orderId', populate: { path: 'customerId', select: 'companyName contactEmail' } })
      .sort({ dueDate: 1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
