const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { toCSV } = require('../utils/csvParser');
const { emitWebhook } = require('../utils/webhookEmitter');

exports.sdsTracker = async (req, res, next) => {
  try {
    const products = await Product.find({ isArchived: false, isHazardous: true })
      .select('name CASNumber hazardClassification sdsDocumentUrl isHazardous')
      .lean();
    const withSDS = products.filter(p => p.sdsDocumentUrl);
    const withoutSDS = products.filter(p => !p.sdsDocumentUrl);
    res.json({
      success: true,
      data: { total: products.length, withSDS: withSDS.length, withoutSDS: withoutSDS.length, products }
    });
  } catch (err) { next(err); }
};

exports.updateCustomerComplianceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const customer = await Customer.findByIdAndUpdate(req.params.id, { complianceStatus: status }, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    await emitWebhook('customer.compliance_changed', { customerId: customer._id, status });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.regulatoryExport = async (req, res, next) => {
  try {
    const products = await Product.find({ isHazardous: true, isArchived: false }).lean();
    const fields = ['name', 'CASNumber', 'UNNumber', 'hazardClassification', 'storageRequirements', 'sdsDocumentUrl', 'unitOfMeasure'];
    const csvData = toCSV(products, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="regulatory_export.csv"');
    res.send(csvData);
  } catch (err) { next(err); }
};
