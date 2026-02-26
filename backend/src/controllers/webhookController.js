const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const { emitWebhook } = require('../utils/webhookEmitter');

exports.getAll = async (req, res, next) => {
  try {
    const webhooks = await Webhook.find().sort({ createdAt: -1 });
    res.json({ success: true, data: webhooks });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const secret = req.body.secret || crypto.randomBytes(32).toString('hex');
    const webhook = await Webhook.create({ ...req.body, secret, createdBy: req.user._id });
    res.status(201).json({ success: true, data: webhook });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const webhook = await Webhook.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found' });
    res.json({ success: true, data: webhook });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const webhook = await Webhook.findByIdAndDelete(req.params.id);
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found' });
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (err) { next(err); }
};

exports.test = async (req, res, next) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) return res.status(404).json({ success: false, message: 'Webhook not found' });
    // Temporarily override and fire a test event
    const events = webhook.events.length > 0 ? webhook.events : ['order.created'];
    await emitWebhook(events[0], { test: true, webhookId: webhook._id });
    res.json({ success: true, message: 'Test event fired' });
  } catch (err) { next(err); }
};
