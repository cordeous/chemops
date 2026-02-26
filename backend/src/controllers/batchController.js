const Batch = require('../models/Batch');
const Product = require('../models/Product');

exports.getAll = async (req, res, next) => {
  try {
    const { productId, expiringSoon } = req.query;
    const query = {};
    if (productId) query.productId = productId;
    if (expiringSoon === 'true') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 30);
      query.expirationDate = { $lte: threshold, $gte: new Date() };
    }
    const batches = await Batch.find(query).populate('productId', 'name CASNumber unitOfMeasure').sort({ expirationDate: 1 });
    res.json({ success: true, data: batches });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('productId', 'name CASNumber');
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const batch = await Batch.create(req.body);
    // Update product inventory level
    await Product.findByIdAndUpdate(req.body.productId, { $inc: { inventoryLevel: req.body.quantity } });
    res.status(201).json({ success: true, data: batch });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    await Product.findByIdAndUpdate(batch.productId, { $inc: { inventoryLevel: -batch.quantity } });
    res.json({ success: true, message: 'Batch deleted' });
  } catch (err) { next(err); }
};
