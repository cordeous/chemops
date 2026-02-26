const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityType: { type: String, required: true, enum: ['Product', 'Batch', 'Customer', 'Order', 'Invoice', 'User', 'Webhook'] },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ARCHIVE'] },
  changedFields: { type: mongoose.Schema.Types.Mixed },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
