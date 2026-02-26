const Customer = require('../models/Customer');
const { parseCSVBuffer, toCSV } = require('../utils/csvParser');
const { emitWebhook } = require('../utils/webhookEmitter');

exports.getAll = async (req, res, next) => {
  try {
    const { search, complianceStatus, page = 1, limit = 50 } = req.query;
    const query = {};
    if (complianceStatus) query.complianceStatus = complianceStatus;
    if (search) query.$text = { $search: search };
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ companyName: 1 }).skip((page - 1) * limit).limit(Number(limit)),
      Customer.countDocuments(query)
    ]);
    res.json({ success: true, data: customers, total });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const prev = await Customer.findById(req.params.id);
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    if (prev && prev.complianceStatus !== customer.complianceStatus) {
      await emitWebhook('customer.compliance_changed', { customerId: customer._id, status: customer.complianceStatus });
    }
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { next(err); }
};

exports.importCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const rows = await parseCSVBuffer(req.file.buffer);
    const created = await Customer.insertMany(rows, { ordered: false });
    res.json({ success: true, message: `Imported ${created.length} customers`, data: created });
  } catch (err) { next(err); }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const customers = await Customer.find().lean();
    const fields = ['companyName', 'taxId', 'creditLimit', 'complianceStatus', 'contactName', 'contactEmail', 'contactPhone', 'currency'];
    const csvData = toCSV(customers, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csvData);
  } catch (err) { next(err); }
};
