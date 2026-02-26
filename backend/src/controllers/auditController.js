const AuditLog = require('../models/AuditLog');

exports.getAll = async (req, res, next) => {
  try {
    const { entityType, userId, from, to, page = 1, limit = 50 } = req.query;
    const query = {};
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);
    res.json({ success: true, data: logs, total });
  } catch (err) { next(err); }
};

exports.getByEntity = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const logs = await AuditLog.find({ entityType, entityId })
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};
