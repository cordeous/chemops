const Product = require('../models/Product');
const Batch = require('../models/Batch');
const { parseCSVBuffer, toCSV } = require('../utils/csvParser');

exports.getAll = async (req, res, next) => {
  try {
    const { search, hazardous, archived = 'false', page = 1, limit = 50 } = req.query;
    const query = {};
    if (archived !== 'true') query.isArchived = false;
    if (hazardous !== undefined) query.isHazardous = hazardous === 'true';
    if (search) query.$text = { $search: search };

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.archive = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.getBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find({ productId: req.params.id }).sort({ expirationDate: 1 });
    res.json({ success: true, data: batches });
  } catch (err) { next(err); }
};

exports.importCSV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const rows = await parseCSVBuffer(req.file.buffer);
    const created = await Product.insertMany(rows, { ordered: false });
    res.json({ success: true, message: `Imported ${created.length} products`, data: created });
  } catch (err) { next(err); }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const products = await Product.find({ isArchived: false }).lean();
    const fields = ['name', 'CASNumber', 'UNNumber', 'hazardClassification', 'storageRequirements', 'unitOfMeasure', 'inventoryLevel', 'price', 'currency', 'isHazardous'];
    const csvData = toCSV(products, fields);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csvData);
  } catch (err) { next(err); }
};
