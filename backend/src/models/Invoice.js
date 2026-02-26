const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  currency: { type: String, default: 'USD' },
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Issued', 'Paid', 'Overdue'], default: 'Draft' },
  dueDate: { type: Date },
  issuedAt: { type: Date },
  paidAt: { type: Date },
  notes: { type: String, trim: true }
}, { timestamps: true });

invoiceSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
