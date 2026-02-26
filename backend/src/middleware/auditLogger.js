const AuditLog = require('../models/AuditLog');

const auditLog = (entityType, action) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async function (data) {
    if (data && data.success !== false) {
      try {
        const entityId = data.data?._id || req.params?.id;
        if (entityId) {
          await AuditLog.create({
            entityType,
            entityId,
            action,
            changedFields: action === 'UPDATE' ? req.body : undefined,
            userId: req.user?._id,
            timestamp: new Date()
          });
        }
      } catch (e) {
        // Audit logging should never break the response
      }
    }
    return originalJson(data);
  };
  next();
};

module.exports = auditLog;
