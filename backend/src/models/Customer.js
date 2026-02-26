const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  taxId: { type: String, trim: true },
  creditLimit: { type: Number, default: 0, min: 0 },
  complianceStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  contactName: { type: String, trim: true },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String, trim: true },
  currency: { type: String, default: 'USD' },
  notes: { type: String, trim: true }
}, { timestamps: true });

customerSchema.index({ companyName: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
