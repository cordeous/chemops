const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchNumber: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  expirationDate: { type: Date },
  warehouseLocation: { type: String, trim: true }
}, { timestamps: true });

batchSchema.index({ productId: 1 });
batchSchema.index({ expirationDate: 1 });

module.exports = mongoose.model('Batch', batchSchema);
