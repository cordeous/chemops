const crypto = require('crypto');
const axios = require('axios');
const Webhook = require('../models/Webhook');

const emitWebhook = async (event, payload) => {
  const webhooks = await Webhook.find({ events: event, isActive: true });
  const promises = webhooks.map(async (wh) => {
    try {
      const body = JSON.stringify({ event, payload, timestamp: new Date() });
      const sig = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');
      await axios.post(wh.url, body, {
        headers: { 'Content-Type': 'application/json', 'X-ChemOps-Signature': sig },
        timeout: 5000
      });
      await Webhook.findByIdAndUpdate(wh._id, { lastTriggeredAt: new Date() });
    } catch (e) {
      console.error(`Webhook failed for ${wh.url}:`, e.message);
    }
  });
  await Promise.allSettled(promises);
};

module.exports = { emitWebhook };
