const Product = require('../models/Product');

const getLowStockProducts = async () => {
  return Product.find({
    isArchived: false,
    $expr: { $lte: ['$inventoryLevel', '$reorderThreshold'] }
  }).select('name inventoryLevel reorderThreshold unitOfMeasure');
};

const checkAndEmitLowStock = async () => {
  const { emitWebhook } = require('./webhookEmitter');
  const lowStock = await getLowStockProducts();
  if (lowStock.length > 0) {
    await emitWebhook('product.low_stock', { products: lowStock });
  }
  return lowStock;
};

module.exports = { getLowStockProducts, checkAndEmitLowStock };
