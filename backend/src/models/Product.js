const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  CASNumber: { type: String, trim: true },
  UNNumber: { type: String, trim: true },
  hazardClassification: { type: String, trim: true },
  storageRequirements: { type: String, trim: true },
  sdsDocumentUrl: { type: String, trim: true },
  unitOfMeasure: { type: String, enum: ['kg', 'L', 'drum', 'pallet', 'ton', 'g', 'mL', 'unit'], default: 'kg' },
  inventoryLevel: { type: Number, default: 0, min: 0 },
  reorderThreshold: { type: Number, default: 10, min: 0 },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  isHazardous: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

productSchema.index({ name: 'text', CASNumber: 'text' });

module.exports = mongoose.model('Product', productSchema);
