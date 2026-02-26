const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  events: [{
    type: String,
    enum: ['order.created', 'order.status_changed', 'invoice.created', 'invoice.paid', 'invoice.overdue', 'product.low_stock', 'customer.compliance_changed']
  }],
  secret: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String, trim: true },
  lastTriggeredAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Webhook', webhookSchema);
