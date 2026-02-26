const User = require('../models/User');
const { getLowStockProducts } = require('../utils/alertChecker');

// Simple in-memory feature flags (in production, use DB or env config)
let featureFlags = {
  enableWebhooks: true,
  enableCSVImport: true,
  enablePDFExport: true,
  enableAuditLogs: true,
  maintenanceMode: false
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password required' });
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role });
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { password, ...updates } = req.body;
    if (password) updates.passwordHash = await User.hashPassword(password);
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.getFeatures = (req, res) => {
  res.json({ success: true, data: featureFlags });
};

exports.updateFeatures = (req, res) => {
  featureFlags = { ...featureFlags, ...req.body };
  res.json({ success: true, data: featureFlags });
};

exports.getAlerts = async (req, res, next) => {
  try {
    const lowStock = await getLowStockProducts();
    res.json({ success: true, data: { lowStock } });
  } catch (err) { next(err); }
};
